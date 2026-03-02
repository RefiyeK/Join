import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth-service';

/**
 * Repräsentiert ein Navigationsmenü-Item
 * @property {string} icon - Icon-Dateiname ohne Erweiterung (z.B. 'summary', 'board')
 * @property {string} label - Anzeige-Text für das Menü-Item
 * @property {string} route - Angular Router-Pfad
 */
interface NavItem {
  icon: string;
  label: string;
  route: string;
}

/**
 * Repräsentiert einen Footer-Link
 * @property {string} label - Anzeige-Text für den Link
 * @property {string} route - Angular Router-Pfad
 */
interface FooterLink {
  label: string;
  route: string;
}

/**
 * Haupt-Navigationskomponente
 *
 * @description Responsive Navigation, die wie folgt angezeigt wird:
 * - Desktop (≥768px): Vertikale Sidebar (232px) mit Logo, Menü und Footer-Links
 * - Mobile (<768px): Horizontale Bottom-Bar mit Menü-Icons
 *
 * @example
 * <app-nav></app-nav>
 */
@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav.html',
  styleUrl: './nav.scss',
})
export class Nav {
  authService = inject(AuthService);

  /**
   * Hauptmenü-Items für Sidebar/Bottom-Bar
   * @protected
   * @readonly
   */
  protected readonly menuItems: NavItem[] = [
    { icon: 'summary', label: 'Summary', route: '/summary' },
    { icon: 'add-task', label: 'Add Task', route: '/add-task' },
    { icon: 'board', label: 'Board', route: '/board' },
    { icon: 'contacts', label: 'Contacts', route: '/contacts' },
  ];

  /**
   * Footer-Links, nur auf Desktop sichtbar
   * @protected
   * @readonly
   */
  protected readonly footerLinks: FooterLink[] = [
    { label: 'Privacy Policy', route: '/privacy-policy' },
    { label: 'Legal notice', route: '/imprint' },
  ];
}
