import { inject, Injectable, OnDestroy } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  Firestore,
  onSnapshot,
  updateDoc,
  addDoc,
} from '@angular/fire/firestore';
import { SingleTask } from '../interfaces/single-task';
import { BehaviorSubject, Observable } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';

@Injectable({
  providedIn: 'root',
})
export class TasksService implements OnDestroy {
  tasksDB: Firestore = inject(Firestore);
  breakpointObserver = inject(BreakpointObserver);

  tasks: SingleTask[] = [];
  /** Die aktuell im Dialog angezeigte Task (null = Dialog geschlossen). */
  activeTask: SingleTask | null = null;
  unsubTasks;
  smallView: boolean = false;
  currentTask!: SingleTask;
  currentStatus: string = 'To Do';

  private openAddTaskDialogSubject = new BehaviorSubject<boolean>(false);
  openAddTaskDialog$: Observable<boolean> = this.openAddTaskDialogSubject.asObservable();
  addTaskDialogIsOpen: boolean = false;

  private taskEditModeSubject = new BehaviorSubject<boolean>(false);
  taskEditMode$: Observable<boolean> = this.taskEditModeSubject.asObservable();
  editMode = false;

  private taskSuccessDialogActiveSubject = new BehaviorSubject<boolean>(false);
  successDialogOpen$: Observable<boolean> = this.taskSuccessDialogActiveSubject.asObservable();
  taskSuccessDialogActive: boolean = false;

  constructor() {
    this.unsubTasks = this.subTasksArr();
    this.initBreakpointObserver();
  }

  private initBreakpointObserver(): void {
    this.breakpointObserver.observe(['(max-width:850px)']).subscribe((result) => {
      this.smallView = result.matches;
      if (this.addTaskDialogIsOpen) {
        this.openAddTaskDialogSubject.next(true);
      } else {
        // this.openAddTaskDialogSubject.next(false);
      }
    });
  }

  setTaskObject(obj: any, id: string): SingleTask {
    return {
      id: id,
      status: obj.status || 'To do',
      title: obj.title,
      description: obj.description || '',
      dueDate: obj.dueDate,
      priority: obj.priority || 'Medium',
      assigned: obj.assigned || [],
      category: obj.category || 'User Story',
      subtasks: obj.subtasks || [],
      order: obj.order ?? 0,
    };
  }

  subTasksArr() {
    return onSnapshot(this.getTasksRef(), (arr) => {
      this.tasks = [];
      arr.forEach((element) => {
        this.tasks.push(this.setTaskObject(element.data(), element.id));
      });
      this.refreshActiveTask();
    });
  }

  /**
   * Aktualisiert die activeTask mit den neuesten Daten aus Firebase.
   * Wird nach jedem onSnapshot aufgerufen, damit der Dialog
   * immer aktuelle Daten zeigt (z.B. nach Subtask-Toggle).
   */
  private refreshActiveTask(): void {
    if (!this.activeTask?.id) return;
    const updated = this.tasks.find((t) => t.id === this.activeTask!.id);
    this.activeTask = updated || null;
  }

  getTasksRef() {
    return collection(this.tasksDB, 'tasks');
  }

  /**
   * Gibt die Referenz zu einem einzelnen Task-Dokument zurück.
   * Wird intern genutzt, um gezielt ein Dokument zu lesen oder zu ändern.
   * @param taskId - Die eindeutige Firebase-ID der Task
   * @returns Die Dokument-Referenz für diese Task
   */
  private getSingleTaskRef(taskId: string) {
    return doc(this.tasksDB, 'tasks', taskId);
  }

  /**
   * Aktualisiert den Status einer Task in Firebase.
   * Wird nach Drag & Drop aufgerufen, um den neuen Spaltenstatus zu speichern.
   * @param taskId - Die eindeutige Firebase-ID der Task
   * @param newStatus - Der neue Status ('To do', 'In progress', etc.)
   */
  async updateTaskStatus(taskId: string, newStatus: string): Promise<void> {
    const taskRef = this.getSingleTaskRef(taskId);
    await updateDoc(taskRef, { status: newStatus });
  }

  /**
   * Aktualisiert Status und Position mehrerer Tasks gleichzeitig.
   * Wird nach Drag & Drop aufgerufen, um die neue Reihenfolge zu speichern.
   * Jeder Task bekommt seinen Index als order-Wert (0, 1, 2, ...).
   * @param tasks - Die Tasks in ihrer neuen Reihenfolge
   * @param newStatus - Der Spalten-Status für alle Tasks in dieser Liste
   */
  async updateTaskPositions(tasks: SingleTask[], newStatus: string): Promise<void> {
    const updates = tasks.map((task, index) => this.updateSinglePosition(task, index, newStatus));
    await Promise.all(updates);
  }

  /**
   * Aktualisiert Status und Position einer einzelnen Task.
   * Wird intern von updateTaskPositions() aufgerufen.
   * @param task - Die zu aktualisierende Task
   * @param index - Die neue Position (0 = ganz oben)
   * @param newStatus - Der Spalten-Status
   */
  private async updateSinglePosition(
    task: SingleTask,
    index: number,
    newStatus: string,
  ): Promise<void> {
    if (!task.id) return;
    const taskRef = this.getSingleTaskRef(task.id);
    await updateDoc(taskRef, { status: newStatus, order: index });
  }

  /* ================================================================
   * Dialog-Steuerung
   * ================================================================ */

