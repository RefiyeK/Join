import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { Nav } from '../../shared/components/nav/nav';
import { Header } from '../../shared/components/header/header';

/**
 * Legal Notice (Imprint) page component
 * @description Displays legal information, contact details, and terms of use
 */
@Component({
  selector: 'app-imprint',
  standalone: true,
  imports: [Nav, Header],
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
