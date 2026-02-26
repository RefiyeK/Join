import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  logoAnimated = false;
  formVisible = false;

  // Formular Variablen
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  // Für Input Error Styling
  emailError: boolean = false;
  passwordError: boolean = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Logo Animation
    setTimeout(() => {
      this.logoAnimated = true;
    }, 400);

    // Form einblenden
    setTimeout(() => {
      this.formVisible = true;
    }, 1200);
  }

  /**
   * Login mit E-Mail und Passwort
   */
  async login() {
    // Error States zurücksetzen
    this.emailError = false;
    this.passwordError = false;

    // Validierung
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter email and password';
      if (!this.email) this.emailError = true;
      if (!this.password) this.passwordError = true;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const auth = getAuth();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, this.email, this.password);

      // Erfolgreich eingeloggt
      console.log('Successfully logged in:', userCredential.user.uid);

      // Weiterleitung zur Summary-Seite
      this.router.navigate(['/summary']);
    } catch (error: any) {
      // Fehlerbehandlung
      console.error('Login error:', error);

      // Beide Inputs rot markieren bei falschen Anmeldedaten
      this.emailError = true;
      this.passwordError = true;

      // Firebase Fehlercodes auswerten
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          this.errorMessage = 'Incorrect email or password';
          break;
        case 'auth/invalid-email':
          this.errorMessage = 'Ungültiges E-Mail-Format';
          this.passwordError = false; // Nur Email rot
          break;
        case 'auth/too-many-requests':
          this.errorMessage = 'Too many failed attempts. Please try again later';
          this.emailError = false;
          this.passwordError = false;
          break;
        case 'auth/network-request-failed':
          this.errorMessage = 'Network error. Please check your internet connection';
          this.emailError = false;
          this.passwordError = false;
          break;
        default:
          this.errorMessage = 'An error occurred. Please try again';
          this.emailError = false;
          this.passwordError = false;
      }
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Guest Login - ohne automatische Testdaten
   * Leitet direkt zur Summary-Seite
   */
  guestLogin() {
    // Hier kommt später die Guest Login Logik
    // Erstmal nur Weiterleitung ohne Firebase
    this.router.navigate(['/summary']);
  }
}
