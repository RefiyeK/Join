import { AfterViewInit, Component, inject, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { TasksService } from '../../../services/tasks-service';
import { AddTask } from '../../add-task/add-task';
import { SetDialogAnimation } from '../../../shared/directives/set-dialog-animation';

@Component({
  selector: 'app-add-task-dialog',
  imports: [AddTask, SetDialogAnimation],
  templateUrl: './add-task-dialog.html',
  styleUrl: './add-task-dialog.scss',
})
export class AddTaskDialog implements AfterViewInit, OnDestroy {
  tasksService = inject(TasksService);
  private taskSub!: Subscription;
  @ViewChild(SetDialogAnimation) dialogAnimationDirective!: SetDialogAnimation;
  @ViewChild(AddTask) addTaskComponent!: AddTask;

  /**
   * Initializes the dialog animation after view init and reacts to opening/closing the dialog
   */
  ngAfterViewInit(): void {
    this.taskSub = this.tasksService.openAddTaskDialog$.subscribe((open) => {
      if (open && !this.tasksService.smallView) {
        this.openDialog();
      } else {
        this.closeDialog();
      }
    });
  }

  /**
   * Cleans up the subscription when the component is destroyed
   */
  ngOnDestroy(): void {
    this.taskSub?.unsubscribe();
  }

  /**
   * Opens the dialog with animation
   */
  openDialog() {
    this.dialogAnimationDirective?.openDialogWithAnimation();
  }

  /**
   * Closes the dialog with animation and reset the form
   */
  closeDialog() {
    this.dialogAnimationDirective?.closeDialogWithAnimation();
    this.addTaskComponent?.clearForm();
  }
}
