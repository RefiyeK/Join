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

  /**
   * Initialisiert die Dialog-Animation nach dem View-Init und reagiert auf das Öffnen/Schließen des Dialogs
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
   * Bereinigt die Subscription beim Zerstören der Komponente
   */
  ngOnDestroy(): void {
    this.taskSub?.unsubscribe();
  }

  /**
   * Öffnet den Dialog mit Animation
   */
  openDialog() {
    this.dialogAnimationDirective?.openDialogWithAnimation();
  }

  /**
   * Schließt den Dialog mit Animation
   */
  closeDialog() {
    this.dialogAnimationDirective?.closeDialogWithAnimation();
  }
}
