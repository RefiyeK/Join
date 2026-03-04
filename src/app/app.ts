import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TasksService } from './services/tasks-service';
import { AddTaskSuccess } from './pages/board/add-task-success/add-task-success';
import { Header } from './shared/components/header/header';
import { Nav } from './shared/components/nav/nav';
import { Summary } from './pages/summary/summary';

@Component({
  selector: 'app-root',
  imports: [AddTaskSuccess, Header, Nav, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('join');
  tasksService = inject(TasksService);
}
