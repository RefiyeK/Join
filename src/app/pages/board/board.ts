import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';

import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { SingleTaskCard } from './single-task-card/single-task-card';
import { SingleTaskDialog } from './single-task-dialog/single-task-dialog';
import { Header } from '../../shared/components/header/header';
import { Nav } from '../../shared/components/nav/nav';
import { TasksService } from '../../services/tasks-service';
import { SingleTask } from '../../interfaces/single-task';
import { AddTaskDialog } from './add-task-dialog/add-task-dialog';
import { RouterLink } from '@angular/router';

/**
 * Board – Kanban-Board mit 4 Spalten, Drag & Drop und Task-Detail-Dialog.
 *
 * Bezieht alle Tasks aus dem TasksService (Firebase Echtzeit-Daten).
 * Klick auf eine Karte öffnet den Detail-Dialog.
 * Drag & Drop nutzt Angular CDK für Verschiebung und Sortierung.
 */
@Component({
  selector: 'app-board',
  imports: [
    CommonModule,
    SingleTaskCard,
    SingleTaskDialog,
    Header,
    Nav,
    AddTaskDialog,
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    RouterLink,
  ],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board implements OnDestroy {
  /** Zugriff auf den zentralen TasksService (Firebase-Daten). */
  tasksService = inject(TasksService);
  private breakpointObserver = inject(BreakpointObserver);

  /** Suchbegriff für die Task-Filterung. */
  searchTerm = '';
  isMobile = false;

  /**
   * Initialisiert die Board-Seite und setzt die mobile Ansicht
   */
  constructor() {
    this.breakpointObserver.observe(['(max-width: 768px)']).subscribe((result) => {
      this.isMobile = result.matches;
    });
    document.body.classList.add('board-page');
  }

  /**
   * Entfernt die CSS-Klasse beim Zerstören der Komponente
   */
  ngOnDestroy(): void {
    document.body.classList.remove('board-page');
  }

  /**
   * Filtert Tasks nach Status, sortiert nach order-Feld.
   * Wendet optional den Suchbegriff an.
   * @param status - Der Spalten-Status ('To do', 'In progress', etc.)
   * @returns Sortierte und gefilterte Tasks für diese Spalte
   */
  getTasksByStatus(status: string): SingleTask[] {
    return this.tasksService.tasks
      .filter((task) => {
        const matchesStatus = task.status === status;
        if (!this.searchTerm) return matchesStatus;
        const matchesSearch =
          task.title.toLowerCase().includes(this.searchTerm) ||
          (task.description ?? '').toLowerCase().includes(this.searchTerm);
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  /** Gibt alle Tasks mit Status 'To do' zurück, sortiert nach Position. */
  get todoTasks(): SingleTask[] {
    return this.getTasksByStatus('To do');
  }

  /** Gibt alle Tasks mit Status 'In progress' zurück, sortiert nach Position. */
  get inProgressTasks(): SingleTask[] {
    return this.getTasksByStatus('In progress');
  }

  /** Gibt alle Tasks mit Status 'Await feedback' zurück, sortiert nach Position. */
  get awaitFeedbackTasks(): SingleTask[] {
    return this.getTasksByStatus('Await feedback');
  }

  /** Gibt alle Tasks mit Status 'Done' zurück, sortiert nach Position. */
  get doneTasks(): SingleTask[] {
    return this.getTasksByStatus('Done');
  }

  /**
   * Verarbeitet das Drop-Event nach Drag & Drop.
   * Unterscheidet: gleiche Spalte (umsortieren) vs. andere Spalte (verschieben).
   * @param event - Das CDK Drop-Event
   */
  onTaskDrop(event: CdkDragDrop<SingleTask[]>): void {
    if (event.previousContainer === event.container) {
      this.handleSameColumnDrop(event);
    } else {
      this.handleCrossColumnDrop(event);
    }
  }

  /**
   * Sortiert eine Karte innerhalb derselben Spalte um.
   * @param event - Das CDK Drop-Event
   */
  private handleSameColumnDrop(event: CdkDragDrop<SingleTask[]>): void {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    const status = event.container.id;
    this.tasksService.updateTaskPositions(event.container.data, status);
  }

  /**
   * Verschiebt eine Karte von einer Spalte in eine andere.
   * Speichert beide Spalten mit neuen Positionen.
   * @param event - Das CDK Drop-Event
   */
  private handleCrossColumnDrop(event: CdkDragDrop<SingleTask[]>): void {
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );
    const oldStatus = event.previousContainer.id;
    const newStatus = event.container.id;
    this.tasksService.updateTaskPositions(event.previousContainer.data, oldStatus);
    this.tasksService.updateTaskPositions(event.container.data, newStatus);
  }

  /**
   * Öffnet den Task-Detail-Dialog.
   * Delegiert an den TasksService, der activeTask setzt.
   * @param taskId - Die ID der angeklickten Task
   */
  openTaskDialog(taskId: string): void {
    this.tasksService.openTaskDialog(taskId);
  }

  /**
   * Liest den Suchbegriff aus dem Input-Feld.
   * @param event - Das native Input-Event
   */
  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value.toLowerCase();
  }
}
