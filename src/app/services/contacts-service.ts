import { inject, Injectable, OnDestroy } from '@angular/core';
import {
  collection,
  Firestore,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
  getDocs,
} from '@angular/fire/firestore';
import { SingleContact } from '../interfaces/single-contact';
import { BehaviorSubject, Observable } from 'rxjs';
import { AssignedAvatarItem } from '../interfaces/assigned-avatar';

@Injectable({
  providedIn: 'root',
})
export class ContactsService implements OnDestroy {
  /** Central source for contact lists. */
  contacts: SingleContact[] = [];
  /** Central source for contact groups. */
  contactGroups: string[] = [];
  /** Active contact. */
  activContact: SingleContact | null = null;
  /** Status of edit mode. */
  isEditMode = false;
  /** Firestore instance. */
  contactsDB: Firestore = inject(Firestore);
  /** Unsubscribe function for contacts. */
  unsubContacts;

  /**
   * Controls opening/closing of the dialog.
   */
  private openDialogSubject = new BehaviorSubject<boolean>(false);

  /**
   * Observable for the dialog status.
   */
  openDialog$: Observable<boolean> = this.openDialogSubject.asObservable();

  private contactsSubject = new BehaviorSubject<SingleContact[]>([]);

  contacts$ = this.contactsSubject.asObservable();

  constructor() {
    this.unsubContacts = this.subContactsList();
  }

  /**
   * Creates a contact object from data and an ID.
   * @param obj Source data
   * @param id Contact ID
   * @returns The created contact object
   */
  setContactObject(obj: any, id: string): SingleContact {
    return {
      id: id,
      uid: obj.uid || '',
      name: obj.name || '',
      email: obj.email || '',
      phone: obj.phone || '',
    };
  }

  /**
   * Returns the reference to the contacts collection.
   * @returns The collection reference for contacts
   */
  getNotesRef() {
    return collection(this.contactsDB, 'contacts');
  }

  /**
   * Subscribes to the contact list in Firebase with real-time updates.
   * @returns The unsubscribe function for the subscription
   */
  subContactsList() {
    return onSnapshot(this.getNotesRef(), (list) => {
      this.contacts = [];
      list.forEach((element) => {
        this.contacts.push(this.setContactObject(element.data(), element.id));
      });
      this.updateContactGroups();
      this.refreshActivContact();

      this.contactsSubject.next(this.contacts);
    });
  }

  /**
   * Loads contacts once from Firebase (for AddTask component)
   * @returns Promise with the loaded contacts
   */
  async loadContacts(): Promise<SingleContact[]> {
    if (this.contacts.length > 0) {
    return this.contacts;
  }
  return new Promise((resolve) => {
    const sub = this.contacts$.subscribe((contacts) => {
      if (contacts.length > 0) {
        sub.unsubscribe();
        resolve(contacts);
      }
    });
  });
  }

  /**
   * Ends the subscription to the contacts.
   * @returns void
   */
  ngOnDestroy(): void {
    if (this.unsubContacts) this.unsubContacts();
  }

  /**
   * Returns the current contact list.
   * @returns The contact list
   */
  getContacts(): SingleContact[] {
    return this.contacts;
  }

  /**
   * Returns the contact groups.
   * @returns The contact groups
   */
  getContactGroups(): string[] {
    return this.contactGroups;
  }

  /**
   * Calculates the contact groups.
   * @returns void
   */
  updateContactGroups(): void {
    this.contactGroups = [];
    for (let position = 0; position < this.contacts.length; position++) {
      const initialLetter = this.contacts[position].name.charAt(0).toUpperCase();
      if (!this.contactGroups.includes(initialLetter)) {
        this.contactGroups.push(initialLetter);
      }
    }
    this.contactGroups = this.contactGroups.sort();
  }

  /**
   * Synchronizes the active contact with the current data from the contact list.
   * @private
   * @returns void
   */
  private refreshActivContact(): void {
    if (!this.activContact || !this.activContact.id) {
      return;
    }
    const updatedContact = this.contacts.find((contact) => contact.id === this.activContact!.id);
    this.activContact = updatedContact || null;
  }

  /**
   * Sets the clicked contact as active.
   * @param clickedContact The selected contact
   * @returns void
   */
  getActivContact(clickedContact: SingleContact): void {
    this.activContact = clickedContact;
  }

