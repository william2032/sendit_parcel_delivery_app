import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterLink, RouterLinkActive} from '@angular/router';
import {ScrollService} from '../../../../../shared/services/scroll-service';
import {AccountComponent} from '../../../../../shared/components/account/account.component';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, RouterLinkActive, AccountComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})

export class HeaderComponent {
  showAccountModal = false;

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
  openAccountModal() {
    this.showAccountModal = true;
    document.body.classList.add('modal-open');
  }

  onJoinUs(): void {
    // Handle join us button click
    this.router.navigate(['/register']);

  }

  closeAccountModal() {
    this.showAccountModal = false;
    document.body.classList.remove('modal-open');
  }

}
