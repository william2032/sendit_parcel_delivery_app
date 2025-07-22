import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';

@Component({
  selector: 'app-cta-section',
  imports: [ CommonModule],
  templateUrl: './cta-section.component.html',
  styleUrl: './cta-section.component.scss'
})
export class CtaSectionComponent {
  constructor(
    private router: Router,
  ) {}
  primaryButtonText = 'JOIN US TODAY';
  trustIndicatorText = 'Trusted by businesses across Kenya';
  securityBadgeText = 'Secure • Reliable • Locally Compliant';

  trustCompanies = ['G4S Courier', 'Wells Fargo', 'DHL Express', 'Posta Kenya'];

  onPrimaryCTA(): void {
    // Handle primary CTA click
    console.log('Primary CTA clicked');
    this.router.navigate(['/register']);
  }

}
