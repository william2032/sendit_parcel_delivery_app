import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {DriverStats, Parcel, TrackingEvent} from '../../shared/models/parcel-interface';
import {GoogleMapsService} from '../../shared/services/google-maps';

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

@Component({
  selector: 'app-driver',
  imports: [CommonModule, FormsModule],
  templateUrl: './driver.component.html',
  styleUrl: './driver.component.scss'
})

export class DriverComponent implements OnInit {
  driverName = 'John Doe';
  driverId = 'driver_123';
  activeFilter: string = 'all';
  locationUpdate: string = '';
  isUpdating: boolean = false;
  isLocationLoading: boolean = false;
  currentDriverLocation: LocationData | null = null;

  stats: DriverStats = {
    totalAssigned: 8,
    totalEarnings: 32050,
    totalDeliveries: 42,
    inProgress: 3,
    completed: 5,
    rating: 4.8
  };

  filterTabs = [
    { key: 'all', label: 'All Parcels' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' }
  ];

  parcels: Parcel[] = [
    {
      id: '1',
      trackingNumber: 'SIT240923001',
      address: 'Chuka Town Center, Main Street',
      date: '2024-09-23',
      status: 'ASSIGNED',
      createdAt: '2024-09-23T14:00:00Z',
      pickupLocation: {
        lat: -0.0917,
        lng: 34.7680,
        name: 'Uyo Business Center',
        address: '342 Oron road, Uyo'
      },
      destination: {
        lat: -0.3900,
        lng: 37.6530,
        name: 'Chuka Town Center',
        address: 'Chuka Town Center, Main Street'
      },
      senderId: 'sender-001',
      senderName: 'Jacob Marcus',
      senderPhone: '+254700123456',
      senderEmail: 'jacob@example.com',
      receiverId: 'receiver-001',
      receiverName: 'Mary Johnson',
      receiverPhone: '+254700654321',
      receiverEmail: 'mary@example.com',
      driverId: 'driver-001',
      deliveryTime: '16:00',
      estimatedDeliveryDate: '2024-09-24T16:00:00Z',
      weight: 2.5,
      weightCategory: 'LIGHT',
      price: 850,
      notificationsSent: {
        customerPickup: false,
        customerDelivery: false,
        recipientDelivery: false,
        driverAssignment: true
      },
      trackingEvents: [
        {
          id: 'evt1',
          parcelId: '1',
          type: 'ORDER_CREATED',
          status: 'Order Created',
          location: 'Uyo Business Center',
          timestamp: '2024-09-23T14:00:00Z',
          description: 'Parcel order created and payment confirmed',
          automated: true
        },
        {
          id: 'evt2',
          parcelId: '1',
          type: 'DRIVER_ASSIGNED',
          status: 'Driver Assigned',
          location: 'Uyo Business Center',
          timestamp: '2024-09-23T14:15:00Z',
          description: 'Driver John Doe assigned to this delivery',
          automated: true
        }
      ]
    },
    {
      id: '2',
      trackingNumber: 'SIT240923002',
      address: 'Chuka University, Main Campus',
      date: '2024-09-23',
      status: 'IN_TRANSIT',
      createdAt: '2024-09-23T13:30:00Z',
      pickupLocation: {
        lat: -1.2921,
        lng: 36.8219,
        name: 'Nairobi CBD',
        address: 'University Way, Nairobi CBD'
      },
      destination: {
        lat: -0.3900,
        lng: 37.6530,
        name: 'Chuka University',
        address: 'Chuka University, Main Campus'
      },
      currentLocation: {
        lat: -0.6000,
        lng: 37.2000,
        address: 'Embu Junction'
      },
      senderId: 'sender-002',
      senderName: 'Alice Smith',
      senderPhone: '+254700789012',
      senderEmail: 'alice@example.com',
      receiverId: 'receiver-002',
      receiverName: 'Bob Wilson',
      receiverPhone: '+254700345678',
      receiverEmail: 'bob@example.com',
      driverId: 'driver-002',
      deliveryTime: '18:00',
      estimatedDeliveryDate: '2024-09-23T18:00:00Z',
      weight: 1.2,
      weightCategory: 'ULTRA_LIGHT',
      price: 650,
      notificationsSent: {
        customerPickup: true,
        customerDelivery: false,
        recipientDelivery: false,
        driverAssignment: true
      },
      trackingEvents: [
        {
          id: 'evt3',
          parcelId: '2',
          type: 'ORDER_CREATED',
          status: 'Order Created',
          location: 'Nairobi CBD',
          timestamp: '2024-09-23T13:30:00Z',
          description: 'Parcel order created and payment confirmed',
          automated: true
        },
        {
          id: 'evt4',
          parcelId: '2',
          type: 'PICKED_UP',
          status: 'Picked Up',
          location: 'Nairobi CBD',
          timestamp: '2024-09-23T14:00:00Z',
          description: 'Package picked up from sender',
          automated: false,
          notes: 'Customer provided package in excellent condition'
        },
        {
          id: 'evt5',
          parcelId: '2',
          type: 'LOCATION_UPDATE',
          status: 'In Transit',
          location: 'Thika Road',
          timestamp: '2024-09-23T15:30:00Z',
          description: 'Package in transit - Thika Road',
          automated: false
        },
        {
          id: 'evt6',
          parcelId: '2',
          type: 'LOCATION_UPDATE',
          status: 'In Transit',
          location: 'Embu Junction',
          timestamp: '2024-09-23T16:45:00Z',
          description: 'Package in transit - Embu Junction',
          automated: false
        }
      ]
    },
    {
      id: '3',
      trackingNumber: 'SIT240922001',
      address: 'Chuka Market, Vendor Section B',
      date: '2024-09-22',
      status: 'DELIVERED',
      createdAt: '2024-09-22T11:00:00Z',
      pickupLocation: {
        lat: 0.0500,
        lng: 37.6500,
        name: 'Meru Town',
        address: 'Meru Town, Commercial Street'
      },
      destination: {
        lat: -0.3900,
        lng: 37.6530,
        name: 'Chuka Market',
        address: 'Chuka Market, Vendor Section B'
      },
      currentLocation: {
        lat: -0.3900,
        lng: 37.6530,
        address: 'Chuka Market'
      },
      senderId: 'sender-003',
      senderName: 'David Brown',
      senderPhone: '+254700456789',
      senderEmail: 'david@example.com',
      receiverId: 'receiver-003',
      receiverName: 'Sarah Davis',
      receiverPhone: '+254700987654',
      receiverEmail: 'sarah@example.com',
      driverId: 'driver-003',
      deliveryTime: '16:30',
      estimatedDeliveryDate: '2024-09-22T17:00:00Z',
      weight: 3.8,
      weightCategory: 'MEDIUM',
      price: 950,
      notificationsSent: {
        customerPickup: true,
        customerDelivery: true,
        recipientDelivery: true,
        driverAssignment: true
      },
      trackingEvents: [
        {
          id: 'evt7',
          parcelId: '3',
          type: 'ORDER_CREATED',
          status: 'Order Created',
          location: 'Meru Town',
          timestamp: '2024-09-22T11:00:00Z',
          description: 'Parcel order created and payment confirmed',
          automated: true
        },
        {
          id: 'evt8',
          parcelId: '3',
          type: 'PICKED_UP',
          status: 'Picked Up',
          location: 'Meru Town',
          timestamp: '2024-09-22T11:30:00Z',
          description: 'Package picked up from sender',
          automated: false
        },
        {
          id: 'evt9',
          parcelId: '3',
          type: 'LOCATION_UPDATE',
          status: 'In Transit',
          location: 'Chogoria',
          timestamp: '2024-09-22T14:00:00Z',
          description: 'Package in transit - Chogoria',
          automated: false
        },
        {
          id: 'evt10',
          parcelId: '3',
          type: 'DELIVERED',
          status: 'Delivered',
          location: 'Chuka Market',
          timestamp: '2024-09-22T16:30:00Z',
          description: 'Package successfully delivered to recipient',
          automated: false,
          notes: 'Delivered to Sarah Davis. Package in perfect condition. Signature obtained.'
        }
      ]
    }
  ];

  constructor(private googleMapsService: GoogleMapsService) {}

  get filteredParcels(): Parcel[] {
    if (this.activeFilter === 'all') {
      return this.parcels;
    } else if (this.activeFilter === 'in_progress') {
      return this.parcels.filter(parcel =>
        ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(parcel.status)
      );
    } else if (this.activeFilter === 'completed') {
      return this.parcels.filter(parcel =>
        ['DELIVERED', 'COMPLETED'].includes(parcel.status)
      );
    }
    return this.parcels.filter(parcel => parcel.status === this.activeFilter.toUpperCase());
  }

  async ngOnInit() {
    this.updateStats();
    await this.loadGoogleMaps();
    await this.getCurrentLocation();
    // In a real app, you would load parcels from a service
    // this.loadAssignedParcels();
  }

  async loadGoogleMaps(): Promise<void> {
    try {
      await this.googleMapsService.loadGoogleMaps();
      console.log('Google Maps loaded successfully');
    } catch (error) {
      console.error('Failed to load Google Maps:', error);
    }
  }

  async getCurrentLocation(): Promise<void> {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser.');
      return;
    }

    try {
      const position = await this.getGeolocationPosition();
      this.currentDriverLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        address: 'Current Location'
      };

      // Optionally reverse geocode to get address
      await this.reverseGeocodeCurrentLocation();
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  }

