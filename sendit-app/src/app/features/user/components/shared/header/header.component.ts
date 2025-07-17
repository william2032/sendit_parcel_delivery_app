import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterLink, RouterLinkActive} from '@angular/router';
import {ScrollService} from '../../../../../shared/services/scroll-service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})

export class HeaderComponent {
  constructor(private scrollService: ScrollService, private router: Router) {}
  scrollToServices() {
    if (this.router.url === '/home') {
      this.scrollService.requestScrollToServices();
    } else {
      this.scrollService.requestScrollToServices();
      this.router.navigate(['/home']);
    }
  }
  isMobileMenuOpen = false;

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}
