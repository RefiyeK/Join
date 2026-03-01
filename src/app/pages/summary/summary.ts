import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '../../shared/components/header/header';
import { Nav } from '../../shared/components/nav/nav';
import { TasksService } from '../../services/tasks-service';
import { ContactsService } from '../../services/contacts-service';
import { AuthService } from '../../services/auth-service';
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
  contactsService = inject(ContactsService);
  authService = inject(AuthService);
  breakpointObserver = inject(BreakpointObserver);

  todoHover = false;
  doneHover = false;
  showGreeting = true;
  isMobile = false;

  private bpSub!: Subscription;
  private greetingTimeout!: ReturnType<typeof setTimeout>;

  constructor() {
    document.body.classList.add('summary-page');
  }

  ngOnInit(): void {
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

  get loggedInUserName(): string {
    const uid = this.authService.loggetInUserUid();
    if (!uid) return '';
    const contact = this.contactsService.contacts.find(c => c.uid === uid);
    return contact?.name ?? '';
  }

  get todoCount(): number {
    return this.tasksService.tasks.filter(t => t.status === 'To do').length;
  }

  get doneCount(): number {
    return this.tasksService.tasks.filter(t => t.status === 'Done').length;
  }

  get inProgressCount(): number {
    return this.tasksService.tasks.filter(t => t.status === 'In progress').length;
  }

  get awaitFeedbackCount(): number {
    return this.tasksService.tasks.filter(t => t.status === 'Await feedback').length;
  }

  get totalCount(): number {
    return this.tasksService.tasks.length;
  }

  get urgentCount(): number {
    return this.tasksService.tasks.filter(t => t.priority === 'Urgent').length;
  }

  ngOnDestroy(): void {
    document.body.classList.remove('summary-page');
    this.bpSub?.unsubscribe();
    clearTimeout(this.greetingTimeout);
  }
}