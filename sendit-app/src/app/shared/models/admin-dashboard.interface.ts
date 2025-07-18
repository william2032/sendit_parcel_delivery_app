export interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalPending: number;
  usersChange: number;
  ordersChange: number;
  pendingChange: number;
}

export interface DeliveryOrder {
  orderNumber: string;
  date: string;
  customer: string;
  time: string;
  destination: string;
  pickupLocation: string;
}
