import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth-service';

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
  showPassword = false;

  private router = inject(Router);
  private authService = inject(AuthService);

  /**
   * Initializes the animations for the logo and the form
   */
  ngOnInit(): void {
    const firstVisit = !sessionStorage.getItem('logoAnimationPlayed');
    sessionStorage.setItem('logoAnimationPlayed', 'true');

    if (firstVisit) {
      setTimeout(() => {
        this.logoAnimated = true;
      }, 400);
      setTimeout(() => {
        this.formVisible = true;
      }, 1200);
    } else {
      this.logoAnimated = true;
      this.formVisible = true;
    }
  }

  /**
   * Login with email and password
   */

  // Formular Variablen
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  // Für Input Error Styling
  emailError: boolean = false;
  passwordError: boolean = false;

  /**
   * Executes the login and handles errors and redirection
   */
  async login() {
    this.emailError = false;
    this.passwordError = false;

    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter email and password';
      if (!this.email) this.emailError = true;
      if (!this.password) this.passwordError = true;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const userCredential = await this.authService.login(this.email, this.password);
      this.authService.loggetInUserUid.set(userCredential.user.uid);

      // Erfolgreich eingeloggt
      localStorage.setItem('uid', userCredential.user.uid);

      // Weiterleitung zur Summary-Seite
      this.router.navigate(['/summary']);
    } catch (error: any) {
      // Fehlerbehandlung
      this.emailError = true;
      this.passwordError = true;

      // Firebase Fehlercodes auswerten
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          this.errorMessage = 'Incorrect your email or password. Please try again.';
          break;
        case 'auth/invalid-email':
          this.errorMessage = 'Ungültiges E-Mail-Format';
          this.passwordError = false;
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
   * Guest login - without automatic test data
   * Redirects directly to the summary page
   */
  guestLogin() {
    this.authService.loggetInUserUid.set('guest');
    this.router.navigate(['/summary']);
  }
}
