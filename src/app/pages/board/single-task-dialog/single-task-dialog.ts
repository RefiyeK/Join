import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { TasksService } from '../../../services/tasks-service';
import { ContactsService } from '../../../services/contacts-service';
import { AssignedAvatarItem } from '../../../interfaces/assigned-avatar';
import { Subscription } from 'rxjs';
import { AddTask } from '../../add-task/add-task';

/**
 * SingleTaskDialog - Displays all details of a task in a large dialog.
 *
 * Uses TasksService.activeTask for reactive data display.
 * All changes (subtask toggle, delete) are performed via the service.
 * Uses TasksService.activeTask for reactive data display.
 * All changes (subtask toggle, delete) are performed via the service.
 */
@Component({
  selector: 'app-single-task-dialog',
  imports: [CommonModule, AddTask, NgClass],
  templateUrl: './single-task-dialog.html',
  styleUrl: './single-task-dialog.scss',
})
export class SingleTaskDialog implements OnInit, OnDestroy {
  tasksService = inject(TasksService);
  contactsService = inject(ContactsService);

  /** Controls the slide-out animation when closing. */
  isClosing = false;

  assignedUsers: AssignedAvatarItem[] = [];
  private contactsSubscription?: Subscription;

  /**
   * Initializes the component and subscribes to contacts
   */
  ngOnInit(): void {
    this.updateAssignedUsersFromService();
    this.contactsService.loadContacts();

    this.contactsSubscription = this.contactsService.contacts$.subscribe(() => {
      this.updateAssignedUsersFromService();
    });
  }

  /**
   * Cleans up the subscription when the component is destroyed
   */
  ngOnDestroy(): void {
    if (this.contactsSubscription) {
      this.contactsSubscription.unsubscribe();
    }
  }

  /**
   * Updates the list of assigned users from the service
   */
  private updateAssignedUsersFromService(): void {
    const assignedIds = this.tasksService.activeTask?.assigned ?? [];
    const validAssignedIds = this.contactsService.sanitizeAssignedIds(assignedIds);
    this.assignedUsers = this.contactsService.buildAssignedUsers(validAssignedIds);
  }

  /**
   * Returns the active task from the service.
   * Is reactively updated via onSnapshot.
   */
  get task() {
    this.updateAssignedUsersFromService();
    return this.tasksService.activeTask;
  }

  /**
   * Returns the CSS class for the category badge.
   */
  get badgeClass(): string {
    return this.task?.category === 'User Story' ? 'badge-user-story' : 'badge-technical-task';
  }

  /**
   * Returns the path to the priority icon.
   */
  get priorityIcon(): string {
    const icons: { [key: string]: string } = {
      Urgent: 'assets/icons/prio-urgent.svg',
      Medium: 'assets/icons/prio-medium.svg',
      Low: 'assets/icons/prio-low.svg',
    };
    return icons[this.task?.priority || 'Medium'] || icons['Medium'];
  }

  /**
   * Formats the due date for display.
   * Format: "DD/MM/YYYY"
   */
  get formattedDueDate(): string {
    if (!this.task?.dueDate) return '';
    const date = new Date(this.task.dueDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Closes the dialog with slide-out animation.
   * Sets isClosing to true → CSS switches to slide-out.
   * After 500ms (animation duration), activeTask is set to null.
   */
  closeDialog(): void {
    this.isClosing = true;
    setTimeout(() => {
      this.isClosing = false;
      if (this.tasksService.editMode) {
        this.tasksService.exidEditMode(this.tasksService.currentTask);
      }
      this.tasksService.closeTaskDialog();
    }, 500);
  }

  /**
   * Deletes the current task from Firebase.
   */
  async onDeleteTask(): Promise<void> {
    if (!this.task || !this.task.id) return;
    await this.tasksService.deleteTask(this.task.id);
    this.closeDialog();
  }

  /**
   * Toggles the completed status of a subtask.
   */
  async onSubtaskToggle(subtaskId: string, currentStatus: boolean): Promise<void> {
    if (!this.task || !this.task.id) return;
    await this.tasksService.updateSubtaskStatus(this.task.id, subtaskId, !currentStatus);
  }

  /**
   * Prevents event propagation when clicking on dialog content.
   * This prevents the dialog from closing when clicking inside.
   */
  onDialogContentClick(event: Event): void {
    event.stopPropagation();
  }
}
