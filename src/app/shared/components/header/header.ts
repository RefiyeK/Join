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
   * AuthService for user authentication
   */
  authService = inject(AuthService);

  /**
   * ContactsService for user contacts
   */
  contactsService = inject(ContactsService);
  isDropdownOpen = false;
  dropdownBounce = false;

  /**
   * Returns the currently logged-in user as a contact object
   */
  currentUser = computed(() => {
    const currentUid = this.authService.loggetInUserUid();
    if (!currentUid) return null;
    return this.contactsService.contacts.find((c) => c.uid === currentUid) || null;
  });

  /**
   * Performs logout and closes the dropdown menu
   */
  logout() {
    this.authService.logout();
    this.closeDropdown();
  }

  /**
   * Opens or closes the dropdown menu
   */
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  /**
   * Closes the dropdown menu
   */
  closeDropdown() {
    this.isDropdownOpen = false;
  }

  /**
   * Triggers a bounce animation for the dropdown
   */
  triggerBounce() {
    this.dropdownBounce = false;
    setTimeout(() => {
      this.dropdownBounce = true;
      setTimeout(() => (this.dropdownBounce = false), 300);
    }, 10);
  }
}
