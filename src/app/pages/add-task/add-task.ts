import { Component, inject, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Nav } from '../../shared/components/nav/nav';
import { Header } from '../../shared/components/header/header';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { TasksService } from '../../services/tasks-service';
import { ContactsService } from '../../services/contacts-service';
import { SingleTask } from '../../interfaces/single-task';
import { SingleContact } from '../../interfaces/single-contact';
import { AssignedAvatarItem } from '../../interfaces/assigned-avatar';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth-service';

/**
 * Interface für Fehlerstatus von Feldern
 */
interface FieldErrorState {
  [key: string]: boolean;
}

@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [Nav, Header, CommonModule, FormsModule],
  templateUrl: './add-task.html',
  styleUrl: './add-task.scss',
})
export class AddTask implements OnInit, OnDestroy {
  @ViewChild('taskForm') taskForm!: NgForm;
  @ViewChild('editInput') editInput!: ElementRef;

  tasksService = inject(TasksService);
  contactsService = inject(ContactsService);
  authService = inject(AuthService);

  private subEditMode!: Subscription;

  /** Kontakte als Array für das Template */
  contacts: SingleContact[] = [];
  loadingContacts: boolean = false;

  /** Subscription für Kontakte */
  private contactsSubscription?: Subscription;

  /** Minimales Datum für heute und Zukunft */
  minDate: string = new Date().toISOString().split('T')[0];
  statusCondition: string = this.tasksService.currentStatus;

  /** Dropdown für Zuweisung */
  isOpen = false;
  selectedOption: string = 'Select contacts to assign';
  options: string[] = ['Option_1', 'Option_2', 'Option_3'];

  /**
   * Öffnet oder schließt das Zuweisungs-Dropdown
   */
  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  /**
   * Schließt das Zuweisungs-Dropdown
   */
  closeDropdown() {
    this.isOpen = false;
  }

  /** Dropdown für Kategorie */
  isCategoryOpen = false;
  selectedCategory: string = 'Select category';
  categoryOptions: string[] = ['Technical Task', 'User Story'];

  /**
   * Öffnet oder schließt das Kategorie-Dropdown
   */
  toggleCategoryDropdown() {
    this.isCategoryOpen = !this.isCategoryOpen;
  }

  /**
   * Wählt eine Kategorie aus
   * @param option Kategorieoption
   */
  selectCategory(option: string) {
    if (option === 'Technical Task' || option === 'User Story') {
      this.selectedCategory = option;
      this.taskData.category = option;
      this.updateFieldError('category');
    }
    this.isCategoryOpen = false;
  }

  /**
   * Schließt das Kategorie-Dropdown
   */
  closeCategoryDropdown() {
    this.isCategoryOpen = false;
  }

  /** Status des Formulars */
  formSubmitted: boolean = false;
  fieldErrors: FieldErrorState = {
    title: false,
    dueDate: false,
    category: false,
  };

  /** Pflichtfelder für Validierung */
  private readonly requiredFields = ['title', 'dueDate', 'category'] as const;

  /** Task-Datenobjekt */
  taskData: Partial<SingleTask> = {
    status: this.statusCondition,
    title: '',
    description: '',
    dueDate: '',
    priority: 'Medium',
    assigned: [],
    category: 'User Story',
    subtasks: [],
    order: 0,
  };

  /** Subtask-Handling */
  newSubtaskTitle: string = '';

  editingSubtaskIndex: number | null = null;
  editingSubtaskTitle: string = '';
  originalSubtaskTitle: string = '';

  assignedPreviewUsers: AssignedAvatarItem[] = [];
  assignedRemainingCount: number = 0;

  /**
   * Initialisiert die Komponente und lädt Kontakte
   */
  async ngOnInit() {
    this.subEditMode = this.tasksService.taskEditMode$.subscribe((editMode) => {
      if (editMode) {
        this.setCurrentTaskData(this.tasksService.currentTask);
      } else {
        this.clearForm();
      }
    });

    await this.loadContacts();
  }

