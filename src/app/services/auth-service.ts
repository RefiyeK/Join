import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
} from 'firebase/auth';
import { NewUser } from '../interfaces/new-user';
import { ContactsService } from './contacts-service';
import { SingleContact } from '../interfaces/single-contact';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private contactsService = inject(ContactsService);

  //Achtung funktion ist nur für den loginbereich gedacht und leitet automatisch zur startseite weiter
  async createUser(newUser: NewUser) {
    const auth = getAuth();
    await createUserWithEmailAndPassword(auth, newUser.email, newUser.passwort)
      .then((userCredential) => {
        // Signed up
        const user = userCredential.user;
        const uid = user.uid;
        let validUserName = newUser.name;
        validUserName = validUserName.charAt(0).toUpperCase() + validUserName.slice(1);

        const newContact: SingleContact = {
          uid: uid,
          name: validUserName,
          email: newUser.email,
          phone: '01737984315',
        };
        this.contactsService.addNewSingleContactToDB(newContact);
        setTimeout(() => this.router.navigateByUrl('/login'), 2000);
        // ...
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(error);
        console.log(`existiert schon`);
        // ..
      });
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
