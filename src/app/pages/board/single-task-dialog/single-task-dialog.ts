import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { TasksService } from '../../../services/tasks-service';
import { ContactsService } from '../../../services/contacts-service';
import { AssignedAvatarItem } from '../../../interfaces/assigned-avatar';
import { Subscription } from 'rxjs';
import { AddTask } from '../../add-task/add-task';

/**
 * SingleTaskDialog - Zeigt alle Details einer Task in einem großen Dialog.
 *
 * Nutzt TasksService.activeTask für reaktive Daten-Anzeige.
 * Alle Änderungen (Subtask-Toggle, Delete) werden über den Service durchgeführt.
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

  /** Steuert die Slide-Out-Animation beim Schließen. */
  isClosing = false;

  assignedUsers: AssignedAvatarItem[] = [];
  private contactsSubscription?: Subscription;

  ngOnInit(): void {
    this.updateAssignedUsersFromService();

    // sorgt dafür, dass Contacts sicher vorhanden sind
    this.contactsService.loadContacts();

    this.contactsSubscription = this.contactsService.contacts$.subscribe(() => {
      this.updateAssignedUsersFromService();
    });
  }

  ngOnDestroy(): void {
    if (this.contactsSubscription) {
      this.contactsSubscription.unsubscribe();
    }
  }

  private updateAssignedUsersFromService(): void {
    const assignedIds = this.tasksService.activeTask?.assigned ?? [];
    const validAssignedIds = this.contactsService.sanitizeAssignedIds(assignedIds);
    this.assignedUsers = this.contactsService.buildAssignedUsers(validAssignedIds);
  }

  /**
   * Gibt die aktive Task aus dem Service zurück.
   * Wird reaktiv aktualisiert durch onSnapshot.
   */
  get task() {
    this.updateAssignedUsersFromService();
    return this.tasksService.activeTask;
  }

  /**
   * Gibt die CSS-Klasse für das Kategorie-Badge zurück.
   */
  get badgeClass(): string {
    return this.task?.category === 'User Story' ? 'badge-user-story' : 'badge-technical-task';
  }

  /**
   * Gibt den Pfad zum Priority-Icon zurück.
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
   * Formatiert das Due-Date für Anzeige.
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
   * Schließt den Dialog mit Slide-Out-Animation.
   * Setzt isClosing auf true → CSS wechselt zu slide-out.
   * Nach 500ms (Animationsdauer) wird activeTask auf null gesetzt.
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
   * Löscht die aktuelle Task aus Firebase.
   */
  async onDeleteTask(): Promise<void> {
    if (!this.task || !this.task.id) return;

    await this.tasksService.deleteTask(this.task.id);
    this.closeDialog();
  }

  /**
   * Toggled den completed-Status eines Subtasks.
   */
  async onSubtaskToggle(subtaskId: string, currentStatus: boolean): Promise<void> {
    if (!this.task || !this.task.id) return;

    await this.tasksService.updateSubtaskStatus(this.task.id, subtaskId, !currentStatus);
  }

  /**
   * Verhindert Event-Propagation beim Klick auf Dialog-Content.
   * Damit schließt sich der Dialog nicht, wenn man ins Innere klickt.
   */
  onDialogContentClick(event: Event): void {
    event.stopPropagation();
  }
}
