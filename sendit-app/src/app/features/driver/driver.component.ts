import {Component, OnInit, OnDestroy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {DriverStats, Parcel, TrackingEvent} from '../../shared/models/parcel-interface';
import {GoogleMapsService} from '../../shared/services/google-maps';
import {Subscription} from 'rxjs';
import {DriversService, LocationUtils} from '../../shared/services/drivers.service';
import {AuthService} from '../../shared/services/auth.service';

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
export class DriverComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  isLoggedIn: boolean = false;
  driverId: string = '';

  activeFilter: string = 'all';
  locationUpdate: string = '';
  isUpdating: boolean = false;
  isLocationLoading: boolean = false;
  currentDriverLocation: LocationData | null = null;
  private userSubscription!: Subscription;
  private subscriptions: Subscription[] = [];

  stats: DriverStats = {
    totalAssigned: 0,
    totalEarnings: 0,
    totalDeliveries: 0,
    inProgress: 0,
    completed: 0,
    rating: 4.8
  };

  filterTabs = [
    {key: 'all', label: 'All Parcels'},
    {key: 'assigned', label: 'Assigned'},
    {key: 'in_progress', label: 'In Progress'},
    {key: 'completed', label: 'Completed'}
  ];

  parcels: Parcel[] = [];

  constructor(
    private googleMapsService: GoogleMapsService,
    private driversService: DriversService,
    private router: Router,
    private authService: AuthService
  ) {}

  // Getter for filtered parcels based on activeFilter
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


  ngOnInit(): void {
    // Subscribe to user changes
    this.userSubscription = this.authService.user$.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = this.authService.isLoggedIn();
      this.driverId = user?.id || ''; // Set driverId from user.id
    });

    // Initialize current user state
    this.currentUser = this.authService.getCurrentUser();
    this.isLoggedIn = this.authService.isLoggedIn();
    this.driverId = this.currentUser?.id || ''; // Initialize driverId from currentUser

    // Existing initialization
    this.loadGoogleMaps();
    this.getCurrentLocation();
    this.loadAssignedParcels();
    this.subscribeToLocationUpdates();
    this.updateStats();
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  logout(): void {
    try {
      this.authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.currentUser = null;
      this.isLoggedIn = false;
      this.driverId = ''; // Reset driverId on logout
      this.router.navigate(['/home']);
    }
  }

  getUserDisplayName(): string {
    if (this.currentUser) {
      return this.currentUser.firstName && this.currentUser.lastName
        ? `${this.currentUser.firstName} ${this.currentUser.lastName}`
        : this.currentUser.username || this.currentUser.email || 'Driver';
    }
    return 'Driver';
  }

  private subscribeToLocationUpdates(): void {
    const locationSub = this.driversService.locationUpdate$.subscribe(update => {
      if (update && update.affectedParcels) {
        update.affectedParcels.forEach(affectedParcel => {
          const localParcel = this.parcels.find(p => p.id === affectedParcel.id);
          if (localParcel) {
            localParcel.status = affectedParcel.status;
            if (affectedParcel.action === 'delivered') {
              localParcel.currentLocation = this.currentDriverLocation || undefined;
            }
          }
        });
        this.updateStats();
        this.showSuccessMessage(`Updated ${update.affectedParcels.length} parcel(s) successfully`);
      }
    });
    this.subscriptions.push(locationSub);
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
    if (!this.driverId) {
      console.error('Driver ID is not set');
      return;
    }
    try {
      const driverLocation = await this.driversService.getDriverCurrentLocation(this.driverId).toPromise();
      if (driverLocation) {
        this.currentDriverLocation = {
          lat: driverLocation.latitude,
          lng: driverLocation.longitude,
          address: driverLocation.address
        };
      } else {
        await this.getBrowserLocation();
      }
    } catch (error) {
      console.error('Error getting current location from backend:', error);
      await this.getBrowserLocation();
    }
  }

  async getBrowserLocation(): Promise<void> {
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
        maximumAge: 300000
      });
    });
  }

  async reverseGeocodeCurrentLocation(): Promise<void> {
    if (!this.currentDriverLocation) {
      return;
    }

    try {
      const geocoder = new google.maps.Geocoder();
      const latlng = new google.maps.LatLng(
        this.currentDriverLocation.lat,
        this.currentDriverLocation.lng
      );

      const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode({ location: latlng }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results) {
            resolve(results);
          } else {
            reject(new Error(`Geocoding failed with status: ${status}`));
          }
        });
      });

      if (this.currentDriverLocation && results[0]) {
        this.currentDriverLocation.address = results[0].formatted_address;
      }
    } catch (error) {
      console.error('Error reverse geocoding current location:', error);
    }
  }

  async loadAssignedParcels(): Promise<void> {
    if (!this.driverId) {
      console.error('Driver ID is not set');
      this.parcels = [];
      return;
    }
    try {
      const backendParcels = await this.driversService.getDriverAssignedParcels(this.driverId).toPromise();
      if (backendParcels) {
        this.parcels = backendParcels.map(backendParcel =>
          this.driversService.transformParcelToFrontend(backendParcel)
        );
      } else {
        this.parcels = [];
      }
    } catch (error) {
      console.error('Error loading assigned parcels:', error);
      this.parcels = [];
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
      'CANCELLED': 'bg-red-100 text-red-800',
      'ARRIVED_AT_DESTINATION': 'bg-indigo-100 text-indigo-800'
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
      'CANCELLED': 'Cancelled',
      'ARRIVED_AT_DESTINATION': 'Arrived at Destination'
    };
    return labels[status as keyof typeof labels] || status;
  }

  async updateParcelStatus(parcelId: string, newStatus: string): Promise<void> {
    if (!this.driverId) {
      console.error('Driver ID is not set');
      return;
    }
    this.isUpdating = true;

    try {
      if (newStatus === 'PICKED_UP') {
        await this.driversService.notifyParcelPickup(
          this.driverId,
          parcelId,
          { pickupLocation: this.currentDriverLocation?.address }
        ).toPromise();
      } else if (newStatus === 'DELIVERED') {
        await this.driversService.confirmManualDelivery(
          this.driverId,
          parcelId,
          { deliveryLocation: this.currentDriverLocation?.address }
        ).toPromise();
      } else if (newStatus === 'ARRIVED_AT_DESTINATION') {
        await this.driversService.notifyReceiverForPickup(
          this.driverId,
          parcelId,
          { arrivalLocation: this.currentDriverLocation?.address }
        ).toPromise();
      } else {
        await this.driversService.updateParcelStatus(
          this.driverId,
          parcelId,
          newStatus,
          this.currentDriverLocation?.address
        ).toPromise();
      }

      const parcel = this.parcels.find(p => p.id === parcelId);
      if (parcel) {
        const oldStatus = parcel.status;
        parcel.status = newStatus;

        if (this.currentDriverLocation && newStatus !== 'DELIVERED') {
          parcel.currentLocation = { ...this.currentDriverLocation };
        }

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

  async updateLocation(parcelId: string): Promise<void> {
    if (!this.driverId) {
      console.error('Driver ID is not set');
      return;
    }
    if (!this.locationUpdate.trim()) {
      return;
    }

    this.isLocationLoading = true;

    try {
      const response = await this.driversService.updateParcelLocationWithAddress(
        this.driverId,
        parcelId,
        this.locationUpdate.trim()
      ).toPromise();

      if (response) {
        this.currentDriverLocation = {
          lat: response.latitude,
          lng: response.longitude,
          address: response.address
        };

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

  async updateLocationWithCurrentPosition(parcelId: string): Promise<void> {
    if (!this.driverId) {
      console.error('Driver ID is not set');
      return;
    }
    this.isLocationLoading = true;

    try {
      const response = await this.driversService.updateParcelLocationWithGPS(
        this.driverId,
        parcelId
      ).toPromise();

      if (response) {
        this.currentDriverLocation = {
          lat: response.latitude,
          lng: response.longitude,
          address: response.address
        };

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

    const distance = LocationUtils.calculateDistance(
      { lat: this.currentDriverLocation.lat, lng: this.currentDriverLocation.lng },
      { lat: parcel.destination.lat, lng: parcel.destination.lng }
    );

    return LocationUtils.formatDistance(distance);
  }

  showParcelDetails(parcel: Parcel): void {
    const distance = this.calculateDistance(parcel);
    const details = `
Parcel Details:

Tracking: ${parcel.trackingNumber}
Weight: ${parcel.weight}kg (${parcel.weightCategory})
Price: KSh ${parcel.price.toLocaleString()}
Status: ${this.getStatusLabel(parcel.status)}
Distance from you: ${distance}

Sender: ${parcel.senderName} (${parcel.senderPhone})
Pickup: ${parcel.pickupLocation?.name || 'N/A'}

Recipient: ${parcel.receiverName} (${parcel.receiverPhone})
Destination: ${parcel.destination.name}

Current Location: ${parcel.currentLocation?.address || 'Not updated'}
    `;

    alert(details);
  }

  openMapDirections(parcel: Parcel): void {
    const currentLat = this.currentDriverLocation?.lat || parcel.currentLocation?.lat || parcel.pickupLocation?.lat;
    const currentLng = this.currentDriverLocation?.lng || parcel.currentLocation?.lng || parcel.pickupLocation?.lng;

    if (!currentLat || !currentLng) {
      alert('Unable to get current location for directions');
      return;
    }

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

  private showSuccessMessage(message: string): void {
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
      rating: 4.8,
      totalDeliveries: totalDeliveries
    };
  }

  async refreshParcels(): Promise<void> {
    await this.loadAssignedParcels();
    this.updateStats();
  }

  async refreshLocation(): Promise<void> {
    await this.getCurrentLocation();
  }

  canUpdateStatus(parcel: Parcel, newStatus: string): boolean {
    const currentStatus = parcel.status;

    const allowedTransitions: { [key: string]: string[] } = {
      'ASSIGNED': ['PICKED_UP', 'CANCELLED'],
      'PICKED_UP': ['IN_TRANSIT', 'CANCELLED'],
      'IN_TRANSIT': ['OUT_FOR_DELIVERY', 'ARRIVED_AT_DESTINATION', 'CANCELLED'],
      'OUT_FOR_DELIVERY': ['DELIVERED', 'ARRIVED_AT_DESTINATION', 'CANCELLED'],
      'ARRIVED_AT_DESTINATION': ['DELIVERED', 'OUT_FOR_DELIVERY', 'CANCELLED'],
      'DELIVERED': ['COMPLETED'],
      'COMPLETED': [],
      'CANCELLED': []
    };

    return allowedTransitions[currentStatus]?.includes(newStatus) || false;
  }

  getAvailableStatusTransitions(parcel: Parcel): Array<{ value: string, label: string }> {
    const currentStatus = parcel.status;

    const statusOptions = [
      { value: 'PICKED_UP', label: 'Mark as Picked Up' },
      { value: 'IN_TRANSIT', label: 'Mark as In Transit' },
      { value: 'OUT_FOR_DELIVERY', label: 'Mark as Out for Delivery' },
      { value: 'ARRIVED_AT_DESTINATION', label: 'Mark as Arrived' },
      { value: 'DELIVERED', label: 'Mark as Delivered' },
      { value: 'COMPLETED', label: 'Mark as Completed' },
      { value: 'CANCELLED', label: 'Cancel Delivery' }
    ];

    return statusOptions.filter(option => this.canUpdateStatus(parcel, option.value));
  }

  async handleBulkLocationUpdate(): Promise<void> {
    if (!this.driverId) {
      console.error('Driver ID is not set');
      return;
    }
    if (!this.currentDriverLocation) {
      await this.getCurrentLocation();
    }

    if (!this.currentDriverLocation) {
      alert('Unable to get current location. Please ensure location services are enabled.');
      return;
    }

    this.isLocationLoading = true;

    try {
      const inTransitParcels = this.parcels.filter(p =>
        ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(p.status)
      );

      if (inTransitParcels.length === 0) {
        alert('No parcels available for location update.');
        return;
      }

      const response = await this.driversService.updateDriverLocation(this.driverId, {
        latitude: this.currentDriverLocation.lat,
        longitude: this.currentDriverLocation.lng,
        address: this.currentDriverLocation.address
      }).toPromise();

      if (response) {
        this.showSuccessMessage(
          `Location updated for ${response.affectedParcels.length} parcel(s). ` +
          `${response.affectedParcels.filter(p => p.action === 'delivered').length} parcel(s) were automatically delivered.`
        );
      }
    } catch (error) {
      console.error('Error updating bulk location:', error);
      alert('Failed to update location for all parcels. Please try again.');
    } finally {
      this.isLocationLoading = false;
    }
  }

  getParcelStatusColor(status: string): string {
    const colors = {
      'PENDING': '#6B7280',
      'ASSIGNED': '#3B82F6',
      'PICKED_UP': '#F59E0B',
      'IN_TRANSIT': '#F97316',
      'OUT_FOR_DELIVERY': '#8B5CF6',
      'ARRIVED_AT_DESTINATION': '#6366F1',
      'DELIVERED': '#10B981',
      'COMPLETED': '#059669',
      'CANCELLED': '#EF4444'
    };
    return colors[status as keyof typeof colors] || '#6B7280';
  }

  trackParcel(trackingNumber: string): void {
    const trackingUrl = `/track/${trackingNumber}`;
    window.open(trackingUrl, '_blank');
  }

  callRecipient(parcel: Parcel): void {
    if (parcel.receiverPhone) {
      window.open(`tel:${parcel.receiverPhone}`, '_self');
    }
  }

  callSender(parcel: Parcel): void {
    if (parcel.senderPhone) {
      window.open(`tel:${parcel.senderPhone}`, '_self');
    }
  }
}
