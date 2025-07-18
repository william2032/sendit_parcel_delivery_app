import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {OrdersFilters, OrdersResponse} from '../models/orders.interface';
import {DeliveryOrder} from '../models/parcel-interface';


@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private apiUrl = 'http://localhost:3000/api'; // Replace with your API URL

  constructor(private http: HttpClient) {}

  /**
   * Get all orders with optional filters
   */
  getOrders(filters: OrdersFilters = {}): Observable<OrdersResponse> {
    let params = new HttpParams();

    if (filters.weightCategory) {
      params = params.set('weightCategory', filters.weightCategory);
    }

    if (filters.status) {
      params = params.set('status', filters.status);
    }

    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }

    if (filters.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    if (filters.search) {
      params = params.set('search', filters.search);
    }

    return this.http.get<OrdersResponse>(`${this.apiUrl}/orders`, { params });
  }

  /**
   * Get a specific order by ID
   */
  getOrder(id: string): Observable<DeliveryOrder> {
    return this.http.get<DeliveryOrder>(`${this.apiUrl}/orders/${id}`);
  }

  /**
   * Create a new order
   */
  createOrder(order: Partial<DeliveryOrder>): Observable<DeliveryOrder> {
    return this.http.post<DeliveryOrder>(`${this.apiUrl}/orders`, order);
  }

  /**
   * Update an existing order
   */
  updateOrder(id: string, order: Partial<DeliveryOrder>): Observable<DeliveryOrder> {
    return this.http.put<DeliveryOrder>(`${this.apiUrl}/orders/${id}`, order);
  }

  /**
   * Delete an order
   */
  deleteOrder(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/orders/${id}`);
  }

  /**
   * Update order status
   */
  updateOrderStatus(id: string, status: string): Observable<DeliveryOrder> {
    return this.http.patch<DeliveryOrder>(`${this.apiUrl}/orders/${id}/status`, { status });
  }

  /**
   * Get order statistics
   */
  getOrderStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/orders/stats`);
  }
}
