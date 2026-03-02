import { AfterViewInit, Component, ElementRef, inject, OnDestroy, ViewChild } from '@angular/core';
import { TasksService } from '../../../services/tasks-service';
import { Subscription } from 'rxjs';
import { SetDialogAnimation } from '../../../shared/directives/set-dialog-animation';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-task-success',
  imports: [SetDialogAnimation],
  templateUrl: './add-task-success.html',
  styleUrl: './add-task-success.scss',
})
export class AddTaskSuccess implements AfterViewInit, OnDestroy {
  tasksService = inject(TasksService);
  private router = inject(Router);
  private sucessDialogSub!: Subscription;
  @ViewChild('dialogRef') dialog!: ElementRef;
  @ViewChild(SetDialogAnimation) dialogAnimation!: SetDialogAnimation;

  ngAfterViewInit(): void {
    this.sucessDialogSub = this.tasksService.successDialogOpen$.subscribe((open) => {
      if (open) {
        this.dialogAnimation.openDialogWithAnimation();
        setTimeout(() => {
          this.dialogAnimation.closeDialogWithAnimation();
        }, 2000);
        setTimeout(() => this.router.navigateByUrl('/board'), 2500);
      }
    });
  }

  ngOnDestroy(): void {
    this.sucessDialogSub?.unsubscribe();
  }
}
