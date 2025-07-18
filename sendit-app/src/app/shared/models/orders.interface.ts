import {DeliveryOrder} from './parcel-interface';

export interface OrdersResponse {
  orders: DeliveryOrder[];
  total: number;
  page: number;
  limit: number;
}

export interface OrdersFilters {
  weightCategory?: string;
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}
