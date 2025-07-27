import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import { Router } from '@angular/router';
import {AuthService} from '../../../../../../shared/services/auth.service';
import {Subscription} from 'rxjs';
import {User} from '../../../../../../shared/models/user.models';

@Component({
  selector: 'app-hero-section',
  imports: [CommonModule],
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.scss'
})
export class HeroSectionComponent implements OnInit{
  isLoggedIn = false;

  constructor(
    private router: Router,private authService: AuthService
  ) {}
  private userSubscription: Subscription = new Subscription();

  currentUser: User | null = null;
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
  onJoinUs(): void {
    // Handle join us button click
    this.router.navigate(['/register']);

  }

  onLogin(): void {
    // Handle login button click
    this.router.navigate(['/login']);

  }
}
