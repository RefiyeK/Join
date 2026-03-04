import { Component } from '@angular/core';
import { Location } from '@angular/common';

/**
 * Legal Notice (Imprint) page component
 * @description Displays legal information, contact details, and terms of use
 */
@Component({
  selector: 'app-imprint',
  standalone: true,
  imports: [],
  templateUrl: './imprint.html',
  styleUrl: './imprint.scss',
})
export class Imprint {
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
