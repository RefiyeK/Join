import { Component } from '@angular/core';
import { Location } from '@angular/common';

/**
 * Privacy Policy page component
 * @description Displays the privacy policy with GDPR information
 */
@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss',
})
export class PrivacyPolicy {
  /**
   * Constructor injects Location for navigation
   * @param location Angular Location Service
   */
  constructor(private location: Location) {}

  /**
   * Navigates back to the previous page
   */
  goBack(): void {
    this.location.back();
  }
}
