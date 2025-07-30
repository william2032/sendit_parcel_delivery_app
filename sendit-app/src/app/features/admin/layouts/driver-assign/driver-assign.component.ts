import { Component, OnInit } from '@angular/core';
import {AdminService} from '../../../../shared/services/admin.service';
import {NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-driver-assign',
  templateUrl: './driver-assign.component.html',
  imports: [
    NgForOf,
    NgIf
  ],
  styleUrls: ['./driver-assign.component.scss']
})
export class DriverAssignComponent implements OnInit {
  parcels: any[] = [];
  availableDrivers: any[] = [];
  filteredParcels: any[] = [];
  loading = false;
  error: string | null = null;
  activeTab = 'unassigned';
  allParcelsCount = 0;
  unassignedCount = 0;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.refreshParcels();
    this.loadAvailableDrivers();
  }

  refreshParcels(): void {
    this.loading = true;
    this.error = null;
    this.adminService.getAllParcels().subscribe(
      (data) => {
        this.parcels = data;
        this.allParcelsCount = data.length;
        this.unassignedCount = data.filter(p => p.status === 'PENDING').length;
        this.filterParcels();
        this.loading = false;
      },
      (err) => {
        this.error = 'Failed to load parcels';
        this.loading = false;
      }
    );
  }

  loadAvailableDrivers(): void {
    this.adminService.getAvailableDrivers().subscribe(
      (data) => {
        this.availableDrivers = data;
      },
      (err) => {
        this.error = 'Failed to load available drivers';
      }
    );
  }

  assignDriver(parcelId: string, target: EventTarget | null): void {
    const driverId = (target as HTMLSelectElement)?.value;
    if (!driverId || driverId === '') return;
    this.loading = true;
    this.error = null;
    this.adminService.assignDriver(parcelId, driverId).subscribe(
      () => {
        this.refreshParcels();
      },
      (err) => {
        this.error = 'Failed to assign driver';
        this.loading = false;
      }
    );
  }

  onTabChange(tab: string): void {
    this.activeTab = tab;
    this.filterParcels();
  }

  filterParcels(): void {
    if (this.activeTab === 'unassigned') {
      this.filteredParcels = this.parcels.filter(p =>
        p.status === 'PENDING' ||
        p.status === 'unassigned' ||
        p.status === 'Unassigned' ||
        !p.assignedDriver ||
        false
      );
    } else {
      this.filteredParcels = [...this.parcels];
    }
  }
  // Helper method to check if parcel is unassigned
  isUnassigned(parcel: any): boolean {
    return parcel.status === 'PENDING' && !parcel.assignedDriver;
  }


  // Helper method to get status display text
  getStatusDisplay(parcel: any): string {
    if (this.isUnassigned(parcel)) {
      return 'Unassigned';
    }
    return parcel.status || 'Unknown';
  }


  // Helper method to get status class
  getStatusClass(parcel: any): string {
    if (this.isUnassigned(parcel)) {
      return 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800';
    }

    switch (parcel.status?.toLowerCase()) {
      case 'ASSIGNED':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800';
      case 'in_transit':
      case 'in transit':
        return 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800';
      case 'assigned':
        return 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800';
      default:
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800';
    }
  }

  clearError(): void {
    this.error = null;
  }
}
