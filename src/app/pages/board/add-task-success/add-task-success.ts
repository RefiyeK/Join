import { AfterViewInit, Component, ElementRef, inject, OnDestroy, ViewChild } from '@angular/core';
import { TasksService } from '../../../services/tasks-service';
import { Subscription } from 'rxjs';
import { SetDialogAnimation } from '../../../shared/directives/set-dialog-animation';

@Component({
  selector: 'app-add-task-success',
  imports: [SetDialogAnimation],
  templateUrl: './add-task-success.html',
  styleUrl: './add-task-success.scss',
})
export class AddTaskSuccess implements AfterViewInit, OnDestroy {
  tasksService = inject(TasksService);

  private sucessDialogSub!: Subscription;
  @ViewChild('dialogRef') dialog!: ElementRef;
  @ViewChild(SetDialogAnimation) dialogAnimation!: SetDialogAnimation;

  /**
   * Opens the success dialog with animation and navigates to the board after a short time
   */
  ngAfterViewInit(): void {
    this.sucessDialogSub = this.tasksService.successDialogOpen$.subscribe((open) => {
      if (open) {
        this.dialogAnimation.openDialogWithAnimation();
        setTimeout(() => {
          this.dialogAnimation.closeDialogWithAnimation();
        }, 2000);
      }
    });
  }

  /**
   * Cleans up the subscription when the component is destroyed
   */
  ngOnDestroy(): void {
    this.sucessDialogSub?.unsubscribe();
  }
}
