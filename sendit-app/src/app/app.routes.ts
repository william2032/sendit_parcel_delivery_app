import { Routes } from '@angular/router';
import {LandingComponent} from './features/user/components/landing/landing.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: '**', redirectTo: '' }
];
