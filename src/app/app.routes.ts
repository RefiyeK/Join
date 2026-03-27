import { Routes } from '@angular/router';
import { Contacts } from './pages/contacts/contacts';
import { Imprint } from './pages/imprint/imprint';
import { PrivacyPolicy } from './pages/privacy-policy/privacy-policy';
import { Help } from './pages/help/help';
import { AddTask } from './pages/add-task/add-task';
import { Board } from './pages/board/board';
import { Summary } from './pages/summary/summary';
import { Login } from './pages/login/login';
import { SignUp } from './pages/sign-up/sign-up';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'sign-up', component: SignUp },
  { path: 'login', component: Login },
  { path: 'summary', component: Summary, canActivate: [authGuard] },
  { path: 'add-task', component: AddTask, canActivate: [authGuard]},
  { path: 'board', component: Board, canActivate: [authGuard]},
  { path: 'contacts', component: Contacts, canActivate: [authGuard]},
  { path: 'imprint', component: Imprint, canActivate: [authGuard]},
  { path: 'privacy-policy', component: PrivacyPolicy },
  { path: 'help', component: Help },
  { path: '**', redirectTo: 'login' },
];
