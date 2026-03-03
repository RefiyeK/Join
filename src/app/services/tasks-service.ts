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
  /** The task currently shown in the dialog (null = dialog closed). */
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

  /**
   * Converts any object and an ID into a SingleTask object
   * @param obj Any object with task data
   * @param id Firebase document ID
   * @returns SingleTask object
   */
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

  /**
   * Subscribes to tasks from Firestore and updates the local array
   */
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
   * Updates the activeTask with the latest data from Firebase.
   * Called after each onSnapshot so the dialog always shows up-to-date data (e.g. after subtask toggle).
   */
  private refreshActiveTask(): void {
    if (!this.activeTask?.id) return;
    const updated = this.tasks.find((t) => t.id === this.activeTask!.id);
    this.activeTask = updated || null;
  }

  /**
   * Returns the reference to the tasks collection
   */
  getTasksRef() {
    return collection(this.tasksDB, 'tasks');
  }

  /**
   * Returns the reference to a single task document.
   * Used internally to specifically read or change a document.
   * @param taskId - The unique Firebase ID of the task
   * @returns The document reference for this task
   */
  private getSingleTaskRef(taskId: string) {
    return doc(this.tasksDB, 'tasks', taskId);
  }

  /**
   * Updates the status of a task in Firebase.
   * Called after drag & drop to save the new column status.
   * @param taskId - The unique Firebase ID of the task
   * @param newStatus - The new status ('To do', 'In progress', etc.)
   */
  async updateTaskStatus(taskId: string, newStatus: string): Promise<void> {
    const taskRef = this.getSingleTaskRef(taskId);
    await updateDoc(taskRef, { status: newStatus });
  }

  /**
   * Updates status and position of multiple tasks at once.
   * Called after drag & drop to save the new order.
   * Each task gets its index as order value (0, 1, 2, ...).
   * @param tasks - The tasks in their new order
   * @param newStatus - The column status for all tasks in this list
   */
  async updateTaskPositions(tasks: SingleTask[], newStatus: string): Promise<void> {
    const updates = tasks.map((task, index) => this.updateSinglePosition(task, index, newStatus));
    await Promise.all(updates);
  }

  /**
   * Updates status and position of a single task.
   * Called internally by updateTaskPositions().
   * @param task - The task to update
   * @param index - The new position (0 = top)
   * @param newStatus - The column status
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
   * Dialog control
   * ================================================================ */

  /**
   * Opens the task detail dialog for a specific task.
   * @param taskId - The ID of the task to display
   */
  openTaskDialog(taskId: string): void {
    this.activeTask = this.tasks.find((t) => t.id === taskId) || null;
  }

  /**
   * Closes the task detail dialog.
   * Sets activeTask to null – the @if in the template hides the dialog.
   */
  closeTaskDialog(): void {
    this.activeTask = null;
  }

  /**
   * Permanently deletes a task from Firebase.
   * @param taskId - The ID of the task to delete
   */
  async deleteTask(taskId: string): Promise<void> {
    const taskRef = this.getSingleTaskRef(taskId);
    await deleteDoc(taskRef);
  }

  /**
   * Updates the completed status of a subtask.
   * Reads the current subtask list, changes the target subtask,
   * and writes the entire list back to Firebase.
   * @param taskId - The ID of the parent task
   * @param subtaskId - The ID of the subtask
   * @param completed - The new status (true/false)
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

  /**
   * Called when the service is destroyed to clean up subscriptions
   */
  ngOnDestroy() {
    if (this.unsubTasks) this.unsubTasks();
  }

  /**
   * Opens the dialog to add a new task and sets the status
   * @param status Status of the new task
   */
  openAddTaskDialog(status: 'To do' | 'In progress' | 'Await feedback' | 'Done') {
    this.openAddTaskDialogSubject.next(true);
    this.addTaskDialogIsOpen = true;
    this.setStatus(status);
  }

  /**
   * Closes the dialog to add a new task
   */
  closeAddTaskDialog() {
    this.openAddTaskDialogSubject.next(false);
    this.addTaskDialogIsOpen = false;
  }

  /**
   * Starts edit mode for a task
   */
  startEditMode() {
    this.taskEditModeSubject.next(true);
    this.editMode = true;
  }

  /**
   * Ends edit mode and saves the changes
   * @param task The edited task
   */
  exidEditMode(task: SingleTask) {
    this.taskEditModeSubject.next(false);
    this.editMode = false;
    this.updateTask(task);
  }

  /**
   * Updates a task in Firebase
   * @param task The task to update
   */
  async updateTask(task: SingleTask) {
    if (task.id) {
      try {
        let docRef = this.getSingleTaskRef(task.id);
        await updateDoc(docRef, this.getCleanJson(task));
      } catch (error) {}
      this.currentTask = task;
    }
  }

  /**
   * Returns a cleaned JSON object for the task
   * @param obj SingleTask object
   * @returns Cleaned object
   */
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
   * Creates a new task in Firebase
   * @param task - The task to save (without ID)
   * @returns Promise with the created document reference
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
      this.resetStatus();
      return docRef;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }

  /**
   * Sets the current status for new tasks
   * @param status Status
   */
  setStatus(status: 'To do' | 'In progress' | 'Await feedback' | 'Done') {
    this.currentStatus = status;
  }

  /**
   * Resets the status to "To do"
   */
  resetStatus() {
    this.currentStatus = 'To do';
  }

  /**
   * Opens the success dialog after adding a task
   */
  openTaskSuccessDialog() {
    this.taskSuccessDialogActiveSubject.next(true);
    this.taskSuccessDialogActive = true;
    setTimeout(() => {
      this.taskSuccessDialogActiveSubject.next(false);
      this.taskSuccessDialogActive = false;
    }, 3000);
  }

  /**
   * Returns the task with the next due date.
   * Only considers tasks with a valid dueDate from today onwards.
   * @returns The task with the next deadline or null
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
   * Returns the SVG path for the priority icon of the next task.
   * Fallback: medium-summary.svg if no task is present.
   * @returns Path to the corresponding priority icon
   */
  get upcomingTaskPriorityIcon(): string {
    const priority = this.upcomingTask?.priority ?? 'Medium';
    const icons: Record<string, string> = {
      Urgent: 'assets/icons/urgent-summary.svg',
      Medium: 'assets/icons/medium-summary.svg',
      Low: 'assets/icons/low-summary.svg',
    };
    return icons[priority] ?? icons['Medium'];
  }
}
