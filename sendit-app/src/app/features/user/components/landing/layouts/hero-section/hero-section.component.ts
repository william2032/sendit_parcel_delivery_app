import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-hero-section',
  imports: [CommonModule],
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.scss'
})
export class HeroSectionComponent {
  constructor(
    private router: Router,
  ) {}
  onJoinUs(): void {
    // Handle join us button click
    this.router.navigate(['/register']);

  }

  onLogin(): void {
    // Handle login button click
    this.router.navigate(['/login']);

  }
}
