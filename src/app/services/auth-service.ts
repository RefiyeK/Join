import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
  deleteUser,
  signOut,
} from 'firebase/auth';
import { NewUser } from '../interfaces/new-user';
import { ContactsService } from './contacts-service';
import { SingleContact } from '../interfaces/single-contact';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private contactsService = inject(ContactsService);

  /**
   * Signal für die UID des eingeloggten Users (für reaktiven Header)
   */
  loggetInUserUid = signal<string | null>(localStorage.getItem('uid'));

  isNewUser?: boolean;

  /**
   * Erstellt einen neuen User und legt ihn als Kontakt an.
   * @param newUser Die Daten des neuen Users
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
   * Login mit E-Mail und Passwort
   * @param email E-Mail-Adresse
   * @param password Passwort
   * @returns UserCredential
   */
  async login(email: string, password: string): Promise<UserCredential> {
    const auth = getAuth();
    const credential = await signInWithEmailAndPassword(auth, email, password);

    this.loggetInUserUid.set(credential.user.uid);
    localStorage.setItem('uid', credential.user.uid);

    return credential;
  }

  /**
   * Loggt den User aus und löscht die UID
   */
  async logout() {
    const auth = getAuth();
    await signOut(auth);
    this.loggetInUserUid.set(null);
    localStorage.removeItem('uid');
    this.router.navigate(['/login']);
  }

  /**
   * Löscht den aktuell eingeloggten User aus Firebase
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
