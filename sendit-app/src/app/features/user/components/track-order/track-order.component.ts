import {Component, ElementRef, OnInit, ViewChild, OnDestroy, ChangeDetectorRef} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {DecimalPipe, NgFor, NgIf} from '@angular/common';
import {GoogleMapsService} from '../../../../shared/services/google-maps';
import {Parcel} from '../../../../shared/models/parcel-interface';
import {ParcelService} from '../../../../shared/services/parcel.service';
import {
  ParcelDetailsModalComponent
} from "../../../../shared/components/parcel-details-modal/parcel-details-modal.component";
import {HeaderComponent} from "../shared/header/header.component";
import {FooterComponent} from "../shared/footer/footer.component";
import {Subject, takeUntil, debounceTime, distinctUntilChanged, firstValueFrom, of} from 'rxjs';
import {AuthService} from '../../../../shared/services/auth.service';
import {catchError} from 'rxjs/operators';

declare var google: any;

@Component({
  selector: 'app-track-order',
  standalone: true,
  templateUrl: './track-order.component.html',
  imports: [FormsModule, NgFor, NgIf, ParcelDetailsModalComponent, HeaderComponent, FooterComponent, DecimalPipe],
  styleUrls: ['./track-order.component.scss'],
})
export class TrackOrderComponent implements OnInit, OnDestroy {
  @ViewChild('mapSection') mapSection!: ElementRef;

  activeTab: string = 'sent';
  activeFilter: string = 'all';
  searchQuery: string = '';
  map: any;
  directionsService: any;
  directionsRenderer: any;
  currentMarkers: any[] = [];
  currentPolyline: any;
  selectedParcel: Parcel | null = null;
  showModal: boolean = false;
  modalParcel: Parcel | null = null;
  sentParcels: Parcel[] = [];
  receivedParcels: Parcel[] = [];
  isLoading: boolean = false;
  error: string | null = null;
  currentPage: number = 1;
  pageSize: number = 10;
  totalParcels: number = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private googleMapsService: GoogleMapsService,
    private parcelService: ParcelService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    try {
      await this.googleMapsService.loadGoogleMaps();
      this.initMap();
      await this.loadParcelsData();
      const currentParcels = this.getCurrentParcels();
      if (currentParcels.length > 0) {
        this.showParcelRoute(currentParcels[0]);
      }
      this.subscribeToServiceStates();
    } catch (error) {
      console.error('Error initializing component:', error);
      this.error = 'Failed to initialize tracking system';
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToServiceStates() {
    this.parcelService.loading$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.isLoading = loading;
      this.cdr.detectChanges();
    });

