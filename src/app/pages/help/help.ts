import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { Header } from '../../shared/components/header/header';
import { Nav } from '../../shared/components/nav/nav';

/**
 * Help page component displaying usage instructions for Join.
 *
 * Shows static text content only.
 * The back arrow uses Location.back() to navigate to the
 * previous page regardless of where the user came from.
 */
@Component({
  selector: 'app-help',
  imports: [Header, Nav],
  templateUrl: './help.html',
  styleUrl: './help.scss',
})
export class Help {
  /**
   * Injects Location service for navigation
   * @param location Angular Location Service
   */
  constructor(private location: Location) {}

  /** Navigates back to the previous page. Triggered by the back arrow. */
  protected goBack(): void {
    this.location.back();
  }
}