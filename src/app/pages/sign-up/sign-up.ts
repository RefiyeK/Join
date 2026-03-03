import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NewUser } from '../../interfaces/new-user';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sign-up',
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.scss',
})
export class SignUp {
  /**
   * Object for the new user data
   */
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
  showPrivacyPolicyError = false;
  pwType = 'password';
  confirmPwType = 'password';

  /**
   * Performs the registration and opens the dialog
   */
  async onSubmit() {
    await this.authService.createUser(this.newUser);
    this.openDialog();
    this.showPrivacyPolicyError = false;
  }

  /**
   * Validates the inputs and starts the registration process
   * @param form Form reference
   * @param passwortValue Password value
   * @param confirmPasswordValue Confirmation value
   */
  onSignUpClick(form: any, passwortValue: string, confirmPasswordValue: string) {
    if (!this.newUser.privacyPolicy) {
      this.showPrivacyPolicyError = true;
      return;
    }
    if (form.invalid || passwortValue !== confirmPasswordValue) {
      this.showPrivacyPolicyError = false;
      return;
    }
    this.showPrivacyPolicyError = false;
    this.onSubmit();
  }

  /**
   * Resets all input fields
   */
  clearInput() {
    this.newUser.name = '';
    this.newUser.email = '';
    this.newUser.passwort = '';
    this.newUser.confirmPassword = '';
    this.newUser.privacyPolicy = false;
  }

  /**
   * Sets or removes consent to the privacy policy
   */
  setPrivacyPolicy() {
    if (this.newUser.privacyPolicy) {
      this.newUser.privacyPolicy = false;
    } else {
      this.newUser.privacyPolicy = true;
    }
  }

  /**
   * Opens the dialog with animation and navigates to login after a short time
   */
  openDialog() {
    this.openDialogWithAnimation();
    setTimeout(() => {
      this.closeDialogWithAnimation();
    }, 1500);
    setTimeout(() => this.router.navigateByUrl('/login'), 2000);
  }

  /**
   * Opens the dialog with slide-in animation
   */
  openDialogWithAnimation() {
    this.dialogIsClosing = false;
    this.dialogRef.nativeElement.showModal();
    this.dialogRef.nativeElement.classList.remove('slide-out');
    this.dialogRef.nativeElement.classList.add('slide-in');
  }

  /**
   * Closes the dialog with slide-out animation
   */
  closeDialogWithAnimation() {
    this.dialogRef.nativeElement.classList.remove('slide-in');
    this.dialogRef.nativeElement.classList.add('slide-out');

    setTimeout(() => {
      this.dialogIsClosing = true;
      this.dialogRef.nativeElement.classList.remove('slide-out');
      this.dialogRef.nativeElement.close();
    }, 500);
  }

  /**
   * Toggles the display of the password field between text and password
   * @param elementType Field type ('pwType' or 'confirmPwType')
   */
  changePwIcon(elementType: 'pwType' | 'confirmPwType') {
    if (this[elementType] == 'password') {
      this[elementType] = 'text';
    } else {
      this[elementType] = 'password';
    }
  }
}
