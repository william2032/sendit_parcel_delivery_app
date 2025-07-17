import { Routes } from '@angular/router';
import {LandingComponent} from './features/user/components/landing/landing.component';
import {TrackOrderComponent} from './features/user/components/track-order/track-order.component';

export const routes: Routes = [
  { path: 'home', component: LandingComponent },
  { path: 'home/track-order', component: TrackOrderComponent },
  // Redirect root to /home
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  // Redirect unknown paths to /home (or 404 if needed)
  { path: '**', redirectTo: 'home' }
];

