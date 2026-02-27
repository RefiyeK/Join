import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { NewUser } from '../interfaces/new-user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);

  //Achtung funktion ist nur für den loginbereich gedacht und leitet automatisch zur startseite weiter
  createUser(newUser: NewUser) {
    const auth = getAuth();
    createUserWithEmailAndPassword(auth, newUser.email, newUser.passwort)
      .then((userCredential) => {
        // Signed up
        const user = userCredential.user;
        console.log(`wurde angelegt`);
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
}
