import { Routes } from '@angular/router';
import {LandingComponent} from './features/user/components/landing/landing.component';
import {TrackOrderComponent} from './features/user/components/track-order/track-order.component';
import {AccountComponent} from './shared/components/account/account.component';
import {AuthComponent} from './features/auth/auth.component';

export const routes: Routes = [
  { path: 'home', component: LandingComponent },
  { path: 'home/track-order', component: TrackOrderComponent },
  { path: 'home/account-settings', component: AccountComponent },



  { path: 'login', component: AuthComponent, data: { mode: 'login' } },
  { path: 'register', component: AuthComponent, data: { mode: 'register' } },
  { path: 'forgot-password', component: AuthComponent, data: { mode: 'forgot-password' } },
  { path: 'reset-password', component: AuthComponent, data: { mode: 'reset-password' } },

  // Redirect root to /home
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  // Redirect unknown paths to /home (or 404 if needed)
  { path: '**', redirectTo: 'home' }
];

