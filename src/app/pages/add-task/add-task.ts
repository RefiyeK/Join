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
  @ViewChild('taskForm') taskForm!: NgForm; // Referenz zum Formular hinzugefügt
  @ViewChild('editInput') editInput!: ElementRef; // Referenz für Edit-Input

  tasksService = inject(TasksService);
  private subEditMode!: Subscription;
  contactsService = inject(ContactsService);

  // Contacts als Array für das Template
  contacts: SingleContact[] = [];
  loadingContacts: boolean = false;

  // Subscription für Contacts
  private contactsSubscription?: Subscription;

  // Date only for today and future
  minDate: string = new Date().toISOString().split('T')[0];
  statusCondition: string = this.tasksService.currentStatus;

  // Assign Dropdown
  isOpen = false;
  selectedOption: string = 'Select contacts to assign';
  options: string[] = ['Option_1', 'Option_2', 'Option_3'];

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }

  // Category Dropdown
  isCategoryOpen = false;
  selectedCategory: string = 'Select category';
  categoryOptions: string[] = ['Technical Task', 'User Story'];

  toggleCategoryDropdown() {
    this.isCategoryOpen = !this.isCategoryOpen;
  }

  selectCategory(option: string) {
    if (option === 'Technical Task' || option === 'User Story') {
      this.selectedCategory = option;
      this.taskData.category = option;
      this.updateFieldError('category'); // Clear error when category is selected
    }
    this.isCategoryOpen = false;
  }

  closeCategoryDropdown() {
    this.isCategoryOpen = false;
  }

  // ------------------- NEUER CODE (VON MIR HINZUGEFÜGT) -------------------

  // Form State
  formSubmitted: boolean = false;
  fieldErrors: FieldErrorState = {
    title: false,
    dueDate: false,
    category: false,
  };

  // Required fields for validation
  private readonly requiredFields = ['title', 'dueDate', 'category'] as const;

  // Task Data Object
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

  // Subtask handling
  newSubtaskTitle: string = '';

  editingSubtaskIndex: number | null = null;
  editingSubtaskTitle: string = '';
  originalSubtaskTitle: string = '';

  assignedPreviewUsers: AssignedAvatarItem[] = [];
  assignedRemainingCount: number = 0;

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

  ngOnDestroy() {
    // Cleanup Subscription
    if (this.contactsSubscription) {
      this.contactsSubscription.unsubscribe();
    }
    this.subEditMode.unsubscribe();
  }

  async loadContacts() {
    this.loadingContacts = true;

    try {
      // Lade Contacts von Firebase
      await this.contactsService.loadContacts();

      // Abonniere Contacts-Änderungen
      this.contactsSubscription = this.contactsService.contacts$.subscribe(
        (contacts: SingleContact[]) => {
          this.contacts = contacts;
          this.loadingContacts = false;

          if (this.taskData.assigned && this.taskData.assigned.length > 0) {
            this.updateSelectedOptionText();
          }

          this.updateAssignedAvatarsPreview();
        },
      );
    } catch (error) {
      this.loadingContacts = false;
    }
  }

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

  isAssigned(contact: SingleContact): boolean {
    return this.taskData.assigned?.includes(contact.id!) || false;
  }

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

  private updateAssignedAvatarsPreview(): void {
    const validAssignedIds = this.contactsService.sanitizeAssignedIds(this.taskData.assigned ?? []);
    this.taskData.assigned = validAssignedIds;

    const preview = this.contactsService.buildAssignedAvatarPreview(validAssignedIds, 3);
    this.assignedPreviewUsers = preview.visible;
    this.assignedRemainingCount = preview.remaining;
  }

  // Priority Handling
  setPriority(priority: 'Urgent' | 'Medium' | 'Low') {
    this.taskData.priority = priority;
  }

  // Subtask Handling - KORRIGIERT
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

      // Subtask clear machen nach dem Hinzufügen
      this.clearSubtaskInput();
    }
  }

  removeSubtask(index: number) {
    if (this.taskData.subtasks) {
      this.taskData.subtasks.splice(index, 1);
    }

    // Wenn der gelöschte Subtask gerade im Edit-Modus war, Edit-Modus beenden
    if (this.editingSubtaskIndex === index) {
      this.cancelSubtaskEdit();
    }
  }

  // Subtask Edit Methods - NEU HINZUGEFÜGT
  startEditingSubtask(index: number, currentTitle: string) {
    this.editingSubtaskIndex = index;
    this.editingSubtaskTitle = currentTitle;
    this.originalSubtaskTitle = currentTitle;

    // Fokussiere das Input-Feld nach einem kurzen Delay
    setTimeout(() => {
      if (this.editInput) {
        this.editInput.nativeElement.focus();
      }
    });
  }

  saveSubtaskEdit() {
    if (
      this.editingSubtaskIndex !== null &&
      this.taskData.subtasks &&
      this.editingSubtaskTitle.trim()
    ) {
      // Speichere den bearbeiteten Titel
      this.taskData.subtasks[this.editingSubtaskIndex].title = this.editingSubtaskTitle.trim();

      // Beende den Edit-Modus
      this.cancelSubtaskEdit();
    } else if (this.editingSubtaskIndex !== null && !this.editingSubtaskTitle.trim()) {
      // Wenn der Titel leer ist, breche ab und behalte den Originaltitel
      this.cancelSubtaskEdit();
    }
  }

  // NEUE METHODE für Version 1
  onBlurSubtaskEdit() {
    // Kleine Verzögerung, damit der Click auf die Icons noch registriert wird
    setTimeout(() => {
      // Prüfen ob wir noch im Edit-Modus sind (nicht durch Icon-Click abgebrochen)
      if (this.editingSubtaskIndex !== null) {
        this.saveSubtaskEdit();
      }
    }, 200);
  }

  cancelSubtaskEdit() {
    this.editingSubtaskIndex = null;
    this.editingSubtaskTitle = '';
    this.originalSubtaskTitle = '';
  }

  // Subtask Input clear - KORRIGIERT
  clearSubtaskInput() {
    this.newSubtaskTitle = '';
  }

  // Helper to generate unique IDs for subtasks
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // Contact Helper Methods (von ContactsService)
  getInitials(name: string): string {
    return this.contactsService.getInitials(name);
  }

  getContactColorClass(contact: SingleContact): string {
    return this.contactsService.getIconColorClass(contact);
  }

  // ============= VALIDATION METHODS =============

  /**
   * Checks if a specific field is valid
   */
  isFieldValid(fieldName: string): boolean {
    if (fieldName === 'category') {
      return this.selectedCategory !== 'Select category';
    }

    const value = this.taskData[fieldName as keyof typeof this.taskData];
    return !!value && (typeof value !== 'string' || value.trim() !== '');
  }

  /**
   * Updates error state for a specific field
   */
  private updateFieldError(fieldName: string): void {
    this.fieldErrors[fieldName] = !this.isFieldValid(fieldName);
  }

  /**
   * Called when user types in a field - clears error for that field
   */
  onFieldInput(fieldName: string): void {
    if (this.fieldErrors[fieldName]) {
      this.updateFieldError(fieldName);
    }
  }

  /**
   * Validates all required fields and updates error states
   */
  validateAllFields(): boolean {
    let isValid = true;

    // Check each required field
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
   * Marks form as submitted and validates all fields
   */
  private markFormAsSubmitted(): void {
    this.formSubmitted = true;

    // Mark all ngModel fields as touched
    if (this.taskForm) {
      Object.keys(this.taskForm.controls).forEach((key) => {
        const control = this.taskForm.controls[key];
        control.markAsTouched();
      });
    }
  }

  // Neue Methode für Category-Blur
  onCategoryBlur() {
    this.closeCategoryDropdown();
    // Update error state based on current value
    this.updateFieldError('category');
  }

  // Form Handling
  isFormValid(): boolean {
    return this.requiredFields.every((field) => this.isFieldValid(field));
  }

  async onSubmit() {
    // Mark form as submitted and validate all fields
    this.markFormAsSubmitted();

    if (!this.validateAllFields()) {
      return;
    }

    try {
      // Setze die Kategorie basierend auf der Auswahl
      this.taskData.category = this.selectedCategory as 'User Story' | 'Technical Task';

      await this.tasksService.addTask(this.taskData as SingleTask);
      this.clearForm();
      // Optional: Navigate to board or show success message

      this.tasksService.openTaskSuccessDialog();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  }

  clearForm() {
    this.tasksService.resetStatus();
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
    // Reset dropdowns
    this.selectedOption = 'Select contacts to assign';
    this.selectedCategory = 'Select category';
    this.newSubtaskTitle = '';

    // Reset validation flags
    this.formSubmitted = false;
    this.fieldErrors = {
      title: false,
      dueDate: false,
      category: false,
    };

    // Reset form validation states
    if (this.taskForm) {
      this.taskForm.resetForm();
    }

    // Schließe alle offenen Dropdowns
    this.isOpen = false;
    this.isCategoryOpen = false;

    // Reset edit mode - NEU HINZUGEFÜGT
    this.cancelSubtaskEdit();
    this.updateAssignedAvatarsPreview();
  }

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

    // Reset validation state when loading existing task
    this.formSubmitted = false;
    this.fieldErrors = {
      title: false,
      dueDate: false,
      category: false,
    };
  }

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
