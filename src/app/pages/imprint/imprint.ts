import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { Nav } from '../../shared/components/nav/nav';
import { Header } from '../../shared/components/header/header';

/** Legal Notice (Imprint) page component displaying legal information and contact details */
@Component({
  selector: 'app-imprint',
  standalone: true,
  imports: [Nav, Header],
  templateUrl: './imprint.html',
  styleUrl: './imprint.scss'
})
export class Imprint {
  /**
   * Injects Location service for navigation
   * @param location Angular Location Service
   */
  constructor(private location: Location) {}

  /** Navigates back to the previous page */
  goBack(): void {
    this.location.back();
  }
}