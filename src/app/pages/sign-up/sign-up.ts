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
   * Objekt für die neuen Userdaten
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
   * Führt die Registrierung durch und öffnet den Dialog
   */
  async onSubmit() {
    await this.authService.createUser(this.newUser);
    this.openDialog();
    this.showPrivacyPolicyError = false;
  }

  /**
   * Validiert die Eingaben und startet den Registrierungsprozess
   * @param form Formularreferenz
   * @param passwortValue Passwortwert
   * @param confirmPasswordValue Bestätigungswert
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
   * Setzt alle Eingabefelder zurück
   */
  clearInput() {
    this.newUser.name = '';
    this.newUser.email = '';
    this.newUser.passwort = '';
    this.newUser.confirmPassword = '';
    this.newUser.privacyPolicy = false;
  }

  /**
   * Setzt oder entfernt die Zustimmung zur Datenschutzrichtlinie
   */
  setPrivacyPolicy() {
    if (this.newUser.privacyPolicy) {
      this.newUser.privacyPolicy = false;
    } else {
      this.newUser.privacyPolicy = true;
    }
  }

  /**
   * Öffnet den Dialog mit Animation und navigiert nach kurzer Zeit zum Login
   */
  openDialog() {
    this.openDialogWithAnimation();
    setTimeout(() => {
      this.closeDialogWithAnimation();
    }, 1500);
    setTimeout(() => this.router.navigateByUrl('/login'), 2000);
  }

  /**
   * Öffnet den Dialog mit Slide-In-Animation
   */
  openDialogWithAnimation() {
    this.dialogIsClosing = false;
    this.dialogRef.nativeElement.showModal();
    this.dialogRef.nativeElement.classList.remove('slide-out');
    this.dialogRef.nativeElement.classList.add('slide-in');
  }

  /**
   * Schließt den Dialog mit Slide-Out-Animation
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
   * Wechselt die Anzeige des Passwortfeldes zwischen Text und Passwort
   * @param elementType Feldtyp ('pwType' oder 'confirmPwType')
   */
  changePwIcon(elementType: 'pwType' | 'confirmPwType') {
    if (this[elementType] == 'password') {
      this[elementType] = 'text';
    } else {
      this[elementType] = 'password';
    }
  }
}
