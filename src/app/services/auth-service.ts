import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
  deleteUser,
} from 'firebase/auth';
import { NewUser } from '../interfaces/new-user';
import { ContactsService } from './contacts-service';
import { SingleContact } from '../interfaces/single-contact';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private contactsService = inject(ContactsService);
  loggetInUserUid?: string;
  isNewUser?: boolean;

  //Achtung funktion ist nur für den loginbereich gedacht und leitet automatisch zur startseite weiter
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
      // ...
    } catch (error) {
      this.isNewUser = false;
      console.error('The user already exists');
    }
    setTimeout(() => this.router.navigateByUrl('/login'), 3000);
  }

  deleteUser() {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      deleteUser(user)
        .then(() => {
          // User deleted.
        })
        .catch((error) => {
          // An error ocurred
          // ...
        });
    }
  }

  /**
   * Login mit E-Mail und Passwort
   * Gibt ein Promise zurück, das entweder resolved oder einen Fehler wirft
   */
  async login(email: string, password: string): Promise<UserCredential> {
    const auth = getAuth();
    return signInWithEmailAndPassword(auth, email, password);
  }
}
