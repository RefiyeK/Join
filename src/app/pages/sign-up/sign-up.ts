import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NewUser } from '../../interfaces/new-user';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-sign-up',
  imports: [RouterLink, FormsModule],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.scss',
})
export class SignUp implements OnInit {
  checkPrivacyPolicy = false;

  newUser: NewUser = {
    name: '',
    email: '',
    passwort: '',
    confirmPassword: '',
    privacyPolicy: true,
  };

  ngOnInit(): void {
    this.setInitalValues();
  }

  setInitalValues() {
    this.newUser = {
      name: 'test',
      email: 'test@test.de',
      passwort: '12345678',
      confirmPassword: '12345678',
      privacyPolicy: false,
    };
  }

  onSubmit() {
    // this.setUserData();
    console.log(this.newUser);
    this.clearInput();
  }

  clearInput() {
    this.newUser.name = '';
    this.newUser.email = '';
    this.newUser.passwort = '';
    this.newUser.confirmPassword = '';
    this.newUser.privacyPolicy = true;
  }

  setPrivacyPolicy() {
    if (this.newUser.privacyPolicy) {
      this.newUser.privacyPolicy = false;
      this.checkPrivacyPolicy = false;
    } else {
      this.newUser.privacyPolicy = true;
    }
  }
}