    this.parcelService.error$.pipe(takeUntil(this.destroy$)).subscribe(error => {
      this.error = error;
      this.cdr.detectChanges();
    });
  }

  private async loadParcelsData() {
    try {
      this.isLoading = true;
      const userId = this.authService.getCurrentUser()?.id || localStorage.getItem('userId');
      console.log('User ID:', userId);
      if (!userId) {
        throw new Error('User is not logged in or userId is missing');
      }

      const [sentResponse, receivedResponse] = await Promise.all([
        firstValueFrom(
          this.parcelService.getSentParcels({
            page: this.currentPage,
            limit: this.pageSize,
            userId,
          }).pipe(
            catchError(error => {
              console.error('Error in getSentParcels:', error);
              return of(null);
            })
          )
        ),
        firstValueFrom(
          this.parcelService.getReceivedParcels({
            page: this.currentPage,
            limit: this.pageSize,
            userId,
          }).pipe(
            catchError(error => {
              console.error('Error in getReceivedParcels:', error);
              return of(null);
            })
          )
        ),
      ]);

      console.log('Sent Response:', sentResponse);
      console.log('Received Response:', receivedResponse);

      if (sentResponse) {
        this.sentParcels = [...(sentResponse.data || [])];
        this.totalParcels = sentResponse.total || 0;
      } else {
        this.sentParcels = [];
        this.totalParcels = 0;
      }

      if (receivedResponse) {
        this.receivedParcels = [...(receivedResponse.data || [])];
        if (this.activeTab === 'received') {
          this.totalParcels = receivedResponse.total || 0;
        }
      } else {
        this.receivedParcels = [];
      }

      console.log('Sent Parcels:', this.sentParcels);
      console.log('Received Parcels:', this.receivedParcels);
      console.log('Total Parcels:', this.totalParcels);

      this.isLoading = false;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading parcels:', error);
      this.error = 'Failed to load parcels data';
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async setActiveTab(tab: string) {
    this.activeTab = tab;
    this.activeFilter = 'all';
    this.currentPage = 1;
    await this.loadTabData();
    const parcels = this.getCurrentParcels();
    if (parcels.length > 0) {
      this.showParcelRoute(parcels[0]);
    }
  }

  async setActiveFilter(filter: string) {
    this.activeFilter = filter;
    this.currentPage = 1;
    if (filter === 'all') {
      await this.loadTabData();
    } else {
      await this.loadFilteredParcels(filter);
    }
  }

  private async loadTabData() {
    try {
      this.isLoading = true;
      const userId = this.authService.getCurrentUser()?.id || localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User is not logged in or userId is missing');
      }

      if (this.activeTab === 'sent') {
        const response = await firstValueFrom(
          this.parcelService.getSentParcels({
            page: this.currentPage,
            limit: this.pageSize,
            userId,
          }).pipe(
            catchError(error => {
              console.error('Error in getSentParcels:', error);
              return of(null);
            })
          )
        );

        if (response) {
          this.sentParcels = [...(response.data || [])];
          this.totalParcels = response.total || 0;
        } else {
          this.sentParcels = [];
          this.totalParcels = 0;
        }
      } else {
        const response = await firstValueFrom(
          this.parcelService.getReceivedParcels({
            page: this.currentPage,
            limit: this.pageSize,
            userId,
          }).pipe(
            catchError(error => {
              console.error('Error in getReceivedParcels:', error);
              return of(null);
            })
          )
        );

        if (response) {
          this.receivedParcels = [...(response.data || [])];
          this.totalParcels = response.total || 0;
        } else {
          this.receivedParcels = [];
        }
      }

      console.log('Current Parcels after loadTabData:', this.getCurrentParcels());
      this.isLoading = false;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading tab data:', error);
      this.error = error instanceof Error ? error.message : 'Failed to load parcels';
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private async loadFilteredParcels(status: string) {
    try {
      this.isLoading = true;
      const userId = this.authService.getCurrentUser()?.id || localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User is not logged in or userId is missing');
      }

      const statusMap: { [key: string]: string } = {
        picked: 'Picked',
        'in-transit': 'In transit',
        completed: 'Completed',
        cancelled: 'Cancelled',
      };

      const actualStatus = statusMap[status];
      if (!actualStatus && status !== 'completed') return;

      let parcels: Parcel[] = [];
      if (status === 'completed') {
        const [completedParcels, deliveredParcels] = await Promise.all([
          firstValueFrom(
            this.parcelService.getParcelsByStatus('Completed', this.activeTab as 'sent' | 'received', userId).pipe(
              catchError(error => {
                console.error('Error fetching Completed parcels:', error);
                return of([]);
              })
            )
          ),
          firstValueFrom(
            this.parcelService.getParcelsByStatus('Delivered', this.activeTab as 'sent' | 'received', userId).pipe(
              catchError(error => {
                console.error('Error fetching Delivered parcels:', error);
                return of([]);
              })
            )
          ),
        ]);

        parcels = [...(completedParcels || []), ...(deliveredParcels || [])];
      } else {
        const response = await firstValueFrom(
          this.parcelService.getParcelsByStatus(actualStatus, this.activeTab as 'sent' | 'received', userId).pipe(
            catchError(error => {
              console.error(`Error fetching ${actualStatus} parcels:`, error);
              return of([]);
            })
          )
        );
        parcels = response || [];
      }

      if (this.activeTab === 'sent') {
        this.sentParcels = [...parcels];
      } else {
        this.receivedParcels = [...parcels];
      }

      console.log('Filtered Parcels:', parcels);
      this.isLoading = false;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading filtered parcels:', error);
      this.error = error instanceof Error ? error.message : 'Failed to load filtered parcels';
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  getCurrentParcels(): Parcel[] {
    const parcels = this.activeTab === 'sent' ? this.sentParcels : this.receivedParcels;
    console.log('Current Parcels:', parcels);
    return parcels;
  }

  getFilteredParcels(status: string): Parcel[] {
    const currentParcels = this.getCurrentParcels();
    return currentParcels.filter(p => p.status === status);
  }

  getCompletedParcels(): Parcel[] {
    const currentParcels = this.getCurrentParcels();
    return currentParcels.filter(p => p.status === 'Completed' || p.status === 'Delivered');
  }

  async onSearch() {
    if (!this.searchQuery.trim()) {
      await this.loadTabData();
      return;
    }

    try {
      this.isLoading = true;
      const results = await firstValueFrom(
        this.parcelService.searchParcels(this.searchQuery, this.activeTab as 'sent' | 'received').pipe(
          catchError(error => {
            console.error('Error searching parcels:', error);
            return of([]);
          })
        )
      );

      if (results) {
        if (this.activeTab === 'sent') {
          this.sentParcels = [...results];
        } else {
          this.receivedParcels = [...results];
        }
        if (results.length > 0) {
          this.showParcelRoute(results[0]);
        }
      }

      console.log('Search Results:', results);
      this.isLoading = false;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error searching parcels:', error);
      this.error = 'Search failed';
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async trackParcelByNumber(trackingNumber: string) {
    try {
      this.isLoading = true;
      const parcel = await firstValueFrom(
        this.parcelService.trackParcel(trackingNumber).pipe(
          catchError(error => {
            console.error('Error tracking parcel:', error);
            return of(null);
          })
        )
      );

      if (parcel) {
        this.showParcelRoute(parcel);
        const currentParcels = this.getCurrentParcels();
        const exists = currentParcels.find(p => p.id === parcel.id);
        if (!exists) {
          if (this.activeTab === 'sent') {
            this.sentParcels = [parcel, ...this.sentParcels];
          } else {
            this.receivedParcels = [parcel, ...this.receivedParcels];
          }
        }
      }

      console.log('Tracked Parcel:', parcel);
      this.isLoading = false;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error tracking parcel:', error);
      this.error = 'Parcel not found';
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  initMap() {
    this.map = new google.maps.Map(document.getElementById('map'), {
      zoom: 7,
      center: { lat: -1.2921, lng: 36.8219 },
      styles: [
        { featureType: 'all', elementType: 'geometry.fill', stylers: [{ color: '#f5f5f5' }] },
        { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#c9d3df' }] },
        { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4285f4' }, { weight: 2 }] },
      ],
    });

    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: { strokeWeight: 4, strokeOpacity: 0.8 },
    });
    this.directionsRenderer.setMap(this.map);
  }

  clearMapElements() {
    this.currentMarkers.forEach(marker => marker.setMap(null));
    this.currentMarkers = [];
    if (this.directionsRenderer) {
      this.directionsRenderer.setDirections({ routes: [] });
    }
    if (this.currentPolyline) {
      this.currentPolyline.setMap(null);
      this.currentPolyline = null;
    }
  }

  showParcelRoute(parcel: Parcel) {
    this.clearMapElements();
    this.selectedParcel = parcel;
    if (this.showModal) {
      this.showModal = false;
      setTimeout(() => {
        this.mapSection?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } else {
      setTimeout(() => {
        this.mapSection?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    }
    this.createCustomMarkers(parcel);
    this.calculateAndDisplayRoute(parcel);
  }

  createCustomMarkers(parcel: Parcel) {
    const pickupMarker = new google.maps.Marker({
      position: parcel.pickupLocation,
      map: this.map,
      icon: { path: google.maps.SymbolPath.CIRCLE, scale: 12, fillColor: '#10B981', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 3 },
      title: `Pickup: ${parcel.pickupLocation.name}`,
      zIndex: 1000,
    });

    const destinationMarker = new google.maps.Marker({
      position: parcel.destination,
      map: this.map,
      icon: { path: google.maps.SymbolPath.CIRCLE, scale: 12, fillColor: '#3B82F6', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 3 },
      title: `Destination: ${parcel.destination.name}`,
      zIndex: 1000,
    });

    const pickupInfoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 4px 0; color: #10B981;">Pickup Location</h3>
          <p style="margin: 0; color: #666;">${parcel.pickupLocation.name}</p>
          <p style="margin: 4px 0 0 0; color: #666; font-size: 12px;">Package ID: ${parcel.id}</p>
        </div>
      `,
    });

    const destinationInfoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 4px 0; color: #3B82F6;">Destination</h3>
          <p style="margin: 0; color: #666;">${parcel.destination.name}</p>
          <p style="margin: 4px 0 0 0; color: #666; font-size: 12px;">Status: ${parcel.status}</p>
        </div>
      `,
    });

    pickupMarker.addListener('click', () => {
      destinationInfoWindow.close();
      pickupInfoWindow.open(this.map, pickupMarker);
    });

    destinationMarker.addListener('click', () => {
      pickupInfoWindow.close();
      destinationInfoWindow.open(this.map, destinationMarker);
    });

    this.currentMarkers.push(pickupMarker, destinationMarker);

    if (parcel.status === 'In transit') {
      this.showCurrentLocationOnRoute(parcel);
    }
  }

  calculateAndDisplayRoute(parcel: Parcel) {
    const request = {
      origin: parcel.pickupLocation,
      destination: parcel.destination,
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.METRIC,
      avoidHighways: false,
      avoidTolls: false,
    };

    this.directionsService.route(request, (result: any, status: any) => {
      if (status === 'OK') {
        const routeColor = this.getRouteColor(parcel.status);
        this.directionsRenderer.setOptions({
          polylineOptions: { strokeColor: routeColor, strokeWeight: 5, strokeOpacity: 0.8 },
        });
        this.directionsRenderer.setDirections(result);
        this.displayRouteInfo(result, parcel);
      } else {
        console.error('Directions request failed due to ' + status);
        this.createFallbackRoute(parcel);
      }
    });
  }

  getRouteColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return '#10B981';
      case 'in transit':
        return '#F59E0B';
      case 'picked':
        return '#3B82F6';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  }

  createFallbackRoute(parcel: Parcel) {
    this.currentPolyline = new google.maps.Polyline({
      path: [parcel.pickupLocation, parcel.destination],
      geodesic: true,
      strokeColor: this.getRouteColor(parcel.status),
      strokeOpacity: 0.8,
      strokeWeight: 4,
      strokeStyle: 'dashed',
    });

    this.currentPolyline.setMap(this.map);
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(parcel.pickupLocation);
    bounds.extend(parcel.destination);
    this.map.fitBounds(bounds);
  }

  displayRouteInfo(directionsResult: any, parcel: Parcel) {
    if (directionsResult.routes && directionsResult.routes.length > 0) {
      const route = directionsResult.routes[0];
      const leg = route.legs[0];

      const routeInfoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #374151;">Route Information</h3>
            <p style="margin: 0; color: #666;"><strong>Package:</strong> ${parcel.id}</p>
            <p style="margin: 4px 0; color: #666;"><strong>Distance:</strong> ${leg.distance.text}</p>
            <p style="margin: 4px 0; color: #666;"><strong>Duration:</strong> ${leg.duration.text}</p>
            <p style="margin: 4px 0; color: #666;"><strong>Status:</strong> <span style="color: ${this.getRouteColor(parcel.status)};">${parcel.status}</span></p>
          </div>
        `,
      });

      const path = route.overview_path;
      const midPoint = path[Math.floor(path.length / 2)];

      const infoMarker = new google.maps.Marker({
        position: midPoint,
        map: this.map,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 6, fillColor: '#374151', fillOpacity: 0.8, strokeColor: '#fff', strokeWeight: 2 },
        title: 'Route Info',
      });

      infoMarker.addListener('click', () => {
        routeInfoWindow.open(this.map, infoMarker);
      });

      this.currentMarkers.push(infoMarker);
    }
  }

  showCurrentLocationOnRoute(parcel: Parcel) {
    const currentLat = parcel.currentLocation?.lat || (parcel.pickupLocation.lat + parcel.destination.lat) / 2;
    const currentLng = parcel.currentLocation?.lng || (parcel.pickupLocation.lng + parcel.destination.lng) / 2;

    const currentMarker = new google.maps.Marker({
      position: { lat: currentLat, lng: currentLng },
      map: this.map,
      icon: { path: google.maps.SymbolPath.CIRCLE, scale: 15, fillColor: '#8B5CF6', fillOpacity: 0.9, strokeColor: '#fff', strokeWeight: 3 },
      title: 'Current Location',
      zIndex: 1001,
      animation: google.maps.Animation.BOUNCE,
    });

    const currentInfoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 4px 0; color: #8B5CF6;">📍 Current Location</h3>
          <p style="margin: 0; color: #666;">Package ID: ${parcel.id}</p>
          <p style="margin: 4px 0 0 0; color: #666;">Status: ${parcel.status}</p>
          <p style="margin: 4px 0 0 0; color: #666; font-size: 12px;">Last updated: Just now</p>
        </div>
      `,
    });

    currentMarker.addListener('click', () => {
      currentInfoWindow.open(this.map, currentMarker);
    });

    setTimeout(() => {
      currentMarker.setAnimation(null);
    }, 3000);

    this.currentMarkers.push(currentMarker);
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'picked':
        return 'bg-blue-100 text-blue-800';
      case 'in transit':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  viewDetails(parcel: Parcel) {
    this.modalParcel = parcel;
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.showModal = false;
    this.modalParcel = null;
    this.cdr.detectChanges();
  }

  clearError() {
    this.error = null;
    this.parcelService.clearError();
    this.cdr.detectChanges();
  }

  async refreshData() {
    await this.loadTabData();
  }

  trackByParcelId(index: number, parcel: Parcel): string {
    console.log('Parcel ID:', parcel.id);
    return parcel.id;
  }
}
