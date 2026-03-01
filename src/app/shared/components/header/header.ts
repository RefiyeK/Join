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
  // 1. Die Services müssen injiziert sein
  authService = inject(AuthService);
  contactsService = inject(ContactsService);

  isDropdownOpen = false;
  dropdownBounce = false;

  // 2. Der Vergleich für den Avatar (wie besprochen)
  currentUser = computed(() => {
    const currentUid = this.authService.loggetInUserUid();
    if (!currentUid) return null;
    return this.contactsService.contacts.find(c => c.uid === currentUid) || null;
  });


  logout() {
    this.authService.logout(); // Ruft die Logout-Logik im Service auf
    this.closeDropdown();      // Schließt das Menü
  }
  // ----------------------------------------------------

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  triggerBounce() {
    this.dropdownBounce = false;
    setTimeout(() => {
      this.dropdownBounce = true;
      setTimeout(() => this.dropdownBounce = false, 300);
    }, 10);
  }
}