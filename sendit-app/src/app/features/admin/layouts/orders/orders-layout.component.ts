import {Component, OnInit} from '@angular/core';
import {DeliveryOrder} from '../../../../shared/models/parcel-interface';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {AdminService} from '../../../../shared/services/admin.service';

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
  isRefreshing: boolean = false;
  isLoading: boolean = false;
  error: string | null = null;

  // Filter states
  selectedWeightCategory: string = '';
  selectedStatus: string = '';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 8;
  totalItems: number = 0;

  // Modal states
  showUpdateModal: boolean = false;
  showDeleteConfirmation: boolean = false;
  selectedOrder: DeliveryOrder | null = null;
  originalOrder: DeliveryOrder | null = null; // Store original for cancel functionality
  editMode: boolean = false;
  isUpdating: boolean = false;
  isDeleting: boolean = false;

  weightCategories = [
    'Ultra Light Parcel',
    'Light Parcel',
    'Medium Parcel',
    'Heavy Parcel',
    'Extra Heavy Parcel',
    'Freight'
  ];

  statuses = ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];

  constructor(private adminService: AdminService) {
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.error = null;

    this.adminService.getAllParcels().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.filteredOrders = [...this.orders];
        this.totalItems = this.orders.length;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.message || 'Failed to load orders';
        this.isLoading = false;
        console.error('Error loading orders:', error);
      }
    });
  }

  openUpdateModal(order: DeliveryOrder): void {
    this.selectedOrder = {...order}; // Create a copy
    this.originalOrder = {...order}; // Store original for cancel
    this.showUpdateModal = true;
    this.editMode = false;
  }

  closeUpdateModal(): void {
    this.showUpdateModal = false;
    this.selectedOrder = null;
    this.originalOrder = null;
    this.editMode = false;
    this.isUpdating = false;
  }

  enableEditMode(): void {
    this.editMode = true;
  }

  cancelEdit(): void {
    if (this.originalOrder && this.selectedOrder) {
      this.selectedOrder = {...this.originalOrder};
    }
    this.editMode = false;
  }

  saveOrder(): void {
    if (!this.selectedOrder) return;

    this.isUpdating = true;

    const categoryMap: { [key: string]: string } = {
      'Ultra Light Parcel': 'ULTRA_LIGHT',
      'Light Parcel': 'LIGHT',
      'Medium Parcel': 'MEDIUM',
      'Heavy Parcel': 'HEAVY',
      'Extra Heavy Parcel': 'EXTRA_HEAVY',
      'Freight': 'FREIGHT'
    };

    // Create update payload with only allowed fields
    const updatePayload: any = {
      senderName: this.selectedOrder.senderName,
      senderPhone: this.selectedOrder.senderPhone,
      senderEmail: this.selectedOrder.senderEmail,
      receiverName: this.selectedOrder.receiverName,
      receiverPhone: this.selectedOrder.receiverPhone,
      receiverEmail: this.selectedOrder.receiverEmail,
      pickupAddress: this.selectedOrder.pickupLocation?.address,
      destinationAddress: this.selectedOrder.destination?.address,
      weight: this.selectedOrder.weight,
      weightCategory: categoryMap[this.selectedOrder.weightCategory] || this.selectedOrder.weightCategory,
      status: this.selectedOrder.status,
      estimatedDeliveryTime: this.selectedOrder.estimatedDeliveryDate
        ? new Date(this.selectedOrder.estimatedDeliveryDate).toISOString()
        : null,
    };

    this.adminService.updateParcel(this.selectedOrder.id, updatePayload).subscribe({
      next: (updatedOrder) => {
        // Find and update the order in the orders array
        const index = this.orders.findIndex(order => order.id === updatedOrder.id);
        if (index !== -1) {
          this.orders[index] = updatedOrder;
          this.applyFilters(); // Refresh filtered orders
        }

        this.isUpdating = false;
        this.editMode = false;
        this.originalOrder = {...updatedOrder};

        // Show success message
        alert('Order updated successfully');
      },
      error: (error) => {
        this.isUpdating = false;
        this.error = error.message || 'Failed to update order';
        console.error('Error updating order:', error);
      }
    });
  }

  confirmDelete(order: DeliveryOrder | null): void {
    this.selectedOrder = order;
    this.showDeleteConfirmation = true;
    this.showUpdateModal = false;
  }


  cancelDelete(): void {
    this.showDeleteConfirmation = false;
    this.selectedOrder = null;
  }

  deleteOrder(): void {
    if (!this.selectedOrder) return;

    this.isDeleting = true;

    this.adminService.deleteParcel(this.selectedOrder.id).subscribe({
      next: () => {
        // Remove the order from the orders array
        this.orders = this.orders.filter(order => order.id !== this.selectedOrder!.id);
        this.applyFilters(); // Refresh filtered orders

        this.isDeleting = false;
        this.showDeleteConfirmation = false;
        this.closeUpdateModal();

        // Show success message
        console.log('Order deleted successfully');
      },
      error: (error) => {
        this.isDeleting = false;
        this.error = error.message || 'Failed to delete order';
        console.error('Error deleting order:', error);
      }
    });
  }

  getWeightCategory(weight: number): string {
    if (weight <= 0.5) return 'Ultra Light Parcel';
    if (weight <= 2) return 'Light Parcel';
    if (weight <= 5) return 'Medium Parcel';
    if (weight <= 10) return 'Heavy Parcel';
    if (weight <= 20) return 'Extra Heavy Parcel';
    return 'Freight';
  }

  // Map backend weight category to display string
  getWeightCategoryDisplay(weightCategory: string): string {
    const categoryMap: { [key: string]: string } = {
      'ULTRA_LIGHT': 'Ultra Light Parcel',
      'LIGHT': 'Light Parcel',
      'MEDIUM': 'Medium Parcel',
      'HEAVY': 'Heavy Parcel',
      'EXTRA_HEAVY': 'Extra Heavy Parcel',
      'FREIGHT': 'Freight'
    };
    return categoryMap[weightCategory] || weightCategory;
  }

  getStatusClass(status: string): string {
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium';
    switch (status) {
      case 'DELIVERED':
        return `${baseClasses} bg-teal-100 text-teal-800`;
      case 'PICKED_UP':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'IN_TRANSIT':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'PENDING':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'CANCELLED':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  }

  // Map backend status to display string
  getStatusDisplay(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'Pending',
      'PICKED_UP': 'Picked Up',
      'IN_TRANSIT': 'In Transit',
      'DELIVERED': 'Delivered',
      'CANCELLED': 'Cancelled'
    };
    return statusMap[status] || status;
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
    this.onWeightCategoryChange(value);
  }

  applyFilters(): void {
    this.filteredOrders = this.orders.filter(order => {
      const matchesCategory = !this.selectedWeightCategory ||
        this.getWeightCategoryDisplay(order.weightCategory) === this.selectedWeightCategory;
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
    this.error = null;

    this.adminService.getAllParcels().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.applyFilters(); // Refresh filtered orders
        this.isRefreshing = false;
      },
      error: (error) => {
        this.error = error.message || 'Failed to refresh orders';
        this.isRefreshing = false;
        console.error('Error refreshing orders:', error);
      }
    });
  }

  // Bulk operations methods
  updateParcelStatus(parcelId: string, status: string): void {
    this.adminService.updateParcelStatus(parcelId, status).subscribe({
      next: (updatedOrder) => {
        const index = this.orders.findIndex(order => order.id === updatedOrder.id);
        if (index !== -1) {
          this.orders[index] = updatedOrder;
          this.applyFilters();
        }
        console.log('Status updated successfully');
      },
      error: (error) => {
        this.error = error.message || 'Failed to update status';
        console.error('Error updating status:', error);
      }
    });
  }

  // Load orders with server-side filtering
  loadOrdersWithFilters(): void {
    this.isLoading = true;
    this.error = null;

    const filters = {
      status: this.selectedStatus || undefined,
      page: this.currentPage,
      limit: this.itemsPerPage
    };

    this.adminService.getParcelsWithFilters(filters).subscribe({
      next: (response) => {
        this.orders = response.parcels;
        this.filteredOrders = [...this.orders];
        this.totalItems = response.total;
        this.currentPage = response.page;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.message || 'Failed to load orders';
        this.isLoading = false;
        console.error('Error loading orders with filters:', error);
      }
    });
  }

  protected readonly HTMLSelectElement = HTMLSelectElement;
}