  /**
   * Bereinigt Subscriptions beim Zerstören der Komponente
   */
  ngOnDestroy() {
    if (this.contactsSubscription) {
      this.contactsSubscription.unsubscribe();
    }
    this.subEditMode.unsubscribe();
  }

  /**
   * Lädt Kontakte und markiert den aktuellen User mit (You)
   */
  async loadContacts() {
    this.loadingContacts = true;

    try {
      await this.contactsService.loadContacts();

      this.contactsSubscription = this.contactsService.contacts$.subscribe(
        (contacts: SingleContact[]) => {
          let sortedContacts = this.sortContactsAlphabetically(contacts);

          const currentUid = this.authService.loggetInUserUid();
          const meIndex = sortedContacts.findIndex((c) => c.uid === currentUid);

          if (meIndex !== -1) {
            const me = sortedContacts.splice(meIndex, 1)[0];
            sortedContacts.unshift({
              ...me,
              name: me.name + ' (You)',
            });
          }

          this.contacts = sortedContacts;
          this.loadingContacts = false;

          if (this.taskData.assigned && this.taskData.assigned.length > 0) {
            this.updateSelectedOptionText();
          }

          this.updateAssignedAvatarsPreview();
        },
      );
    } catch (error) {
      console.error('Error loading contacts:', error);
      this.loadingContacts = false;
    }
  }

  /**
   * Sortiert Kontakte alphabetisch nach Namen
   * @param contacts Kontaktliste
   * @returns Sortierte Kontaktliste
   */
  private sortContactsAlphabetically(contacts: SingleContact[]): SingleContact[] {
    return [...contacts].sort((a, b) => {
      const nameA = a.name?.toLowerCase() || '';
      const nameB = b.name?.toLowerCase() || '';

      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });
  }

  /**
   * Fügt einen Kontakt zur Zuweisung hinzu oder entfernt ihn
   * @param contact Kontakt
   */
  toggleAssigned(contact: SingleContact) {
    if (!this.taskData.assigned) {
      this.taskData.assigned = [];
    }

    const index = this.taskData.assigned.indexOf(contact.id!);
    if (index === -1) {
      this.taskData.assigned.push(contact.id!);
    } else {
      this.taskData.assigned.splice(index, 1);
    }

    this.updateSelectedOptionText();
    this.updateAssignedAvatarsPreview();
  }

  /**
   * Prüft, ob ein Kontakt zugewiesen ist
   * @param contact Kontakt
   * @returns true, wenn zugewiesen
   */
  isAssigned(contact: SingleContact): boolean {
    return this.taskData.assigned?.includes(contact.id!) || false;
  }

  /**
   * Aktualisiert den Text der Zuweisungsoption
   */
  private updateSelectedOptionText() {
    const validAssignedIds = this.contactsService.sanitizeAssignedIds(this.taskData.assigned ?? []);
    this.taskData.assigned = validAssignedIds;

    if (validAssignedIds.length === 0) {
      this.selectedOption = 'Select contacts to assign';
    } else if (validAssignedIds.length === 1) {
      const contact = this.contacts.find((c) => c.id === validAssignedIds[0]);
      this.selectedOption = contact ? contact.name : '1 contact selected';
    } else {
      this.selectedOption = `${validAssignedIds.length} contacts selected`;
    }
  }

  /**
   * Aktualisiert die Vorschau der zugewiesenen Avatare
   */
  private updateAssignedAvatarsPreview(): void {
    const validAssignedIds = this.contactsService.sanitizeAssignedIds(this.taskData.assigned ?? []);
    this.taskData.assigned = validAssignedIds;

    const preview = this.contactsService.buildAssignedAvatarPreview(validAssignedIds, 3);
    this.assignedPreviewUsers = preview.visible;
    this.assignedRemainingCount = preview.remaining;
  }

  /**
   * Setzt die Priorität der Aufgabe
   * @param priority Priorität
   */
  setPriority(priority: 'Urgent' | 'Medium' | 'Low') {
    this.taskData.priority = priority;
  }

