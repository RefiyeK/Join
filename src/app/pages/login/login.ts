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
  skipAnimation = false;

  private router = inject(Router);
  private authService = inject(AuthService);

  // Form variables
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  // isLoading: boolean = false;

  // Input error styling flags
  emailError: boolean = false;
  passwordError: boolean = false;

  /** Initializes the logo and form animations */
  ngOnInit(): void {
    const firstVisit = !localStorage.getItem('logoAnimationPlayed');
    localStorage.setItem('logoAnimationPlayed', 'true');
    if (firstVisit) {
      setTimeout(() => {
        this.logoAnimated = true;
      }, 400);
      setTimeout(() => {
        this.formVisible = true;
      }, 1200);
    } else {
      this.skipAnimation = true;
      this.logoAnimated = true;
      this.formVisible = true;
    }
  }

  /** Performs login and handles errors and redirection */
  async login() {
    this.emailError = false;
    this.passwordError = false;
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter email and password';
      if (!this.email) this.emailError = true;
      if (!this.password) this.passwordError = true;
      return;
    }

    // Frontend email format validation — prevents unnecessary HTTP requests
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(this.email)) {
    this.errorMessage = 'Invalid email format';
    this.emailError = true;
    return;
  }

  
    // this.isLoading = true;
    this.errorMessage = '';
    try {
      const userCredential = await this.authService.login(this.email, this.password);
      this.authService.loggetInUserUid.set(userCredential.user.uid);
      localStorage.setItem('uid', userCredential.user.uid);
      sessionStorage.removeItem('guestSession');
      sessionStorage.setItem('justLoggedIn', 'true');
      // Redirect to summary page
      this.router.navigate(['/summary']);
    } catch (error: any) {
      this.emailError = true;
      this.passwordError = true;
      // Evaluate Firebase error codes
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          this.errorMessage = 'Incorrect email or password. Please try again.';
          break;
        case 'auth/invalid-email':
          this.errorMessage = 'Invalid email format';
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
      // this.isLoading = false;
    }
  }

  /** Guest login - redirects directly to the summary page */
  guestLogin() {
    this.authService.loggetInUserUid.set('guest');
    localStorage.removeItem('uid');
    sessionStorage.setItem('guestSession', 'true');
    sessionStorage.setItem('justLoggedIn', 'true');
    this.router.navigate(['/summary']);
  }
}