  private getGeolocationPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      });
    });
  }

  private async reverseGeocodeCurrentLocation(): Promise<void> {
    if (!this.currentDriverLocation) return;

    try {
      const geocoder = new google.maps.Geocoder();
      const latlng = new google.maps.LatLng(
        this.currentDriverLocation.lat,
        this.currentDriverLocation.lng
      );

      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          if (this.currentDriverLocation) {
            this.currentDriverLocation.address = results[0].formatted_address;
          }
        }
      });
    } catch (error) {
      console.error('Error reverse geocoding current location:', error);
    }
  }

  getParcelCount(filter: string): number {
    if (filter === 'all') {
      return this.parcels.length;
    } else if (filter === 'in_progress') {
      return this.parcels.filter(parcel =>
        ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(parcel.status)
      ).length;
    } else if (filter === 'completed') {
      return this.parcels.filter(parcel =>
        ['DELIVERED', 'COMPLETED'].includes(parcel.status)
      ).length;
    }
    return this.parcels.filter(parcel => parcel.status === filter.toUpperCase()).length;
  }

  getStatusClass(status: string): string {
    const classes = {
      'PENDING': 'bg-gray-100 text-gray-800',
      'ASSIGNED': 'bg-blue-100 text-blue-800',
      'PICKED_UP': 'bg-yellow-100 text-yellow-800',
      'IN_TRANSIT': 'bg-orange-100 text-orange-800',
      'OUT_FOR_DELIVERY': 'bg-purple-100 text-purple-800',
      'DELIVERED': 'bg-green-100 text-green-800',
      'COMPLETED': 'bg-emerald-100 text-emerald-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: string): string {
    const labels = {
      'PENDING': 'Pending',
      'ASSIGNED': 'Assigned',
      'PICKED_UP': 'Picked Up',
      'IN_TRANSIT': 'In Transit',
      'OUT_FOR_DELIVERY': 'Out for Delivery',
      'DELIVERED': 'Delivered',
      'COMPLETED': 'Completed',
      'CANCELLED': 'Cancelled'
    };
    return labels[status as keyof typeof labels] || status;
  }

  async updateParcelStatus(parcelId: string, newStatus: string) {
    this.isUpdating = true;

    try {
      // In a real app, this would call your backend service
      // await this.driverService.updateParcelStatus(parcelId, newStatus);

      // Update local state for demo
      const parcel = this.parcels.find(p => p.id === parcelId);
      if (parcel) {
        const oldStatus = parcel.status;
        parcel.status = newStatus;

        // Update current location to driver's current location if available
        if (this.currentDriverLocation && newStatus !== 'DELIVERED') {
          parcel.currentLocation = { ...this.currentDriverLocation };
        }

        // Add tracking event
        const newEvent: TrackingEvent = {
          id: `evt_${Date.now()}`,
          parcelId: parcelId,
          type: this.getTrackingEventType(newStatus),
          status: this.getStatusLabel(newStatus),
          location: this.currentDriverLocation?.address || parcel.currentLocation?.address || 'Current location',
          timestamp: new Date().toISOString(),
          description: `Package ${newStatus.toLowerCase().replace('_', ' ')} by driver`,
          automated: false,
          notes: `Status updated from ${this.getStatusLabel(oldStatus)} to ${this.getStatusLabel(newStatus)}`
        };

        parcel.trackingEvents.push(newEvent);

        // Show success message
        this.showSuccessMessage(`Order ${parcel.trackingNumber} has been marked as ${this.getStatusLabel(newStatus)}. Automatic notifications have been sent to relevant parties.`);
      }

      this.updateStats();
    } catch (error) {
      console.error('Error updating parcel status:', error);
      alert('Failed to update parcel status. Please try again.');
    } finally {
      this.isUpdating = false;
    }
  }

  async updateLocation(parcelId: string) {
    if (!this.locationUpdate.trim()) return;

    this.isLocationLoading = true;

    try {
      // Geocode the address to get coordinates
      const geocodeResult = await this.googleMapsService.geocodeAddress(this.locationUpdate.trim());

      const locationData: LocationData = {
        lat: geocodeResult.geometry.location.lat(),
        lng: geocodeResult.geometry.location.lng(),
        address: geocodeResult.formatted_address
      };

      // In a real app, this would call your backend service
      // await this.driverService.updateCurrentLocation(parcelId, locationData);

      // Update local state for demo
      const parcel = this.parcels.find(p => p.id === parcelId);
      if (parcel) {
        // Update current location with geocoded coordinates
        parcel.currentLocation = locationData;

        // Add tracking event
        const newEvent: TrackingEvent = {
          id: `evt_${Date.now()}`,
          parcelId: parcelId,
          type: 'LOCATION_UPDATE',
          status: 'Location Updated',
          location: locationData.address,
          timestamp: new Date().toISOString(),
          description: `Driver updated current location: ${locationData.address}`,
          automated: false
        };

        parcel.trackingEvents.push(newEvent);

        this.showSuccessMessage('Location updated successfully! Customers have been notified of the current location.');
        this.locationUpdate = '';
      }
    } catch (error) {
      console.error('Error updating location:', error);
      alert('Failed to geocode and update location. Please check the address and try again.');
    } finally {
      this.isLocationLoading = false;
    }
  }

  async updateLocationWithCurrentPosition(parcelId: string) {
    if (!this.currentDriverLocation) {
      await this.getCurrentLocation();
    }

    if (!this.currentDriverLocation) {
      alert('Unable to get current location. Please ensure location services are enabled.');
      return;
    }

    this.isLocationLoading = true;

    try {
      // In a real app, this would call your backend service
      // await this.driverService.updateCurrentLocation(parcelId, this.currentDriverLocation);

      // Update local state for demo
      const parcel = this.parcels.find(p => p.id === parcelId);
      if (parcel) {
        parcel.currentLocation = { ...this.currentDriverLocation };

        // Add tracking event
        const newEvent: TrackingEvent = {
          id: `evt_${Date.now()}`,
          parcelId: parcelId,
          type: 'LOCATION_UPDATE',
          status: 'Location Updated',
          location: this.currentDriverLocation.address,
          timestamp: new Date().toISOString(),
          description: `Driver updated location using GPS: ${this.currentDriverLocation.address}`,
          automated: false
        };

        parcel.trackingEvents.push(newEvent);

        this.showSuccessMessage('Location updated with your current GPS position! Customers have been notified.');
      }
    } catch (error) {
      console.error('Error updating location with GPS:', error);
      alert('Failed to update location with GPS. Please try again.');
    } finally {
      this.isLocationLoading = false;
    }
  }

  calculateDistance(parcel: Parcel): string {
    if (!this.currentDriverLocation || !parcel.destination) {
      return 'Unknown';
    }

    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(parcel.destination.lat - this.currentDriverLocation.lat);
    const dLon = this.toRadians(parcel.destination.lng - this.currentDriverLocation.lng);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(this.currentDriverLocation.lat)) *
      Math.cos(this.toRadians(parcel.destination.lat)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return distance < 1 ?
      `${Math.round(distance * 1000)}m` :
      `${distance.toFixed(1)}km`;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  showParcelDetails(parcel: Parcel) {
    const distance = this.calculateDistance(parcel);
    const details = `
Parcel Details:

Tracking: ${parcel.trackingNumber}
Weight: ${parcel.weight}kg (${parcel.weightCategory})
Price: KSh ${parcel.price.toLocaleString()}
Status: ${this.getStatusLabel(parcel.status)}
Distance from you: ${distance}

Sender: ${parcel.senderName} (${parcel.senderPhone})
Pickup: ${parcel.pickupLocation.name}

Recipient: ${parcel.receiverName} (${parcel.receiverPhone})
Destination: ${parcel.destination.name}

Current Location: ${parcel.currentLocation?.address || 'Not updated'}
    `;

    alert(details);
  }

  openMapDirections(parcel: Parcel) {
    // Get current location if available, otherwise use pickup location
    const currentLat = this.currentDriverLocation?.lat || parcel.currentLocation?.lat || parcel.pickupLocation.lat;
    const currentLng = this.currentDriverLocation?.lng || parcel.currentLocation?.lng || parcel.pickupLocation.lng;

    // Open Google Maps with directions to destination
    const mapsUrl = `https://www.google.com/maps/dir/${currentLat},${currentLng}/${parcel.destination.lat},${parcel.destination.lng}`;
    window.open(mapsUrl, '_blank');
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private getTrackingEventType(status: string): 'ORDER_CREATED' | 'DRIVER_ASSIGNED' | 'PICKED_UP' | 'LOCATION_UPDATE' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'EXCEPTION' {
    const mapping: Record<string, 'ORDER_CREATED' | 'DRIVER_ASSIGNED' | 'PICKED_UP' | 'LOCATION_UPDATE' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'EXCEPTION'> = {
      'ASSIGNED': 'DRIVER_ASSIGNED',
      'PICKED_UP': 'PICKED_UP',
      'IN_TRANSIT': 'LOCATION_UPDATE',
      'OUT_FOR_DELIVERY': 'OUT_FOR_DELIVERY',
      'DELIVERED': 'DELIVERED',
      'COMPLETED': 'COMPLETED',
      'CANCELLED': 'CANCELLED'
    };
    return mapping[status] || 'LOCATION_UPDATE';
  }

  private showSuccessMessage(message: string) {
    // In a real app, you might use a toast notification service
    alert(message);
  }

  private updateStats(): void {
    const assigned = this.parcels.filter(p => p.status === 'ASSIGNED');
    const inProgress = this.parcels.filter(p =>
      ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(p.status)
    );
    const completed = this.parcels.filter(p =>
      ['DELIVERED', 'COMPLETED'].includes(p.status)
    );

    const totalEarnings = completed.reduce((sum, p) => sum + (p.price || 0), 0);
    const totalDeliveries = completed.length;

    this.stats = {
      totalAssigned: assigned.length,
      inProgress: inProgress.length,
      completed: completed.length,
      totalEarnings: totalEarnings,
      rating: 4.8, // Ideally from backend rating service
      totalDeliveries: totalDeliveries
    };
  }
}
