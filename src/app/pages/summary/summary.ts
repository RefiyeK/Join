import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '../../shared/components/header/header';
import { Nav } from '../../shared/components/nav/nav';
import { TasksService } from '../../services/tasks-service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-summary',
  imports: [Header, Nav, CommonModule],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary implements OnInit, OnDestroy {
  tasksService = inject(TasksService);
  breakpointObserver = inject(BreakpointObserver);

  todoHover = false;
  doneHover = false;
  showGreeting = true;
  isMobile = false;

  private bpSub!: Subscription;
  private greetingTimeout!: ReturnType<typeof setTimeout>;

  currentUserName: string = 'Sofia Müller';

  constructor() {
    document.body.classList.add('summary-page');
  }

  ngOnInit(): void {
    document.body.classList.remove('summary-page');
    this.bpSub?.unsubscribe();
    clearTimeout(this.greetingTimeout);
    this.bpSub = this.breakpointObserver
      .observe(['(max-width: 1024px)'])
      .subscribe((result) => {
        this.isMobile = result.matches;
        if (this.isMobile) {
          this.showGreeting = true;
          this.greetingTimeout = setTimeout(() => {
            this.showGreeting = false;
          }, 2000);
        }
      });
  }

  ngOnDestroy(): void {
    this.bpSub?.unsubscribe();
    clearTimeout(this.greetingTimeout);
  }
}