  /**
   * Öffnet den Task-Detail-Dialog für eine bestimmte Task.
   * @param taskId - Die ID der anzuzeigenden Task
   */
  openTaskDialog(taskId: string): void {
    this.activeTask = this.tasks.find((t) => t.id === taskId) || null;
  }

  /**
   * Schließt den Task-Detail-Dialog.
   * Setzt activeTask auf null – das @if im Template blendet den Dialog aus.
   */
  closeTaskDialog(): void {
    this.activeTask = null;
  }

  /**
   * Löscht eine Task endgültig aus Firebase.
   * @param taskId - Die ID der zu löschenden Task
   */
  async deleteTask(taskId: string): Promise<void> {
    const taskRef = this.getSingleTaskRef(taskId);
    await deleteDoc(taskRef);
  }

  /**
   * Aktualisiert den completed-Status eines Subtasks.
   * Liest die aktuelle Subtask-Liste, ändert den Ziel-Subtask,
   * und schreibt die gesamte Liste zurück nach Firebase.
   * @param taskId - Die ID der übergeordneten Task
   * @param subtaskId - Die ID des Subtasks
   * @param completed - Der neue Status (true/false)
   */
  async updateSubtaskStatus(taskId: string, subtaskId: string, completed: boolean): Promise<void> {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task?.subtasks) return;
    const updatedSubtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed } : st,
    );
    const taskRef = this.getSingleTaskRef(taskId);
    await updateDoc(taskRef, { subtasks: updatedSubtasks });
  }

  ngOnDestroy() {
    if (this.unsubTasks) this.unsubTasks();
  }

  openAddTaskDialog(status: 'To do' | 'In progress' | 'Await feedback' | 'Done') {
    this.openAddTaskDialogSubject.next(true);
    this.addTaskDialogIsOpen = true;
    this.setStatus(status);
  }

  closeAddTaskDialog() {
    this.openAddTaskDialogSubject.next(false);
    this.addTaskDialogIsOpen = false;
  }

  startEditMode() {

    this.taskEditModeSubject.next(true);
    this.editMode = true;
  }

  exidEditMode(task: SingleTask) {
    this.taskEditModeSubject.next(false);
    this.editMode = false;
    this.updateTask(task);
  }

  async updateTask(task: SingleTask) {
    if (task.id) {
      try {
        let docRef = this.getSingleTaskRef(task.id);
        await updateDoc(docRef, this.getCleanJson(task));
      } catch (error) {
        console.log(error);
      }
      this.currentTask = task;
    }
  }

  getCleanJson(obj: SingleTask) {
    return {
      id: obj.id,
      status: obj.status || 'To do',
      title: obj.title,
      description: obj.description || '',
      dueDate: obj.dueDate,
      priority: obj.priority || 'Medium',
      assigned: obj.assigned || [],
      category: obj.category || 'User Story',
      subtasks: obj.subtasks || [],
      order: obj.order ?? 0,
    };
  }

  /**
   * Erstellt eine neue Task in Firebase
   * @param task - Die zu speichernde Task (ohne ID)
   * @returns Promise mit der erstellten Dokument-Referenz
   */
  async addTask(task: SingleTask): Promise<any> {
    try {
      // ID entfernen (wird von Firebase generiert)
      const { id, ...taskData } = task;

      // Neue Task ans Ende der 'To do' Spalte
      const todoTasks = this.tasks.filter((t) => t.status === 'To do');
      const newTask = {
        ...taskData,
        order: todoTasks.length, // Länge = nächster freier Index
        status: this.currentStatus,
      };

      const docRef = await addDoc(this.getTasksRef(), newTask);
      console.log('Task added:', docRef.id);
      this.resetStatus();
      return docRef;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }

  setStatus(status: 'To do' | 'In progress' | 'Await feedback' | 'Done') {
    this.currentStatus = status;
  }

  resetStatus() {
    this.currentStatus = 'To do';
  }

  openTaskSuccessDialog() {
    this.taskSuccessDialogActiveSubject.next(true);
    this.taskSuccessDialogActive = true;
    setTimeout(() => {
      this.taskSuccessDialogActiveSubject.next(false);
      this.taskSuccessDialogActive = false;
    }, 3000);
  }

/**
   * Gibt die Task mit dem nächsten Fälligkeitsdatum zurück.
   * Berücksichtigt nur Tasks mit gültigem dueDate ab heute.
   * @returns Die Task mit dem nächsten Deadline oder null
   */
  get upcomingTask(): SingleTask | null {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureTasks = this.tasks.filter((task) => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate) >= today;
    });

    if (futureTasks.length === 0) return null;

    return futureTasks.reduce((nearest, task) => {
      return new Date(task.dueDate) < new Date(nearest.dueDate) ? task : nearest;
    });
  }

  /**
   * Gibt den SVG-Pfad für das Priority-Icon der nächsten Task zurück.
   * Fallback: medium-summary.svg wenn keine Task vorhanden ist.
   * @returns Pfad zum entsprechenden Priority-Icon
   */
  get upcomingTaskPriorityIcon(): string {
    const priority = this.upcomingTask?.priority ?? 'Medium';
    const icons: Record<string, string> = {
      Urgent: 'assets/icons/urgent-summary.svg',
      Medium: 'assets/icons/medium-summary.svg',
      Low:    'assets/icons/low-summary.svg',
    };
    return icons[priority] ?? icons['Medium'];
  }

}