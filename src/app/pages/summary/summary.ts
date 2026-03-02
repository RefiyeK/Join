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

  /**
   * Fügt die CSS-Klasse für die Summary-Seite beim Erstellen hinzu
   */
  constructor() {
    document.body.classList.add('summary-page');
  }

  /**
   * Initializes the component.
   * Checks if the greeting has already been displayed (sessionStorage).
   * Mobile: Greeting is hidden after 2 seconds.
   * Desktop: Greeting is only shown on the first visit.
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

  /**
   * Liefert den Namen des eingeloggten Users
   */
  get loggedInUserName(): string {
    const uid = this.authService.loggetInUserUid();
    if (!uid) return '';
    const contact = this.contactsService.contacts.find((c) => c.uid === uid);
    return contact?.name ?? '';
  }

  /**
   * Anzahl der "To do"-Tasks
   */
  get todoCount(): number {
    return this.tasksService.tasks.filter((t) => t.status === 'To do').length;
  }

  /**
   * Anzahl der "Done"-Tasks
   */
  get doneCount(): number {
    return this.tasksService.tasks.filter((t) => t.status === 'Done').length;
  }

  /**
   * Anzahl der "In progress"-Tasks
   */
  get inProgressCount(): number {
    return this.tasksService.tasks.filter((t) => t.status === 'In progress').length;
  }

  /**
   * Anzahl der "Await feedback"-Tasks
   */
  get awaitFeedbackCount(): number {
    return this.tasksService.tasks.filter((t) => t.status === 'Await feedback').length;
  }

  /**
   * Gesamtanzahl aller Tasks
   */
  get totalCount(): number {
    return this.tasksService.tasks.length;
  }

  /**
   * Anzahl der "Urgent"-Tasks
   */
  get urgentCount(): number {
    return this.tasksService.tasks.filter((t) => t.priority === 'Urgent').length;
  }

  /**
   * Formatiert das Datum der nächsten Deadline für die Anzeige.
   * Gibt z. B. "March 15, 2026" zurück.
   * Falls kein Task mit Deadline existiert, wird "No deadline" angezeigt.
   * @returns Formatiertes Datum als lesbarer String
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

  /**
   * Entfernt die CSS-Klasse und bereinigt Subscriptions/Timeouts beim Zerstören
   */
  ngOnDestroy(): void {
    document.body.classList.remove('summary-page');
    this.bpSub?.unsubscribe();
    clearTimeout(this.greetingTimeout);
  }
}