import {Component, OnInit} from '@angular/core';
import {DeliveryOrder} from '../../../../shared/models/parcel-interface';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-orders',
  imports: [CommonModule, FormsModule],

  templateUrl: './orders-layout.component.html',
  styleUrl: './orders-layout.component.scss'
})
export class OrdersLayoutComponent implements OnInit {
  math = Math;
  orders: DeliveryOrder[] = [];
  filteredOrders: DeliveryOrder[] = [];
  isRefreshing: boolean = false

  // Filter states
  selectedWeightCategory: string = '';
  selectedStatus: string = '';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 8;
  totalItems: number = 0;

  weightCategories = [
    'Ultra Light Parcel',
    'Light Parcel',
    'Medium Parcel',
    'Heavy Parcel',
    'Extra Heavy Parcel',
    'Freight'
  ];

  statuses = ['Completed', 'Picked', 'In Transit', 'Pending'];

  constructor() {}

  ngOnInit(): void {
    this.loadOrders();
  }

  // This method will be replaced with actual backend service call
  loadOrders(): void {
    // Mock data - replace with actual service call
    this.orders = [
      {
        id: '00001',
        deliveryAddress: '089 Kutch Green Apt. 448',
        date: '04 Sep 2025',
        weight: 3.5,
        quote: '2.1 - 5 kg',
        status: 'Completed'
      },
      {
        id: '00002',
        deliveryAddress: '979 Immanuel Ferry Suite 526',
        date: '04 Sep 2025',
        weight: 1.2,
        quote: '0.6 - 2 kg',
        status: 'Completed'
      },
      {
        id: '00003',
        deliveryAddress: '8587 Frida Ports',
        date: '04 Sep 2025',
        weight: 4.2,
        quote: '2.1 - 5 kg',
        status: 'Picked'
      },
      {
        id: '00004',
        deliveryAddress: '768 Destiny Lake Suite 600',
        date: '04 Sep 2025',
        weight: 3.8,
        quote: '2.1 - 5 kg',
        status: 'Completed'
      },
      {
        id: '00005',
        deliveryAddress: '042 Mylene Throughway',
        date: '04 Sep 2025',
        weight: 8.5,
        quote: '5.1 - 10 kg',
        status: 'Completed'
      },
      {
        id: '00006',
        deliveryAddress: '543 Weimann Mountain',
        date: '04 Sep 2025',
        weight: 4.1,
        quote: '2.1 - 5 kg',
        status: 'Completed'
      },
      {
        id: '00007',
        deliveryAddress: 'New Scottieberg',
        date: '04 Sep 2025',
        weight: 3.2,
        quote: '2.1 - 5 kg',
        status: 'Completed'
      },
      {
        id: '00008',
        deliveryAddress: 'New Jon',
        date: '04 Sep 2025',
        weight: 25.0,
        quote: 'Above 20 kg',
        status: 'In Transit'
      }
    ];

    this.filteredOrders = [...this.orders];
    this.totalItems = this.orders.length;
  }

  getWeightCategory(weight: number): string {
    if (weight <= 0.5) return 'Ultra Light Parcel';
    if (weight <= 2) return 'Light Parcel';
    if (weight <= 5) return 'Medium Parcel';
    if (weight <= 10) return 'Heavy Parcel';
    if (weight <= 20) return 'Extra Heavy Parcel';
    return 'Freight';
  }

  getStatusClass(status: string): string {
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium';
    switch (status) {
      case 'Completed':
        return `${baseClasses} bg-teal-100 text-teal-800`;
      case 'Picked':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'In Transit':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'Pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  }

  onWeightCategoryChange(category: string): void {
    this.selectedWeightCategory = category;
    this.applyFilters();
  }

  onStatusChange(status: string): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  handleStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.onStatusChange(value);
  }

  handleWeightCategoryChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this. onWeightCategoryChange(value);
  }

  applyFilters(): void {
    this.filteredOrders = this.orders.filter(order => {
      const matchesCategory = !this.selectedWeightCategory ||
        this.getWeightCategory(order.weight) === this.selectedWeightCategory;
      const matchesStatus = !this.selectedStatus || order.status === this.selectedStatus;

      return matchesCategory && matchesStatus;
    });

    this.totalItems = this.filteredOrders.length;
    this.currentPage = 1; // Reset to first page when filtering
  }

  resetFilters(): void {
    this.selectedWeightCategory = '';
    this.selectedStatus = '';
    this.filteredOrders = [...this.orders];
    this.totalItems = this.orders.length;
    this.currentPage = 1;
  }

  get paginatedOrders(): DeliveryOrder[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredOrders.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  goToPrevious(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToNext(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  // Method to refresh data from backend
  refreshOrders(): void {
    this.isRefreshing = true;

    // Simulate API call delay
    setTimeout(() => {
      this.loadOrders();
      this.isRefreshing = false;
    }, 1000); // Adjust delay as needed
  }

  protected readonly HTMLSelectElement = HTMLSelectElement;
}
