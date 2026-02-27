import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NewUser } from '../../interfaces/new-user';
import { FormsModule } from '@angular/forms';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { AuthService } from '../../services/auth-service'; // <--- NEU

@Component({
  selector: 'app-sign-up',
  imports: [RouterLink, FormsModule],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.scss',
})
export class SignUp implements OnInit {
  newUser: NewUser = {
    name: '',
    email: '',
    passwort: '',
    confirmPassword: '',
    privacyPolicy: false,
  };
  router = inject(Router);
  authService = inject(AuthService); // <--- NEU

  ngOnInit(): void {
    this.setInitalValues();
  }

  setInitalValues() {
    this.newUser = {
      name: 'test',
      email: 'test@test.de',
      passwort: '12345678',
      confirmPassword: '12345678',
      privacyPolicy: true,
    };
  }

  onSubmit() {
    this.authService.createUser(this.newUser);
    console.log(this.newUser);
    this.clearInput();
  }

  clearInput() {
    this.newUser.name = '';
    this.newUser.email = '';
    this.newUser.passwort = '';
    this.newUser.confirmPassword = '';
    this.newUser.privacyPolicy = false;
  }

  setPrivacyPolicy() {
    if (this.newUser.privacyPolicy) {
      this.newUser.privacyPolicy = false;
    } else {
      this.newUser.privacyPolicy = true;
    }
  }
}
