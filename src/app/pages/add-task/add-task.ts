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
import { Router } from '@angular/router';

/**
 * Interface for field error states
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
  private router = inject(Router);

  private subEditMode!: Subscription;

  /** Contacts as array for the template */
  contacts: SingleContact[] = [];
  loadingContacts: boolean = false;

  /** Subscription for contacts */
  private contactsSubscription?: Subscription;

  /** Minimum date for today and future */
  minDate: string = new Date().toISOString().split('T')[0];
  statusCondition: string = this.tasksService.currentStatus;

  /** Dropdown for assignment */
  isOpen = false;
  selectedOption: string = 'Select contacts to assign';
  options: string[] = ['Option_1', 'Option_2', 'Option_3'];

  /**
   * Opens or closes the assignment dropdown
   */
  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  /**
   * Closes the assignment dropdown
   */
  closeDropdown() {
    this.isOpen = false;
  }

  /** Dropdown for category */
  isCategoryOpen = false;
  selectedCategory: string = 'Select category';
  categoryOptions: string[] = ['Technical Task', 'User Story'];

  /**
   * Opens or closes the category dropdown
   */
  toggleCategoryDropdown() {
    this.isCategoryOpen = !this.isCategoryOpen;
  }

  /**
   * Selects a category
   * @param option Category option
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
   * Closes the category dropdown
   */
  closeCategoryDropdown() {
    this.isCategoryOpen = false;
  }

  /** Status of the form */
  formSubmitted: boolean = false;
  fieldErrors: FieldErrorState = {
    title: false,
    dueDate: false,
    category: false,
  };

  /** Required fields for validation */
  private readonly requiredFields = ['title', 'dueDate', 'category'] as const;

  /** Task data object */
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

  /** Subtask handling */
  newSubtaskTitle: string = '';
  isSubtaskInputFocused: boolean = false;

  editingSubtaskIndex: number | null = null;
  editingSubtaskTitle: string = '';
  originalSubtaskTitle: string = '';

  assignedPreviewUsers: AssignedAvatarItem[] = [];
  assignedRemainingCount: number = 0;

  /**
   * Sets focus state for subtask input to true
   */
  onSubtaskFocus() {
    this.isSubtaskInputFocused = true;
  }

  /**
   * Sets focus state for subtask input to false after a short delay
   * to allow click events on the clear/save icons to trigger first.
   */
  onSubtaskBlur() {
    setTimeout(() => {
      this.isSubtaskInputFocused = false;
    }, 200);
  }

  /**
   * Initializes the component and loads contacts
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
   * Cleans up subscriptions when the component is destroyed
   */
  ngOnDestroy() {
    if (this.contactsSubscription) {
      this.contactsSubscription.unsubscribe();
    }
    this.subEditMode.unsubscribe();
  }

  /**
   * Loads contacts and marks the current user with (You)
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
   * Sorts contacts alphabetically by name
   * @param contacts Contact list
   * @returns Sorted contact list
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
   * Adds or removes a contact from assignment
   * @param contact Contact
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
   * Checks if a contact is assigned
   * @param contact Contact
   * @returns true if assigned
   */
  isAssigned(contact: SingleContact): boolean {
    return this.taskData.assigned?.includes(contact.id!) || false;
  }

  /**
   * Updates the assignment option text
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
   * Updates the preview of assigned avatars
   */
  private updateAssignedAvatarsPreview(): void {
    const validAssignedIds = this.contactsService.sanitizeAssignedIds(this.taskData.assigned ?? []);
    this.taskData.assigned = validAssignedIds;

    const preview = this.contactsService.buildAssignedAvatarPreview(validAssignedIds, 3);
    this.assignedPreviewUsers = preview.visible;
    this.assignedRemainingCount = preview.remaining;
  }

  /**
   * Sets the priority of the task
   * @param priority Priority
   */
  setPriority(priority: 'Urgent' | 'Medium' | 'Low') {
    this.taskData.priority = priority;
  }

  /**
   * Adds a new subtask
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
   * Removes a subtask
   * @param index Index of the subtask
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
   * Starts editing a subtask
   * @param index Index of the subtask
   * @param currentTitle Current title
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
   * Saves the editing of a subtask
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
   * Handles blur event on subtask edit input
   */
  onBlurSubtaskEdit() {
    setTimeout(() => {
      if (this.editingSubtaskIndex !== null) {
        this.saveSubtaskEdit();
      }
    }, 200);
  }

  /**
   * Cancels editing a subtask
   */
  cancelSubtaskEdit() {
    this.editingSubtaskIndex = null;
    this.editingSubtaskTitle = '';
    this.originalSubtaskTitle = '';
  }

  /**
   * Clears the subtask input field
   */
  clearSubtaskInput() {
    this.newSubtaskTitle = '';
  }

  /**
   * Generates a unique ID
   * @returns ID string
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  /**
   * Returns the initials of a name
   * @param name Name
   * @returns Initials
   */
  getInitials(name: string): string {
    return this.contactsService.getInitials(name);
  }

  /**
   * Returns the color class for a contact
   * @param contact Contact
   * @returns Color class
   */
  getContactColorClass(contact: SingleContact): string {
    return this.contactsService.getIconColorClass(contact);
  }

  /**
   * Checks if a field is valid
   * @param fieldName Field name
   * @returns true if valid
   */
  isFieldValid(fieldName: string): boolean {
    if (fieldName === 'category') {
      return this.selectedCategory !== 'Select category';
    }

    const value = this.taskData[fieldName as keyof typeof this.taskData];
    return !!value && (typeof value !== 'string' || value.trim() !== '');
  }

  /**
   * Updates the error state of a field
   * @param fieldName Field name
   */
  private updateFieldError(fieldName: string): void {
    this.fieldErrors[fieldName] = !this.isFieldValid(fieldName);
  }

  /**
   * Called on input in a field
   * @param fieldName Field name
   */
  onFieldInput(fieldName: string): void {
    if (this.fieldErrors[fieldName]) {
      this.updateFieldError(fieldName);
    }
  }

  /**
   * Validates all required fields
   * @returns true if all valid
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
   * Marks the form as submitted
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
   * Called when the category dropdown loses focus
   */
  onCategoryBlur() {
    this.closeCategoryDropdown();
    this.updateFieldError('category');
  }

  /**
   * Checks if the form is valid
   * @returns true if valid
   */
  isFormValid(): boolean {
    return this.requiredFields.every((field) => this.isFieldValid(field));
  }

  /**
   * Called when the form is submitted
   */
  async onSubmit() {
    this.markFormAsSubmitted();

    if (!this.validateAllFields()) {
      return;
    }

    try {
      this.taskData.category = this.selectedCategory as 'User Story' | 'Technical Task';
      await this.tasksService.addTask(this.taskData as SingleTask);
      this.tasksService.openTaskSuccessDialog();
      setTimeout(() => {
        this.router.navigateByUrl('/board');
        this.clearForm();
      }, 2500);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  }

  /**
   * Resets the form
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
   * Sets the current task data
   * @param currenTask Current task
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
   * Returns a complete task object
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