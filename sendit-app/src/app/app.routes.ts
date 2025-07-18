import {Routes} from '@angular/router';
import {LandingComponent} from './features/user/components/landing/landing.component';
import {TrackOrderComponent} from './features/user/components/track-order/track-order.component';
import {AccountComponent} from './shared/components/account/account.component';
import {AdminLayoutComponent} from './features/admin/layouts/admin-main/admin-layout.component';
import {UserLayoutComponent} from './features/admin/layouts/users/user-layout.component';
import {AdminDashboardComponent} from './features/admin/admin-dashboard.component';
import {OrdersLayoutComponent} from './features/admin/layouts/orders/orders-layout.component';
import {DeliveryLayoutComponent} from './features/admin/layouts/delivery/delivery-layout.component';

export const routes: Routes = [
  {
    path: 'home', component: LandingComponent,
    children: [
      {path: 'account-settings', component: AccountComponent},
    ]
  },
  {path: 'home/track-order', component: TrackOrderComponent},
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

  // Redirect root to /home
  {path: '', redirectTo: 'home', pathMatch: 'full'},
  // Redirect unknown paths to /home (or 404 if needed)
  {path: '**', redirectTo: 'home'}
];

