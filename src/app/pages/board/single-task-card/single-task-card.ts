import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactsService } from '../../../services/contacts-service';
import { SingleTask } from '../../../interfaces/single-task';
import { TasksService } from '../../../services/tasks-service';

/** Type for displayed users on the card (max 3) */
interface DisplayedUser {
  id: string;
  name: string;
  initials: string;
  color: string;
}

/**
 * SingleTaskCard – Displays a single task as a card on the board.
 *
 * Pure presentational component.
 * Receives task data via @Input, emits click events via @Output.
 * Uses ContactsService to resolve contact IDs to initials and colors.
 */
@Component({
  selector: 'app-single-task-card',
  imports: [CommonModule],
  templateUrl: './single-task-card.html',
  styleUrl: './single-task-card.scss',
})
export class SingleTaskCard {
  tasksService = inject(TasksService);
  /** ContactsService for resolving initials and colors */
  private readonly contactsService = inject(ContactsService);

  /** Task data from the board component */
  @Input() task!: SingleTask;

  /** Event on card click – emits the task ID */
  @Output() taskClicked = new EventEmitter<string>();

  /**
   * CSS class for the category badge.
   * 'User Story' → blue, 'Technical Task' → green.
   */
  get badgeClass(): string {
    return this.task.category === 'User Story' ? 'badge-user-story' : 'badge-technical-task';
  }

  /**
   * Calculates the subtask progress as a percentage.
   * @returns Percentage value between 0 and 100
   */
  get progressPercentage(): number {
    if (!this.task?.subtasks || this.task.subtasks.length === 0) return 0;
    const completed = this.task.subtasks.filter((st) => st.completed).length;
    return (completed / this.task.subtasks.length) * 100;
  }

  /** Counts completed subtasks for the "2/5 Subtasks" display */
  get completedSubtasks(): number {
    if (!this.task.subtasks) return 0;
    return this.task.subtasks.filter((st) => st.completed).length;
  }

  /** Path to the matching priority icon (Urgent/Medium/Low) */
  get priorityIcon(): string {
    const icons: Record<string, string> = {
      Urgent: 'assets/icons/prio-urgent.svg',
      Medium: 'assets/icons/prio-medium.svg',
      Low: 'assets/icons/prio-low.svg',
    };
    return icons[this.task.priority] || icons['Medium'];
  }

  /**
   * Resolves contact IDs to actual contact data.
   * Uses ContactsService.getInitials() and getIconColorClass().
   * Returns a maximum of 3 user objects.
   */
  get displayedUsers(): DisplayedUser[] {
    if (!this.task) return [];
    const ids = this.task.assigned || [];
    if (ids.length === 0) return [];
    return ids.slice(0, 3).map((id) => this.resolveContact(id));
  }

  /** Number of users beyond 3 – displayed as a "+X" badge */
  get remainingUsersCount(): number {
    const ids = this.task.assigned || [];
    return Math.max(0, ids.length - 3);
  }

  /** Tooltip with all assigned contact names (comma-separated) */
  get allUsersTooltip(): string {
    if (!this.task) return '';
    const ids = this.task.assigned || [];
    return ids.map((id) => this.resolveContact(id).name).join(', ');
  }

  /**
   * Looks up a contact by ID in the ContactsService.
   * If not found, a fallback is generated.
   * @param contactId - The Firebase ID of the contact
   * @returns Object with id, name, initials, and color
   */
  private resolveContact(contactId: string): DisplayedUser {
    const contact = this.contactsService.contacts.find((c) => c.id === contactId);

    if (contact) {
      return {
        id: contact.id || contactId,
        name: contact.name,
        initials: this.contactsService.getInitials(contact.name),
        color: this.contactsService.getIconColorClass(contact),
      };
    }
    return {
      id: contactId,
      name: 'Unknown User',
      initials: '??',
      color: 'icon-1',
    };
  }

  /** Emits the task ID to the board via event */
  onCardClick(): void {
    if (this.task?.id) {
      this.taskClicked.emit(this.task.id);
      this.tasksService.currentTask = this.task;
    }
  }
}