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
  imports: [CommonModule],
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

  /**
   * Adds the CSS class for the summary page on creation
   */
  constructor() {
    document.body.classList.add('summary-page');
  }

  /**
   * Initializes the component and sets the greeting on mobile devices
   */
  ngOnInit(): void {
    const alreadyGreeted = sessionStorage.getItem('greetingShown');
    if (alreadyGreeted) {
      this.showGreeting = false;
    } else {
      sessionStorage.setItem('greetingShown', 'true');
    }

    this.bpSub = this.breakpointObserver.observe(['(max-width: 1024px)']).subscribe((result) => {
      this.isMobile = result.matches;
      this.handleMobileGreeting();
    });
  }

  /**
   * Controls the greeting behavior on mobile devices.
   * Shows the greeting for 2 seconds, then hides it.
   * Only executed if the greeting has not been shown yet.
   */
  private handleMobileGreeting(): void {
    if (!this.isMobile || !this.showGreeting) return;
    this.greetingTimeout = setTimeout(() => {
      this.showGreeting = false;
    }, 2000);
  }

  /** Returns the name of the currently logged-in user */
  get loggedInUserName(): string {
    const uid = this.authService.loggetInUserUid();
    if (!uid) return '';
    const contact = this.contactsService.contacts.find((c) => c.uid === uid);
    return contact?.name ?? '';
  }

  /** Number of "To do" tasks */
  get todoCount(): number {
    return this.tasksService.tasks.filter((t) => t.status === 'To do').length;
  }

  /** Number of "Done" tasks */
  get doneCount(): number {
    return this.tasksService.tasks.filter((t) => t.status === 'Done').length;
  }

  /** Number of "In progress" tasks */
  get inProgressCount(): number {
    return this.tasksService.tasks.filter((t) => t.status === 'In progress').length;
  }

  /** Number of "Await feedback" tasks */
  get awaitFeedbackCount(): number {
    return this.tasksService.tasks.filter((t) => t.status === 'Await feedback').length;
  }

  /** Total number of all tasks */
  get totalCount(): number {
    return this.tasksService.tasks.length;
  }

  /** Number of "Urgent" tasks */
  get urgentCount(): number {
    return this.tasksService.tasks.filter((t) => t.priority === 'Urgent').length;
  }

  /**
   * Formats the upcoming deadline date for display.
   * Returns e.g. "March 15, 2026".
   * Shows "No deadline" if no task with a deadline exists.
   * @returns Formatted date as a readable string
   */
  get formattedUpcomingDeadline(): string {
    const task = this.tasksService.upcomingTask;
    if (!task?.dueDate) return 'No deadline';
    const date = new Date(task.dueDate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /** Removes the CSS class and cleans up subscriptions/timeouts on destroy */
  ngOnDestroy(): void {
    document.body.classList.remove('summary-page');
    this.bpSub?.unsubscribe();
    clearTimeout(this.greetingTimeout);
  }
}
