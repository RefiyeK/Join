import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { Header } from '../../shared/components/header/header';
import { Nav } from '../../shared/components/nav/nav';

/**
 * Help – Zeigt die Hilfe-Seite mit Anleitung zur Nutzung von Join.
 *
 * Die Seite zeigt nur statischen Text.
 * Der Zurück-Pfeil nutzt Location.back(), um zur vorherigen Seite
 * zurückzukehren – egal von wo der User gekommen ist.
 */
@Component({
  selector: 'app-help',
  imports: [Header, Nav],
  templateUrl: './help.html',
  styleUrl: './help.scss',
})
export class Help {
  /**
   * Konstruktor injiziert Location für die Navigation
   * @param location Angular Location Service
   */
  constructor(private location: Location) {}

  /**
   * Navigiert zurück zur vorherigen Seite.
   * Wird vom Zurück-Pfeil oben rechts ausgelöst.
   */
  protected goBack(): void {
    this.location.back();
  }
}