import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import {AuthService} from '../../../shared/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) { }

  canActivate(): boolean {
    const user = this.authService.getCurrentUser();
    if (user && user?.role?.toUpperCase() === 'ADMIN') {
      return true;
    }
    this.router.navigate(['login']);
    return false;
  }
}
