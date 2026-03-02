import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactsService } from '../../../../services/contacts-service';
import { AuthService } from '../../../../services/auth-service';
import { Router } from '@angular/router';
import { SetDialogAnimation } from '../../../../shared/directives/set-dialog-animation';

/**
 * ContactDetails – Displays the detail view of the selected contact.
 *
 * Gets all data from contactsService.activContact.
 * Edit and Delete use service methods for Firebase.
 *
 * Mobile Features:
 * - Back button: Returns to the contacts list
 * - FAB menu: Shows Edit/Delete options
 */
@Component({
  selector: 'app-contact-details',
  imports: [CommonModule, SetDialogAnimation],
  templateUrl: './contact-details.html',
  styleUrl: './contact-details.scss',
})
export class ContactDetails {
  /** Central ContactsService. Public for template access. */
  contactsService = inject(ContactsService);
  authService = inject(AuthService);
  router = inject(Router);
  @ViewChild(SetDialogAnimation) dialogAnimationDirective!: SetDialogAnimation;

  /** Controls the visibility of the FAB dropdown menu. Only relevant for mobile view. */
  isFabMenuOpen = false;

  /** Toggles the FAB dropdown menu open or closed */
  toggleFabMenu(): void {
    this.isFabMenuOpen = !this.isFabMenuOpen;
  }

  /** Closes the FAB dropdown menu */
  closeFabMenu(): void {
    this.isFabMenuOpen = false;
  }

  /** Returns to the contacts list (mobile). Sets activContact to null to hide details. */
  onBackClick(): void {
    this.contactsService.activContact = null;
    this.closeFabMenu();
  }

  /**
   * Opens the dialog in edit mode for the current contact.
   * Uses openEditContactDialog() from the service which sets
   * isEditMode and opens the dialog via BehaviorSubject.
   */
  protected onEdit(): void {
    if (this.contactsService.activContact) {
      this.contactsService.openEditContactDialog();
    }
  }

  /**
   * Deletes the current contact from Firebase.
   * If the contact has no uid, deletes directly.
   * If the contact is the logged-in user, deletes contact and user account.
   * Otherwise shows a login-required dialog.
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