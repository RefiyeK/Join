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
import { authGuard, authMatchGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'sign-up', component: SignUp },
  { path: 'login', component: Login },
  { path: 'summary', component: Summary, canActivate: [authGuard], canMatch: [authMatchGuard] },
  { path: 'add-task', component: AddTask, canActivate: [authGuard], canMatch: [authMatchGuard] },
  { path: 'board', component: Board, canActivate: [authGuard], canMatch: [authMatchGuard] },
  { path: 'contacts', component: Contacts, canActivate: [authGuard], canMatch: [authMatchGuard] },
  { path: 'imprint', component: Imprint, canActivate: [authGuard], canMatch: [authMatchGuard] },
  { path: 'privacy-policy', component: PrivacyPolicy },
  { path: 'help', component: Help },
  { path: '**', redirectTo: 'login' },
];
