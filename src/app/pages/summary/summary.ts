import { Component, inject } from '@angular/core';
import { Header } from '../../shared/components/header/header';
import { Nav } from '../../shared/components/nav/nav';
import { TasksService } from '../../services/tasks-service';

@Component({
  selector: 'app-summary',
  imports: [Header, Nav],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  tasksService = inject(TasksService);
todoHover = false;
doneHover = false;
}