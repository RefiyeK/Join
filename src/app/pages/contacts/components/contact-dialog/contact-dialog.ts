import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  ViewChild,
  HostListener,
} from '@angular/core';
import { ContactsService } from '../../../../services/contacts-service';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SetDialogAnimation } from '../../../../shared/directives/set-dialog-animation';

@Component({
  selector: 'app-contact-dialog',
  imports: [CommonModule, FormsModule, SetDialogAnimation],
  templateUrl: './contact-dialog.html',
  styleUrl: './contact-dialog.scss',
})
export class ContactDialog implements AfterViewInit, OnDestroy {
  contactsService = inject(ContactsService);
  @ViewChild('dialogRef') dialogRef!: ElementRef;
  @ViewChild(SetDialogAnimation) dialogAnimationDirective!: SetDialogAnimation;
  private dialogSub!: Subscription;
  isClosing = false;

  showSnackbar = false;
  snackbarMessage = '';

  addNewSingleContact = {
    name: '',
    email: '',
    phone: '',
  };

  // This flag tracks if the submit button was clicked
  submitted = false;

  // This function checks if the name has at least 2 letters and contains only letters
  isNameValid(): boolean {
    const name = this.addNewSingleContact.name.trim();
    return name.length >= 2 && /^[A-Za-zÀ-ÖØ-öø-žÄäÖöÜüß\s]+$/.test(name);
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target?.name === 'name') {
      target.value = target.value.replace(/[^A-Za-zÀ-ÖØ-öø-žÄäÖöÜüß\s]/g, '');
      this.addNewSingleContact.name = target.value;
    }
    if (target?.name === 'phone') {
      target.value = target.value.replace(/[^+\d]/g, '');
      this.addNewSingleContact.phone = target.value;
    }
  }

  // This function checks if the email is valid
  isEmailValid(): boolean {
    const email = this.addNewSingleContact.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isPhoneValid(): boolean {
    const phone = this.addNewSingleContact.phone.trim();
    if (!phone) return true;
    const phoneRegex = /^(?:\+\d{1,3}|00\d{1,3})?0?\d{2,5}[\/\s]?\d{5,10}$/;
    return phoneRegex.test(phone);
  }

  // This function checks if the whole form is valid
  isFormValid(): boolean {
    return this.isNameValid() && this.isEmailValid() && this.isPhoneValid();
  }

  /**
   * Saves the contact – distinguishes between Add and Edit.
   * Edit mode: Updates the existing contact in Firebase.
   * Add mode: Creates a new contact in Firebase.
   * Closes the dialog only AFTER successful saving.
   */
  async saveContact(): Promise<void> {
    if (!this.isFormValid()) return;
    // Formulardaten zusammenstellen
    const contactData = this.buildContactData();
    // Je nach Modus: Update oder Neu anlegen
    if (this.contactsService.isEditMode) {
      await this.updateExistingContact(contactData);
    } else {
      await this.contactsService.addNewSingleContactToDB(contactData);
    }
    this.handleSuccessfulSave();
  }

  /**
   * Creates the data object from the form fields.
   * The name is trimmed and the first letter is capitalized.
   * @returns Object with properly formatted name, and trimmed email and phone
   */
  private buildContactData(): { name: string; email: string; phone: string } {
    return {
      name:
        this.addNewSingleContact.name.trim().charAt(0).toUpperCase() +
        this.addNewSingleContact.name.slice(1),
      email: this.addNewSingleContact.email.trim(),
      phone: this.addNewSingleContact.phone.trim(),
    };
  }

  /**
   * Updates the active contact in Firebase.
   * Gets the ID from activContact and calls updateContact() in the service.
   * @param data - The updated contact data
   */
  private async updateExistingContact(data: {
    name: string;
    email: string;
    phone: string;
  }): Promise<void> {
    const contactId = this.contactsService.activContact?.id;
    if (contactId) {
      await this.contactsService.updateContact(contactId, data);
    }
  }

  /**
   * Called after successful saving.
   * Shows the success snackbar, clears the form, and closes the dialog.
   */
  private handleSuccessfulSave(): void {
    this.submitted = false; // reset flag nach erfolgreichem Speichern
    this.showSuccessSnackbar();
    this.clearInputFields();
    this.contactsService.closeAddContactDialog();
  }

  /**
   * Shows a success snackbar with an appropriate message.
   * Edit mode: "Contact successfully updated!"
   * Add mode: "Contact successfully created!"
   * The snackbar automatically disappears after 3 seconds.
   */
  showSuccessSnackbar(): void {
    // Nachricht je nach Modus setzen
    this.snackbarMessage = this.contactsService.isEditMode
      ? 'Contact successfully updated!'
      : 'Contact successfully created!';
    this.showSnackbar = true;
    // Nach 3 Sekunden automatisch ausblenden
    setTimeout(() => {
      this.showSnackbar = false;
    }, 2000);
  }

  clearInputFields() {
    this.addNewSingleContact.name = '';
    this.addNewSingleContact.email = '';
    this.addNewSingleContact.phone = '';
  }

  resetForm() {
    this.submitted = false;
  }

  closeDialog() {
    this.resetForm();
    this.contactsService.closeAddContactDialog();
  }

  cancelDialog() {
    this.resetForm();
    this.contactsService.closeAddContactDialog();
  }

  /**
   * Fills the form depending on the mode.
   * Edit mode: Loads the data of the active contact into the form fields.
   * Add mode: Clears all fields for a new contact.
   * Called before the dialog becomes visible.
   */
  private loadFormData(): void {
    const contact = this.contactsService.activContact;
    // Prüft: Sind wir im Edit-Modus UND gibt es einen aktiven Kontakt?
    if (this.contactsService.isEditMode && contact) {
      // Ja → Formular mit bestehenden Daten füllen
      this.addNewSingleContact.name = contact.name;
      this.addNewSingleContact.email = contact.email;
      this.addNewSingleContact.phone = contact.phone;
    } else {
      // Nein → Formular leeren (Add-Modus)
      this.clearInputFields();
    }
    this.resetForm();
  }

  openDialogWithAnimation() {
    this.dialogAnimationDirective.openDialogWithAnimation();
  }

  closeDialogWithAnimation() {
    this.dialogAnimationDirective.closeDialogWithAnimation();

    setTimeout(() => {
      this.contactsService.isEditMode = false;
    }, 500);
  }

  /**
   * Lifecycle hook: Called after the view has been initialized.
   * Here we subscribe to the dialog observable from the service.
   * On every change (true/false), the dialog reacts accordingly.
   * This is the BehaviorSubject pattern from Philipp's documentation.
   */
  ngAfterViewInit(): void {
    // Subscription speichern, um sie in ngOnDestroy aufheben zu können
    this.dialogSub = this.contactsService.openDialog$.subscribe((dialogOpen) => {
      if (dialogOpen) {
        // Erst Formulardaten laden (Edit: befüllen, Add: leeren)
        this.loadFormData();
        // Dann Dialog mit Animation öffnen
        this.openDialogWithAnimation();
      } else {
        // Dialog mit Animation schließen
        this.closeDialogWithAnimation();
      }
    });
  }

  /**
   * Lifecycle hook, called when the component is destroyed.
   * Here the subscription is cleaned up to avoid memory leaks.
   * This is important because otherwise the observable keeps running even if the component no longer exists.
   */
  ngOnDestroy() {
    // Überprüft, ob eine Subscription existiert, und beendet sie.
    this.dialogSub?.unsubscribe();
  }

  // Neue Methode zum kontrollierten Submit mit Fehlermeldungen anzeigen
  onSubmit(): void {
    this.submitted = true;
    if (!this.isFormValid()) return;
    this.saveContact();
  }

  /**
   * Deletes the active contact and shows a success snackbar.
   * Uses the deleteContact() method from the service.
   */
  async deleteContact(): Promise<void> {
    const contactId = this.contactsService.activContact?.id;
    if (!contactId) return;

    await this.contactsService.deleteContact(contactId);
    this.snackbarMessage = 'Contact successfully deleted!';
    this.showSnackbar = true;
    setTimeout(() => {
      this.showSnackbar = false;
    }, 2000);
    this.closeDialog();
  }

  /**
   * Returns the initials for the avatar (edit mode).
   * Uses the getInitials() method from the service.
   */
  getContactInitials(): string {
    if (!this.contactsService.activContact) return '';
    return this.contactsService.getInitials(this.contactsService.activContact.name);
  }
}
