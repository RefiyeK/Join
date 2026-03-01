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
  authService = inject(AuthService); // AuthService injiziert für (You) Logik

  private subEditMode!: Subscription;

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
      this.updateFieldError('category'); 
    }
    this.isCategoryOpen = false;
  }

  closeCategoryDropdown() {
    this.isCategoryOpen = false;
  }

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
          // 1. Alphabetisch sortieren
          let sortedContacts = this.sortContactsAlphabetically(contacts);

          // 2. Logged-in User finden und "(You)" hinzufügen + nach oben schieben
          const currentUid = this.authService.loggetInUserUid();
          const meIndex = sortedContacts.findIndex(c => c.uid === currentUid);

          if (meIndex !== -1) {
            // User kurz entfernen
            const me = sortedContacts.splice(meIndex, 1)[0];
            // Mit Zusatz "(You)" ganz vorne wieder einfügen
            sortedContacts.unshift({
              ...me,
              name: me.name + ' (You)'
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

  setPriority(priority: 'Urgent' | 'Medium' | 'Low') {
    this.taskData.priority = priority;
  }

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

  removeSubtask(index: number) {
    if (this.taskData.subtasks) {
      this.taskData.subtasks.splice(index, 1);
    }

    if (this.editingSubtaskIndex === index) {
      this.cancelSubtaskEdit();
    }
  }

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

  onBlurSubtaskEdit() {
    setTimeout(() => {
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

  clearSubtaskInput() {
    this.newSubtaskTitle = '';
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  getInitials(name: string): string {
    return this.contactsService.getInitials(name);
  }

  getContactColorClass(contact: SingleContact): string {
    return this.contactsService.getIconColorClass(contact);
  }

  isFieldValid(fieldName: string): boolean {
    if (fieldName === 'category') {
      return this.selectedCategory !== 'Select category';
    }

    const value = this.taskData[fieldName as keyof typeof this.taskData];
    return !!value && (typeof value !== 'string' || value.trim() !== '');
  }

  private updateFieldError(fieldName: string): void {
    this.fieldErrors[fieldName] = !this.isFieldValid(fieldName);
  }

  onFieldInput(fieldName: string): void {
    if (this.fieldErrors[fieldName]) {
      this.updateFieldError(fieldName);
    }
  }

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

  private markFormAsSubmitted(): void {
    this.formSubmitted = true;
    if (this.taskForm) {
      Object.keys(this.taskForm.controls).forEach((key) => {
        const control = this.taskForm.controls[key];
        control.markAsTouched();
      });
    }
  }

  onCategoryBlur() {
    this.closeCategoryDropdown();
    this.updateFieldError('category');
  }

  isFormValid(): boolean {
    return this.requiredFields.every((field) => this.isFieldValid(field));
  }

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