  /**
   * Fügt einen neuen Subtask hinzu
   */
  addSubtask() {
    if (this.newSubtaskTitle && this.newSubtaskTitle.trim()) {
      if (!this.taskData.subtasks) {
        this.taskData.subtasks = [];
      }

      this.taskData.subtasks.push({
        id: this.generateId(),
        title: this.newSubtaskTitle.trim(),
        completed: false,
      });

      this.clearSubtaskInput();
    }
  }

  /**
   * Entfernt einen Subtask
   * @param index Index des Subtasks
   */
  removeSubtask(index: number) {
    if (this.taskData.subtasks) {
      this.taskData.subtasks.splice(index, 1);
    }

    if (this.editingSubtaskIndex === index) {
      this.cancelSubtaskEdit();
    }
  }

  /**
   * Startet das Bearbeiten eines Subtasks
   * @param index Index des Subtasks
   * @param currentTitle Aktueller Titel
   */
  startEditingSubtask(index: number, currentTitle: string) {
    this.editingSubtaskIndex = index;
    this.editingSubtaskTitle = currentTitle;
    this.originalSubtaskTitle = currentTitle;

    setTimeout(() => {
      if (this.editInput) {
        this.editInput.nativeElement.focus();
      }
    });
  }

  /**
   * Speichert die Bearbeitung eines Subtasks
   */
  saveSubtaskEdit() {
    if (
      this.editingSubtaskIndex !== null &&
      this.taskData.subtasks &&
      this.editingSubtaskTitle.trim()
    ) {
      this.taskData.subtasks[this.editingSubtaskIndex].title = this.editingSubtaskTitle.trim();
      this.cancelSubtaskEdit();
    } else if (this.editingSubtaskIndex !== null && !this.editingSubtaskTitle.trim()) {
      this.cancelSubtaskEdit();
    }
  }

  /**
   * Reagiert auf das Verlassen des Subtask-Edit-Inputs
   */
  onBlurSubtaskEdit() {
    setTimeout(() => {
      if (this.editingSubtaskIndex !== null) {
        this.saveSubtaskEdit();
      }
    }, 200);
  }

  /**
   * Bricht die Bearbeitung eines Subtasks ab
   */
  cancelSubtaskEdit() {
    this.editingSubtaskIndex = null;
    this.editingSubtaskTitle = '';
    this.originalSubtaskTitle = '';
  }

  /**
   * Leert das Subtask-Eingabefeld
   */
  clearSubtaskInput() {
    this.newSubtaskTitle = '';
  }

  /**
   * Generiert eine eindeutige ID
   * @returns ID-String
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  /**
   * Gibt die Initialen eines Namens zurück
   * @param name Name
   * @returns Initialen
   */
  getInitials(name: string): string {
    return this.contactsService.getInitials(name);
  }

  /**
   * Gibt die Farbklasse für einen Kontakt zurück
   * @param contact Kontakt
   * @returns Farbklasse
   */
  getContactColorClass(contact: SingleContact): string {
    return this.contactsService.getIconColorClass(contact);
  }

  /**
   * Prüft, ob ein Feld gültig ist
   * @param fieldName Feldname
   * @returns true, wenn gültig
   */
  isFieldValid(fieldName: string): boolean {
    if (fieldName === 'category') {
      return this.selectedCategory !== 'Select category';
    }

    const value = this.taskData[fieldName as keyof typeof this.taskData];
    return !!value && (typeof value !== 'string' || value.trim() !== '');
  }

  /**
   * Aktualisiert den Fehlerstatus eines Feldes
   * @param fieldName Feldname
   */
  private updateFieldError(fieldName: string): void {
    this.fieldErrors[fieldName] = !this.isFieldValid(fieldName);
  }

  /**
   * Wird bei Eingabe in ein Feld aufgerufen
   * @param fieldName Feldname
   */
  onFieldInput(fieldName: string): void {
    if (this.fieldErrors[fieldName]) {
      this.updateFieldError(fieldName);
    }
  }

