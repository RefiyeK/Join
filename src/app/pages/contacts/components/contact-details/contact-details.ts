import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactsService } from '../../../../services/contacts-service';
import { AuthService } from '../../../../services/auth-service';
import { Router } from '@angular/router';
import { SetDialogAnimation } from '../../../../shared/directives/set-dialog-animation';

/**
 * ContactDetails – Displays the detail view of the selected contact.
 *
 * Retrieves all data from contactsService.activContact.
 * Edit and Delete use the service methods for Firebase.
 *
 * Mobile Features:
 * - Back button: Returns to the contact list
 * - FAB menu: Shows Edit/Delete options
 */
@Component({
  selector: 'app-contact-details',
  imports: [CommonModule, SetDialogAnimation],
  templateUrl: './contact-details.html',
  styleUrl: './contact-details.scss',
})
export class ContactDetails {
  /**
   * Access to the central ContactsService.
   * Public so the template can access it.
   */
  contactsService = inject(ContactsService);
  authService = inject(AuthService);
  router = inject(Router);
  @ViewChild(SetDialogAnimation) dialogAnimationDirective!: SetDialogAnimation;

  /**
   * Controls the visibility of the FAB dropdown menu.
   * Only relevant for mobile view.
   */
  isFabMenuOpen = false;

  /**
   * Opens/closes the FAB dropdown menu.
   */
  toggleFabMenu(): void {
    this.isFabMenuOpen = !this.isFabMenuOpen;
  }

  /**
   * Closes the FAB dropdown menu.
   */
  closeFabMenu(): void {
    this.isFabMenuOpen = false;
  }

  /**
   * Returns to the contact list (mobile).
   * Sets activContact to null, which hides the details.
   */
  onBackClick(): void {
    this.contactsService.activContact = null;
    this.closeFabMenu();
  }

  /**
   * Opens the dialog in edit mode for the current contact.
   * Uses openEditContactDialog() from the service,
   * which sets isEditMode and opens the dialog via the BehaviorSubject.
   */
  protected onEdit(): void {
    if (this.contactsService.activContact) {
      this.contactsService.openEditContactDialog();
    }
  }

  /**
   * Deletes the current contact from Firebase.
   * Uses deleteContact() from the ContactsService.
   */
  protected async onDelete(): Promise<void> {
    const contact = this.contactsService.activContact;
    if (contact && contact.id) {
      if (contact.uid == '') {
        await this.contactsService.deleteContact(contact.id);
      } else if (this.authService.loggetInUserUid() == contact.uid) {
        await this.contactsService.deleteContact(contact.id);
        this.router.navigateByUrl('/login');
        this.authService.deleteUser();
      } else {
        this.dialogAnimationDirective.openDialogWithAnimation();
        setTimeout(() => this.dialogAnimationDirective.closeDialogWithAnimation(), 2500);
      }
    }
  }
}
