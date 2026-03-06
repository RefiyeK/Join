import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
  deleteUser,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { NewUser } from '../interfaces/new-user';
import { ContactsService } from './contacts-service';
import { SingleContact } from '../interfaces/single-contact';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private contactsService = inject(ContactsService);

  /**
   * Signal for the UID of the logged-in user (for reactive header)
   */
  loggetInUserUid = signal<string | null>(localStorage.getItem('uid'));

  isNewUser?: boolean;

  /**
   * Creates a new user and adds them as a contact.
   * @param newUser The data of the new user
   */
  async createUser(newUser: NewUser) {
    const auth = getAuth();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.passwort,
      );
      const user = userCredential.user;
      const uid = user.uid;

      let validUserName = newUser.name;
      validUserName = validUserName.charAt(0).toUpperCase() + validUserName.slice(1);

      const newContact: SingleContact = {
        uid: uid,
        name: validUserName,
        email: newUser.email,
        phone: '',
      };

      this.isNewUser = true;
      this.contactsService.addNewSingleContactToDB(newContact);
    } catch (error) {
      this.isNewUser = false;
      console.error('The user already exists');
    }
  }

  /**
   * Login with email and password
   * @param email Email address
   * @param password Password
   * @returns UserCredential
   */
  async login(email: string, password: string): Promise<UserCredential> {
    const auth = getAuth();
    const credential = await signInWithEmailAndPassword(auth, email, password);

    this.loggetInUserUid.set(credential.user.uid);
    localStorage.setItem('uid', credential.user.uid);
    sessionStorage.removeItem('guestSession');

    return credential;
  }

  /**
   * Returns true if a Firebase user is authenticated or an active guest session exists.
   */
  async isAuthenticatedOrGuestAsync(): Promise<boolean> {
    const isGuest =
      sessionStorage.getItem('guestSession') === 'true' || this.loggetInUserUid() === 'guest';
    if (isGuest) return true;

    const auth = getAuth();
    if (auth.currentUser) return true;

    const isAuthenticated = await new Promise<boolean>((resolve) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          unsubscribe();
          resolve(!!user);
        },
        () => {
          unsubscribe();
          resolve(false);
        },
      );
    });

    if (!isAuthenticated) {
      this.loggetInUserUid.set(null);
      localStorage.removeItem('uid');
    }

    return isAuthenticated;
  }

  /**
   * Logs out the user and deletes the UID
   */
  async logout() {
    const auth = getAuth();
    await signOut(auth);
    this.loggetInUserUid.set(null);
    localStorage.removeItem('uid');
    sessionStorage.removeItem('guestSession');
    sessionStorage.removeItem('justLoggedIn');
    this.router.navigate(['/login']);
  }

  /**
   * Deletes the currently logged-in user from Firebase
   */
  deleteUser() {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      deleteUser(user)
        .then(() => {})
        .catch((error) => {});
    }
  }
}
