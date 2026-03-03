import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { Header } from '../../shared/components/header/header';
import { Nav } from '../../shared/components/nav/nav';

/**
 * Help – Displays the help page with instructions for using Join.
 *
 * The page only shows static text.
 * The back arrow uses Location.back() to return to the previous page,
 * regardless of where the user came from.
 */
@Component({
  selector: 'app-help',
  imports: [Header, Nav],
  templateUrl: './help.html',
  styleUrl: './help.scss',
})
export class Help {
  /**
   * Constructor injects Location for navigation
   * @param location Angular Location Service
   */
  constructor(private location: Location) {}

  /**
   * Navigates back to the previous page.
   * Triggered by the back arrow at the top right.
   */
  protected goBack(): void {
    this.location.back();
  }
}
