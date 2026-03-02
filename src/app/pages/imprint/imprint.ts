import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { Nav } from '../../shared/components/nav/nav';
import { Header } from '../../shared/components/header/header';

/**
 * Legal Notice (Imprint) page component
 * @description Zeigt rechtliche Informationen, Kontaktangaben und Nutzungsbedingungen an
 */
@Component({
  selector: 'app-imprint',
  standalone: true,
  imports: [Nav, Header],
  templateUrl: './imprint.html',
  styleUrl: './imprint.scss'
})
export class Imprint {
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