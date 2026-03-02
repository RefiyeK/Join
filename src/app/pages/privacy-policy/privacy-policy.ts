import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { Nav } from '../../shared/components/nav/nav';
import { Header } from '../../shared/components/header/header';

/**
 * Privacy Policy page component
 * @description Zeigt die Datenschutzerklärung mit DSGVO-Informationen an
 */
@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [Nav, Header],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss'
})
export class PrivacyPolicy {
  /**
   * Konstruktor injiziert Location für die Navigation
   * @param location Angular Location Service
   */
  constructor(private location: Location) {}

  /**
   * Navigiert zurück zur vorherigen Seite
   */
  goBack(): void {
    this.location.back();
  }
}