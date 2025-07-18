import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {DashboardStats, DeliveryOrder} from "../../shared/models/admin-dashboard.interface";

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    FormsModule,CommonModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  dashboardStats: DashboardStats = {
    totalUsers: 89,
    totalOrders: 129,
    totalPending: 20,
    usersChange: 8.5,
    ordersChange: 1.3,
    pendingChange: 1.8
  };

  searchFilters = {
    customer: '',
    orderNumber: '',
    pickupLocation: '',
    destination: ''
  };

  deliveryOrders: DeliveryOrder[] = [
    {
      orderNumber: 'AHGA68',
      date: '23/09/2022',
      customer: 'Jacob Marcus',
      time: '2:00 pm',
      destination: '342 Oron road, Uyo',
      pickupLocation: '342 Oron road, Uyo'
    },
    {
      orderNumber: 'AHGA68',
      date: '23/09/2022',
      customer: 'Jacob Marcus',
      time: '2:00 pm',
      destination: '342 Oron road, Uyo',
      pickupLocation: '342 Oron road, Uyo'
    },
    {
      orderNumber: 'AHGA68',
      date: '23/09/2022',
      customer: 'Jacob Marcus',
      time: '2:00 pm',
      destination: '342 Oron road, Uyo',
      pickupLocation: '342 Oron road, Uyo'
    },
    {
      orderNumber: 'AHGA68',
      date: '23/09/2022',
      customer: 'Jacob Marcus',
      time: '2:00 pm',
      destination: '342 Oron road, Uyo',
      pickupLocation: '342 Oron road, Uyo'
    }
  ];

  filteredOrders: DeliveryOrder[] = [];
  currentPage = 1;
  totalPages = 1;
  totalEntries = 6;

  ngOnInit() {
    this.filteredOrders = this.deliveryOrders;
    this.totalPages = Math.ceil(this.deliveryOrders.length / 10);
    this.totalEntries = this.deliveryOrders.length;
  }

  // Methods for backend integration
  async loadDashboardStats() {
    // TODO: Replace with actual API call
    // this.dashboardStats = await this.dashboardService.getStats();
  }

  async loadDeliveryOrders() {
    // TODO: Replace with actual API call
    // this.deliveryOrders = await this.deliveryService.getOrders();
    // this.filteredOrders = this.deliveryOrders;
  }

  filterOrders() {
    this.filteredOrders = this.deliveryOrders.filter(order => {
      return (
        order.customer.toLowerCase().includes(this.searchFilters.customer.toLowerCase()) &&
        order.orderNumber.toLowerCase().includes(this.searchFilters.orderNumber.toLowerCase()) &&
        order.pickupLocation.toLowerCase().includes(this.searchFilters.pickupLocation.toLowerCase()) &&
        order.destination.toLowerCase().includes(this.searchFilters.destination.toLowerCase())
      );
    });
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }
}
