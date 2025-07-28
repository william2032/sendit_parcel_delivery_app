import {User} from './user.models';
import {LocationI} from './location.interface';

export interface AdminDashboardStats {
  activeUsers: number;
  totalParcels: number;
  pendingParcels: number;
  inTransitParcels: number;
  deliveredToday: number;
  totalRevenue: number;
  activeDrivers: number;
  recentOrders: AdminParcelResponse[];
}

export interface AdminParcelResponse {
  trackingNumber: string;
  createdAt: string;
  receiverName: string;
  pickupLocationId: string;
  destinationLocationId: string;
  status: 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  sender?: User;
  receiver?: User | null;
  driver?: User | null;
  pickupLocation?: LocationI;
  destination?: LocationI;
}

export interface SearchFilters {
  customer: string;
  trackingNumber: string;
  pickupLocation: string;
  destination: string;
}
