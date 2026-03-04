import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { TasksService } from './services/tasks-service';
import { AddTaskSuccess } from './pages/board/add-task-success/add-task-success';
import { Header } from './shared/components/header/header';
import { Nav } from './shared/components/nav/nav';

@Component({
  selector: 'app-root',
  imports: [AddTaskSuccess, Header, Nav, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  router = inject(Router);

  protected readonly title = signal('join');
  tasksService = inject(TasksService);

  isLoginRoute() {
    if (this.router.url == '/login' || this.router.url == '/sign-up') {
      return true;
    } else {
      return false;
    }
  }
}
