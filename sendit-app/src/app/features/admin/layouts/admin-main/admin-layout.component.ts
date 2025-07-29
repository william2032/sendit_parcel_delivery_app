import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router, RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {AuthService} from '../../../../shared/services/auth.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-admin-main',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent implements OnInit, OnDestroy{
  currentUser: any = null;
  isLoggedIn: boolean = false;
  private userSubscription!: Subscription;

  constructor(private router: Router,    private authService: AuthService) {}
  ngOnInit() {
    // Subscribe to user changes
    this.userSubscription = this.authService.user$.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = this.authService.isLoggedIn();

    });

    // Initialize current user state
    this.currentUser = this.authService.getCurrentUser();
    this.isLoggedIn = this.authService.isLoggedIn();

    // Check if user is authorized for admin access
    this.checkAdminAccess();
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
  logout() {
    try {
      this.authService.logout(); // assumed to be void
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.currentUser = null;
      this.isLoggedIn = false;
      this.router.navigate(['/login']);
    }
  }


  getUserDisplayName(): string {
    if (this.currentUser) {
      return this.currentUser.firstName && this.currentUser.lastName
        ? `${this.currentUser.firstName} ${this.currentUser.lastName}`
        : this.currentUser.username || this.currentUser.email || 'Admin User';
    }
    return 'Admin User';
  }

  /**
   * Get user role for display
   */
  getUserRole(): string {
    if (this.currentUser && this.currentUser.role) {
      return this.currentUser.role.charAt(0).toUpperCase() + this.currentUser.role.slice(1);
    }
    return 'Admin';
  }

  /**
   * Get user profile image
   */
  getUserProfileImage(): string {
    if (this.currentUser && this.currentUser.profileImage) {
      return this.currentUser.profileImage;
    }
    // Return default image if no profile image
    return "https://cdn.prod.website-files.com/67009da69b1f97d92249b0ba/6700ba3e8320a06d98f18f40_Testimonail%20Image%203.png";
  }

  navigateToAccountSettings() {
    this.router.navigate(['/auth/admin/account-settings']);
  }

  private checkAdminAccess() {
    if (!this.isLoggedIn) {
      this.router.navigate(['/home']);
      return;
    }

    // Check if user has admin role
    if (this.currentUser && this.currentUser.role !== 'admin') {
      // Redirect non-admin users
      this.router.navigate(['/auth/admin']);
      return;
    }
  }

  isRouteActive(route: string): boolean {
    return this.router.url === route;
  }
}
