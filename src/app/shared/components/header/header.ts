import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth-service';
import { ContactsService } from '../../../services/contacts-service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  /**
   * AuthService für Benutzer-Authentifizierung
   */
  authService = inject(AuthService);

  /**
   * ContactsService für Benutzerkontakte
   */
  contactsService = inject(ContactsService);

  isDropdownOpen = false;
  dropdownBounce = false;

  /**
   * Liefert den aktuell eingeloggten Benutzer als Kontakt-Objekt
   */
  currentUser = computed(() => {
    const currentUid = this.authService.loggetInUserUid();
    if (!currentUid) return null;
    return this.contactsService.contacts.find(c => c.uid === currentUid) || null;
  });

  /**
   * Führt Logout aus und schließt das Dropdown-Menü
   */
  logout() {
    this.authService.logout();
    this.closeDropdown();
  }

  /**
   * Öffnet oder schließt das Dropdown-Menü
   */
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  /**
   * Schließt das Dropdown-Menü
   */
  closeDropdown() {
    this.isDropdownOpen = false;
  }

  /**
   * Löst eine Bounce-Animation für das Dropdown aus
   */
  triggerBounce() {
    this.dropdownBounce = false;
    setTimeout(() => {
      this.dropdownBounce = true;
      setTimeout(() => this.dropdownBounce = false, 300);
    }, 10);
  }
}