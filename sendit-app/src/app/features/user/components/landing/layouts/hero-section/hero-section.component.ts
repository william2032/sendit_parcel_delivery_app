import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-hero-section',
  imports: [CommonModule],
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.scss'
})
export class HeroSectionComponent {
  onJoinUs(): void {
    // Handle join us button click
    console.log('Join us clicked');
    // Add your navigation logic here
  }

  onLogin(): void {
    // Handle login button click
    console.log('Login clicked');
    // Add your navigation logic here
  }
}
