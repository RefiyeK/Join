import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login implements OnInit {
  logoAnimated = false;
  formVisible = false;

  ngOnInit(): void {
    setTimeout(() => {
      this.logoAnimated = true;
    }, 400);

    setTimeout(() => {
      this.formVisible = true;
    }, 1200);
  }
}