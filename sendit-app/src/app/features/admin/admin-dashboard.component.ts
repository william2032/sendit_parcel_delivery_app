import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {Subject, takeUntil, debounceTime, distinctUntilChanged, firstValueFrom} from 'rxjs';
import {
  AdminDashboardStats,
  AdminParcelResponse,
  SearchFilters
} from "../../shared/models/admin-dashboard.interface";
import { AdminService } from '../../shared/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<SearchFilters>();

  dashboardStats: AdminDashboardStats = {
    activeUsers: 0,
    totalParcels: 0,
    pendingParcels: 0,
    inTransitParcels: 0,
    deliveredToday: 0,
    totalRevenue: 0,
    activeDrivers: 0,
    recentOrders: []
  };

  searchFilters: SearchFilters = {
    customer: '',
    trackingNumber: '',
    pickupLocation: '',
    destination: ''
  };

  allOrders: AdminParcelResponse[] = [];
  filteredOrders: AdminParcelResponse[] = [];
  paginatedOrders: AdminParcelResponse[] = [];

  // Pagination properties
  currentPage = 1;
  totalPages = 1;
  pageSize = 10;
  totalEntries = 0;

  // Loading and error states
  isLoading = false;
  errorMessage: string | null = null;

  constructor(private adminService: AdminService) {
    // Setup debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.filterOrders();
    });
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load dashboard statistics and orders
   */
  async loadDashboardData(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;

    try {
      const stats = await firstValueFrom(this.adminService.getDashboardStats());

      if (stats) {
        this.dashboardStats = stats;
        this.allOrders = stats.recentOrders || [];
        this.filteredOrders = [...this.allOrders];
        this.updatePagination();
      }
    } catch (error) {
      this.errorMessage = 'Failed to load dashboard data. Please try again later.';
      console.error('Error loading dashboard stats:', error);

      // Fallback to empty state
      this.allOrders = [];
      this.filteredOrders = [];
      this.updatePagination();
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Handle search input changes with debouncing
   */
  onSearchChange(): void {
    this.searchSubject.next({ ...this.searchFilters });
  }

  /**
   * Filter orders based on search criteria
   */
  private filterOrders(): void {
    if (!this.allOrders.length) {
      this.filteredOrders = [];
      this.updatePagination();
      return;
    }

    const filters = this.searchFilters;

    this.filteredOrders = this.allOrders.filter(order => {
      const matchesSender = !filters.customer ||
        order.sender?.name?.toLowerCase().includes(filters.customer.toLowerCase()) ||
        order.receiverName?.toLowerCase().includes(filters.customer.toLowerCase());

      const matchesTrackingNumber = !filters.trackingNumber ||
        order.trackingNumber?.toLowerCase().includes(filters.trackingNumber.toLowerCase());

      const matchesPickupLocation = !filters.pickupLocation ||
        order.pickupLocation?.name?.toLowerCase().includes(filters.pickupLocation.toLowerCase()) ||
        order.pickupLocation?.address?.toLowerCase().includes(filters.pickupLocation.toLowerCase());

      const matchesDestination = !filters.destination ||
        order.destination?.name?.toLowerCase().includes(filters.destination.toLowerCase()) ||
        order.destination?.address?.toLowerCase().includes(filters.destination.toLowerCase());

      return matchesSender && matchesTrackingNumber && matchesPickupLocation && matchesDestination;
    });

    this.currentPage = 1; // Reset to first page after filtering
    this.updatePagination();
  }

  /**
   * Update pagination calculations and get current page data
   */
  private updatePagination(): void {
    this.totalEntries = this.filteredOrders.length;
    this.totalPages = Math.max(1, Math.ceil(this.totalEntries / this.pageSize));

    // Ensure current page is within bounds
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    this.updatePaginatedOrders();
  }

  /**
   * Get orders for current page
   */
  private updatePaginatedOrders(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedOrders = this.filteredOrders.slice(startIndex, endIndex);
  }

  /**
   * Navigate to previous page
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedOrders();
    }
  }

  /**
   * Navigate to next page
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedOrders();
    }
  }

  /**
   * Navigate to specific page
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.updatePaginatedOrders();
    }
  }

  /**
   * Clear all search filters
   */
  clearFilters(): void {
    this.searchFilters = {
      customer: '',
      trackingNumber: '',
      pickupLocation: '',
      destination: ''
    };
    this.filterOrders();
  }

  /**
   * Refresh dashboard data
   */
  refreshData(): void {
    this.loadDashboardData();
  }

  /**
   * Get pagination display text
   */
  getPaginationText(): string {
    if (this.totalEntries === 0) {
      return 'No entries found';
    }

    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalEntries);

    return `Showing ${start}-${end} of ${this.totalEntries} entries`;
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByOrderId(index: number, order: AdminParcelResponse): string {
    return order.trackingNumber || index.toString();
  }
}
