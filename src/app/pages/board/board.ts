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
import { TasksService } from '../../services/tasks-service';
import { SingleTask } from '../../interfaces/single-task';
import { AddTaskDialog } from './add-task-dialog/add-task-dialog';
import { RouterLink } from '@angular/router';

/**
 * Board – Kanban board with 4 columns, drag & drop, and task detail dialog.
 * Board – Kanban board with 4 columns, drag & drop, and task detail dialog.
 *
 * Retrieves all tasks from the TasksService (Firebase real-time data).
 * Clicking a card opens the detail dialog.
 * Drag & drop uses Angular CDK for moving and sorting.
 */
@Component({
  selector: 'app-board',
  imports: [
    CommonModule,
    SingleTaskCard,
    SingleTaskDialog,
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
  /** Access to the central TasksService (Firebase data). */
  tasksService = inject(TasksService);
  private breakpointObserver = inject(BreakpointObserver);

  /** Search term for task filtering. */
  searchTerm = '';
  isMobile = false;

  /**
   * Initializes the board page and sets the mobile view
   */
  constructor() {
    this.breakpointObserver.observe(['(max-width: 768px)']).subscribe((result) => {
      this.isMobile = result.matches;
    });
    document.body.classList.add('board-page');
  }

  /**
   * Removes the CSS class when the component is destroyed
   */
  ngOnDestroy(): void {
    document.body.classList.remove('board-page');
  }

  /**
   * Filters tasks by status, sorted by order field.
   * Optionally applies the search term.
   * @param status - The column status ('To do', 'In progress', etc.)
   * @returns Sorted and filtered tasks for this column
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

  /** Returns all tasks with status 'To do', sorted by position. */
  get todoTasks(): SingleTask[] {
    return this.getTasksByStatus('To do');
  }

  /** Returns all tasks with status 'In progress', sorted by position. */
  get inProgressTasks(): SingleTask[] {
    return this.getTasksByStatus('In progress');
  }

  /** Returns all tasks with status 'Await feedback', sorted by position. */
  get awaitFeedbackTasks(): SingleTask[] {
    return this.getTasksByStatus('Await feedback');
  }

  /** Returns all tasks with status 'Done', sorted by position. */
  get doneTasks(): SingleTask[] {
    return this.getTasksByStatus('Done');
  }

  /**
   * Handles the drop event after drag & drop.
   * Distinguishes: same column (reorder) vs. other column (move).
   * @param event - The CDK drop event
   */
  onTaskDrop(event: CdkDragDrop<SingleTask[]>): void {
    if (event.previousContainer === event.container) {
      this.handleSameColumnDrop(event);
    } else {
      this.handleCrossColumnDrop(event);
    }
  }

  /**
   * Reorders a card within the same column.
   * @param event - The CDK drop event
   */
  private handleSameColumnDrop(event: CdkDragDrop<SingleTask[]>): void {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    const status = event.container.id;
    this.tasksService.updateTaskPositions(event.container.data, status);
  }

  /**
   * Moves a card from one column to another.
   * Saves both columns with new positions.
   * @param event - The CDK drop event
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
   * Opens the task detail dialog.
   * Delegates to the TasksService, which sets activeTask.
   * @param taskId - The ID of the clicked task
   */
  openTaskDialog(taskId: string): void {
    this.tasksService.openTaskDialog(taskId);
  }

  /**
   * Reads the search term from the input field.
   * @param event - The native input event
   */
  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value.toLowerCase();
  }
}
