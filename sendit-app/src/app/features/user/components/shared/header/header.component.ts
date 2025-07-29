import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterLink, RouterLinkActive} from '@angular/router';
import {ScrollService} from '../../../../../shared/services/scroll-service';
import {AccountComponent} from '../../../../../shared/components/account/account.component';
import {Subscription} from 'rxjs';
import {AuthService} from '../../../../../shared/services/auth.service';
import {User} from '../../../../../shared/models/user.models';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, RouterLinkActive, AccountComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})

export class HeaderComponent implements OnInit, OnDestroy{
  showAccountModal = false;
  isMobileMenuOpen = false;
  currentUser: User | null = null;
  isLoggedIn = false;
  private userSubscription: Subscription = new Subscription();


  constructor(private scrollService: ScrollService, private router: Router, private authService: AuthService) {}
  ngOnInit() {
    // Subscribe to user changes
    this.userSubscription = this.authService.user$.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = this.authService.isLoggedIn();
    });

    // Initialize current user state
    this.currentUser = this.authService.getCurrentUser();
    this.isLoggedIn = this.authService.isLoggedIn();
  }

  ngOnDestroy() {
    this.userSubscription.unsubscribe();
  }

  getUserRole(): string {
    if (this.currentUser && this.currentUser.role) {
      return this.currentUser.role.charAt(0).toUpperCase() + this.currentUser.role.slice(1);
    }
    return 'CUSTOMER';
  }

  scrollToServices() {
    if (this.router.url === '/home') {
      this.scrollService.requestScrollToServices();
    } else {
      this.scrollService.requestScrollToServices();
      this.router.navigate(['/home']);
    }
  }

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

  onLogin(): void {
    this.router.navigate(['/login']);
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  closeAccountModal() {
    this.showAccountModal = false;
    document.body.classList.remove('modal-open');
  }

  getUserInitials(): string {
    if (!this.currentUser?.name) return '';
    return this.currentUser.name.charAt(0).toUpperCase();
  }
}