  /**
   * Returns the initials of a name.
   * @param name Name of the contact
   * @returns The initials (maximum 2 letters)
   */
  getInitials(name: string): string {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  /**
   * Calculates the icon color for a contact.
   * @param contact Contact object
   * @returns CSS class name for the icon color
   */
  getIconColorClass(contact: SingleContact): string {
    if (contact.color) return contact.color;
    const lettersArray = 'ABCDEFGHJKLMNOPQRSTUVW'.split('');
    const nameParts = contact.name.split(' ');
    const letter = (nameParts[1]?.charAt(0) || nameParts[0].charAt(0)).toUpperCase();
    const index = lettersArray.indexOf(letter);
    const colorId = index !== -1 ? (index % 15) + 1 : 1;
    return `icon-${colorId}`;
  }

  /**
   * Returns the reference to a single contact document.
   * @param contactId The ID of the contact
   * @returns The document reference
   * @private
   */
  private getSingleContactRef(contactId: string) {
    return doc(this.contactsDB, 'contacts', contactId);
  }

  /**
   * Deletes a contact from Firebase.
   * @param contactId The ID of the contact to delete
   * @returns Promise that resolves when the contact is deleted
   */
  async deleteContact(contactId: string): Promise<void> {
    const contactRef = this.getSingleContactRef(contactId);
    await deleteDoc(contactRef);
    this.activContact = null;
  }

  /**
   * Updates an existing contact in Firebase.
   * @param contactId The ID of the contact
   * @param updatedData New data (name, email, phone)
   * @returns Promise that resolves when the contact is updated
   */
  async updateContact(contactId: string, updatedData: Partial<SingleContact>): Promise<void> {
    const contactRef = this.getSingleContactRef(contactId);
    await updateDoc(contactRef, updatedData);
  }

  /**
   * Adds a new contact to the database.
   * @param addNewSingleContact The contact object
   * @returns Promise that resolves when the contact is added
   */
  async addNewSingleContactToDB(addNewSingleContact: SingleContact): Promise<void> {
    if (!addNewSingleContact.color) {
      addNewSingleContact.color = this.getIconColorClass(addNewSingleContact);
    }
    await addDoc(collection(this.contactsDB, 'contacts'), addNewSingleContact);
  }

  /**
   * Opens the modal to add a contact.
   * @returns void
   */
  openAddContactDialog(): void {
    this.openDialogSubject.next(true);
  }

  /**
   * Opens the dialog in edit mode.
   * @returns void
   */
  openEditContactDialog(): void {
    this.isEditMode = true;
    this.openDialogSubject.next(true);
  }

  /**
   * Closes the dialog and resets edit mode.
   * @returns void
   */
  closeAddContactDialog(): void {
    this.openDialogSubject.next(false);
  }

  /**
   * Removes IDs that do not exist in the current contact list.
   * @param assignedIds Array of assigned contact IDs
   * @returns Array of valid contact IDs
   */
  sanitizeAssignedIds(assignedIds: string[] = []): string[] {
    const validIds: string[] = [];

    for (const id of assignedIds) {
      const exists = this.contacts.some((contact) => contact.id === id);
      if (exists && !validIds.includes(id)) {
        validIds.push(id);
      }
    }
    return validIds;
  }

  /**
   * Returns only resolved assigned users with existing contact IDs.
   * @param assignedIds Array of assigned contact IDs
   * @returns Array of AssignedAvatarItem
   */
  buildAssignedUsers(assignedIds: string[] = []): AssignedAvatarItem[] {
    const validIds = this.sanitizeAssignedIds(assignedIds);
    const assignedUsers: AssignedAvatarItem[] = [];

    for (const contactId of validIds) {
      const user = this.resolveAssignedAvatarItem(contactId);
      // Safety check, should be true by sanitizeAssignedIds
      if (user.name !== 'Unknown User') {
        assignedUsers.push(user);
      }
    }

    return assignedUsers;
  }

  /**
   * Builds a compact preview:
   * - visible: maximum `maxVisible` entries
   * - remaining: number of remaining contacts for "+N"
   * @param assignedIds Array of assigned contact IDs
   * @param maxVisible Maximum number of visible avatars
   * @returns Object with visible and remaining
   */
  buildAssignedAvatarPreview(
    assignedIds: string[] = [],
    maxVisible: number = 3,
  ): { visible: AssignedAvatarItem[]; remaining: number } {
    const resolvedUsers = this.buildAssignedUsers(assignedIds);

    // 2) maxVisible absichern (keine negativen Werte)
    let safeMaxVisible = maxVisible;
    if (safeMaxVisible < 0) {
      safeMaxVisible = 0;
    }

    // 3) Sichtbare User-Liste manuell aufbauen (maximal safeMaxVisible)
    const visibleUsers: AssignedAvatarItem[] = [];
    for (let i = 0; i < resolvedUsers.length; i++) {
      if (i >= safeMaxVisible) {
        break;
      }
      visibleUsers.push(resolvedUsers[i]);
    }

    // 4) Restanzahl berechnen
    let remainingUsersCount = resolvedUsers.length - visibleUsers.length;
    if (remainingUsersCount < 0) {
      remainingUsersCount = 0;
    }

    return {
      visible: visibleUsers,
      remaining: remainingUsersCount,
    };
  }

  /**
   * Internal resolver:
   * ID -> actual contact (name/color/initials) or stable fallback.
   * @param contactId Contact ID
   * @returns AssignedAvatarItem
   */
  private resolveAssignedAvatarItem(contactId: string): AssignedAvatarItem {
    const foundContact = this.contacts.find((contact) => contact.id === contactId);

    if (!foundContact) {
      return {
        id: contactId,
        name: 'Unknown User',
        initials: '??',
        color: 'icon-1',
      };
    }

    return {
      id: foundContact.id || contactId,
      name: foundContact.name,
      initials: this.getInitials(foundContact.name),
      color: this.getIconColorClass(foundContact),
    };
  }
}
