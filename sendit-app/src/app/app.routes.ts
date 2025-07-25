import { Routes } from '@angular/router';
import {LandingComponent} from './features/user/components/landing/landing.component';
import {TrackOrderComponent} from './features/user/components/track-order/track-order.component';
import {AccountComponent} from './shared/components/account/account.component';
import {AdminLayoutComponent} from './features/admin/layouts/admin-main/admin-layout.component';
import {UserLayoutComponent} from './features/admin/layouts/users/user-layout.component';
import {AdminDashboardComponent} from './features/admin/admin-dashboard.component';
import {OrdersLayoutComponent} from './features/admin/layouts/orders/orders-layout.component';
import {DeliveryLayoutComponent} from './features/admin/layouts/delivery/delivery-layout.component';
import {PhoneVerifyLayoutComponent} from './features/auth/layouts/phone-verify/phone-verify-layout.component';
import {AuthComponent} from './features/auth/auth.component';
import {SupportComponent} from './shared/components/support/support.component';
import {DriverComponent} from './features/driver/driver.component';

export const routes: Routes = [
  {
    path: 'home', component: LandingComponent,
    children: [
      {path: 'account-settings', component: AccountComponent},
    ]
  },

  {path: 'home/track-order', component: TrackOrderComponent},
  {path: 'home/customer-support', component: SupportComponent},


  //otp verification
  {path: 'auth/verify-phone', component: PhoneVerifyLayoutComponent},
  //drivers
  {path: 'auth/dashboard-driver', component:DriverComponent},

  {
    path: 'auth/admin',
    component: AdminLayoutComponent,
    children: [
      {path: '', redirectTo: 'dashboard', pathMatch: 'full'},
      {path: 'dashboard', component: AdminDashboardComponent},
      {path: 'users', component: UserLayoutComponent},
      {path: 'orders', component: OrdersLayoutComponent},
      {path: 'make-delivery', component: DeliveryLayoutComponent},
      {path: 'account-settings', component: AccountComponent},
    ]
  },



  { path: 'login', component: AuthComponent, data: { mode: 'login' } },
  { path: 'register', component: AuthComponent, data: { mode: 'register' } },
  { path: 'forgot-password', component: AuthComponent, data: { mode: 'forgot-password' } },
  { path: 'reset-password', component: AuthComponent, data: { mode: 'reset-password' } },

  // Redirect root to /home
  {path: '', redirectTo: 'home', pathMatch: 'full'},
  // Redirect unknown paths to /home (or 404 if needed)
  {path: '**', redirectTo: 'home'}
];