  /**
   * Validiert alle Pflichtfelder
   * @returns true, wenn alle gültig
   */
  validateAllFields(): boolean {
    let isValid = true;
    for (const field of this.requiredFields) {
      const fieldValid = this.isFieldValid(field);
      this.fieldErrors[field] = !fieldValid;
      if (!fieldValid) {
        isValid = false;
      }
    }
    return isValid;
  }

  /**
   * Markiert das Formular als abgeschickt
   */
  private markFormAsSubmitted(): void {
    this.formSubmitted = true;
    if (this.taskForm) {
      Object.keys(this.taskForm.controls).forEach((key) => {
        const control = this.taskForm.controls[key];
        control.markAsTouched();
      });
    }
  }

  /**
   * Wird beim Verlassen des Kategorie-Dropdowns aufgerufen
   */
  onCategoryBlur() {
    this.closeCategoryDropdown();
    this.updateFieldError('category');
  }

  /**
   * Prüft, ob das Formular gültig ist
   * @returns true, wenn gültig
   */
  isFormValid(): boolean {
    return this.requiredFields.every((field) => this.isFieldValid(field));
  }

  /**
   * Wird beim Absenden des Formulars aufgerufen
   */
  async onSubmit() {
    this.markFormAsSubmitted();

    if (!this.validateAllFields()) {
      return;
    }

    try {
      this.taskData.category = this.selectedCategory as 'User Story' | 'Technical Task';
      await this.tasksService.addTask(this.taskData as SingleTask);
      this.clearForm();
      this.tasksService.openTaskSuccessDialog();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  }

  /**
   * Setzt das Formular zurück
   */
  clearForm() {
    this.tasksService.resetStatus();
    this.taskData.status = this.statusCondition;
    this.taskData.title = '';
    this.taskData.description = '';
    this.taskData.dueDate = '';
    this.taskData.priority = 'Medium';
    this.taskData.assigned = [];
    this.taskData.category = 'User Story';
    this.taskData.subtasks = [];
    this.taskData.order = 0;
    this.selectedOption = 'Select contacts to assign';
    this.selectedCategory = 'Select category';
    this.newSubtaskTitle = '';
    this.formSubmitted = false;
    this.fieldErrors = { title: false, dueDate: false, category: false };

    if (this.taskForm) {
      this.taskForm.resetForm();
    }

    this.isOpen = false;
    this.isCategoryOpen = false;
    this.cancelSubtaskEdit();
    this.updateAssignedAvatarsPreview();
  }

  /**
   * Setzt die aktuellen Task-Daten
   * @param currenTask Aktueller Task
   */
  setCurrentTaskData(currenTask: SingleTask) {
    this.taskData = {
      id: currenTask.id,
      status: currenTask.status,
      title: currenTask.title,
      description: currenTask.description,
      dueDate: currenTask.dueDate,
      priority: currenTask.priority,
      assigned: currenTask.assigned,
      category: currenTask.category,
      subtasks: currenTask.subtasks,
      order: currenTask.order,
    };
    this.selectedCategory = currenTask.category;
    this.updateSelectedOptionText();
    this.updateAssignedAvatarsPreview();
    this.formSubmitted = false;
    this.fieldErrors = { title: false, dueDate: false, category: false };
  }

  /**
   * Gibt ein vollständiges Task-Objekt zurück
   * @returns SingleTask
   */
  getFullTask(): SingleTask {
    return {
      id: this.taskData.id ?? '',
      status: this.taskData.status ?? 'To Do',
      title: this.taskData.title ?? '',
      description: this.taskData.description ?? '',
      dueDate: this.taskData.dueDate ?? '',
      priority: this.taskData.priority ?? 'Medium',
      assigned: this.taskData.assigned ?? [],
      category: this.taskData.category ?? 'User Story',
      subtasks: this.taskData.subtasks ?? [],
      order: this.taskData.order ?? 0,
    };
  }
}
