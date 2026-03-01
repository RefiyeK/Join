import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth-service';


/**
 * Represents a navigation menu item
 * @property {string} icon - Icon filename without extension (e.g., 'summary', 'board')
 * @property {string} label - Display text for the menu item
 * @property {string} route - Angular router path
 */
interface NavItem {
  icon: string;
  label: string;
  route: string;
}

/**
 * Represents a footer link item
 * @property {string} label - Display text for the link
 * @property {string} route - Angular router path
 */
interface FooterLink {
  label: string;
  route: string;
}


/**
 * Main navigation component
 * 
 * @description Responsive navigation that displays as:
 * - Desktop (≥768px): Vertical sidebar (232px) with logo, menu, and footer links
 * - Mobile (<768px): Horizontal bottom bar with menu icons only
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
   * Main navigation menu items displayed in sidebar/bottom bar
   * @protected
   * @readonly
   */

  protected readonly menuItems: NavItem[] = [
    { icon: 'summary', label: 'Summary', route: '/summary' },
    { icon: 'add-task', label: 'Add Task', route: '/add-task' },
    { icon: 'board', label: 'Board', route: '/board' },
    { icon: 'contacts', label: 'Contacts', route: '/contacts' }
  ];

  /**
   * Footer links displayed only on desktop view
   * @protected
   * @readonly
   */
  protected readonly footerLinks: FooterLink[] = [
    { label: 'Privacy Policy', route: '/privacy-policy' },
    { label: 'Legal notice', route: '/imprint' }
  ];
}
