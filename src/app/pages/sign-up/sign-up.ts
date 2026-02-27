import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NewUser } from '../../interfaces/new-user';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth-service';
import { SetDialogAnimation } from '../../shared/directives/set-dialog-animation';

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
  authService = inject(AuthService);
  @ViewChild('dialogRef') dialogRef!: ElementRef;
  dialogIsClosing = true;

  ngOnInit(): void {
    this.setInitalValues();
  }

  setInitalValues() {
    this.newUser = {
      name: 'Test Person',
      email: 'person@test.de',
      passwort: '12345678',
      confirmPassword: '12345678',
      privacyPolicy: true,
    };
  }

  async onSubmit() {
    await this.authService.createUser(this.newUser);
    this.openDialog();
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

  openDialog() {
    this.openDialogWithAnimation();
    setTimeout(() => {
      this.closeDialogWithAnimation();
    }, 2500);
  }

  openDialogWithAnimation() {
    this.dialogIsClosing = false;
    this.dialogRef.nativeElement.showModal();
    this.dialogRef.nativeElement.classList.remove('slide-out');
    this.dialogRef.nativeElement.classList.add('slide-in');
  }

  closeDialogWithAnimation() {
    this.dialogRef.nativeElement.classList.remove('slide-in');
    this.dialogRef.nativeElement.classList.add('slide-out');

    setTimeout(() => {
      this.dialogIsClosing = true;
      this.dialogRef.nativeElement.classList.remove('slide-out');
      this.dialogRef.nativeElement.close();
    }, 500);
  }
}
