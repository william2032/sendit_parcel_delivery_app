import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgFor, NgIf} from '@angular/common';
import {GoogleMapsService} from '../../../../shared/services/google-maps';
import {Parcel} from '../../../../shared/models/parcel-interface';
import {
  ParcelDetailsModalComponent
} from "../../../../shared/components/parcel-details-modal/parcel-details-modal.component";
import {HeaderComponent} from "../shared/header/header.component";
import {FooterComponent} from "../shared/footer/footer.component";

declare var google: any;

@Component({
  selector: 'app-track-order',
  standalone: true,
  templateUrl: './track-order.component.html',
  imports: [
    FormsModule,
    NgFor,
    NgIf,
    ParcelDetailsModalComponent,
    HeaderComponent,
    FooterComponent
  ],
  styleUrls: ['./track-order.component.scss']
})
export class TrackOrderComponent implements OnInit {
  @ViewChild('mapSection') mapSection!: ElementRef;

  activeTab: string = 'sent';
  searchQuery: string = '';
  map: any;
  directionsService: any;
  directionsRenderer: any;
  currentMarkers: any[] = [];
  currentPolyline: any;
  selectedParcel: Parcel | null = null;
  showModal: boolean = false;
  modalParcel: Parcel | null = null;

  sentParcels: Parcel[] = [
    {
      id: '#AHCAG8',
      address: 'Westlands, Nairobi',
      date: '04 Sep 2019',
      status: 'In transit',
      pickupLocation: { lat: -1.2921, lng: 36.8219, name: 'Nairobi CBD' },
      destination: { lat: -1.2634, lng: 36.8118, name: 'Westlands' },
      weight: 2.0,
      senderName: 'David Steward',
      senderPhone: '+254712345678',
      receiverName: 'John Doe',
      receiverPhone: '+254798765432',
      deliveryTime: '15 hrs',
      trackingHistory: [
        { status: 'Picked up', location: 'Nairobi CBD', timestamp: '2019-09-04 09:00', description: 'Package picked up from sender' },
        { status: 'In transit', location: 'Nairobi CBD', timestamp: '2019-09-04 10:30', description: 'Package in transit to destination' }
      ]
    },
    {
      id: '#AHCAG9',
      address: 'Karen, Nairobi',
      date: '28 May 2019',
      status: 'Picked',
      pickupLocation: { lat: -1.2921, lng: 36.8219, name: 'Nairobi CBD' },
      destination: { lat: -1.3197, lng: 36.7085, name: 'Karen' },
      weight: 1.5,
      senderName: 'Sarah Johnson',
      senderPhone: '+254723456789',
      receiverName: 'Mike Wilson',
      receiverPhone: '+254756789012',
      deliveryTime: '12 hrs',
      trackingHistory: [
        { status: 'Picked up', location: 'Nairobi CBD', timestamp: '2019-05-28 14:00', description: 'Package picked up from sender' }
      ]
    },
    {
      id: '#AHCAG10',
      address: 'Kiambu Town',
      date: '23 Nov 2019',
      status: 'Cancelled',
      pickupLocation: { lat: -1.2921, lng: 36.8219, name: 'Nairobi CBD' },
      destination: { lat: -1.1714, lng: 36.8356, name: 'Kiambu Town' },
      weight: 0.8,
      senderName: 'Peter Mwangi',
      senderPhone: '+254734567890',
      receiverName: 'Grace Wanjiku',
      receiverPhone: '+254767890123',
      deliveryTime: '8 hrs',
      trackingHistory: [
        { status: 'Cancelled', location: 'Nairobi CBD', timestamp: '2019-11-23 11:00', description: 'Package cancelled by sender' }
      ]
    },
    {
      id: '#AHCAG11',
      address: 'Thika Town',
      date: '03 Feb 2019',
      status: 'Completed',
      pickupLocation: { lat: -1.2921, lng: 36.8219, name: 'Nairobi CBD' },
      destination: { lat: -1.0332, lng: 37.0692, name: 'Thika Town' },
      weight: 3.2,
      senderName: 'Alice Nyong',
      senderPhone: '+254745678901',
      receiverName: 'James Kariuki',
      receiverPhone: '+254778901234',
      deliveryTime: '18 hrs',
      trackingHistory: [
        { status: 'Picked up', location: 'Nairobi CBD', timestamp: '2019-02-03 08:00', description: 'Package picked up from sender' },
        { status: 'In transit', location: 'Thika Road', timestamp: '2019-02-03 14:00', description: 'Package in transit' },
        { status: 'Delivered', location: 'Thika Town', timestamp: '2019-02-04 02:00', description: 'Package delivered successfully' }
      ]
    },
    {
      id: '#AHCAG12',
      address: 'Mombasa Road',
      date: '29 Jul 2019',
      status: 'Completed',
      pickupLocation: { lat: -1.2921, lng: 36.8219, name: 'Nairobi CBD' },
      destination: { lat: -1.3733, lng: 36.8644, name: 'Mombasa Road' },
      weight: 5.5,
      senderName: 'Robert Kimani',
      senderPhone: '+254756789012',
      receiverName: 'Mary Achieng',
      receiverPhone: '+254789012345',
      deliveryTime: '10 hrs',
      trackingHistory: [
        { status: 'Picked up', location: 'Nairobi CBD', timestamp: '2019-07-29 09:00', description: 'Package picked up from sender' },
        { status: 'Delivered', location: 'Mombasa Road', timestamp: '2019-07-29 19:00', description: 'Package delivered successfully' }
      ]
    }
  ];

  receivedParcels: Parcel[] = [
    {
      id: '#RHCAG9',
      address: 'Mombasa CBD',
      date: '15 Jun 2019',
      status: 'Delivered',
      pickupLocation: { lat: -4.0435, lng: 39.6682, name: 'Mombasa CBD' },
      destination: { lat: -1.2921, lng: 36.8219, name: 'Nairobi CBD' },
      weight: 1.2,
      senderName: 'Ahmed Hassan',
      senderPhone: '+254790123456',
      receiverName: 'Catherine Wanjiru',
      receiverPhone: '+254712345678',
      deliveryTime: '24 hrs',
      trackingHistory: [
        { status: 'Picked up', location: 'Mombasa CBD', timestamp: '2019-06-15 10:00', description: 'Package picked up from sender' },
        { status: 'Delivered', location: 'Nairobi CBD', timestamp: '2019-06-16 10:00', description: 'Package delivered successfully' }
      ]
    },
    {
      id: '#RHCAG10',
      address: 'Kisumu Port',
      date: '10 Jul 2019',
      status: 'Delivered',
      pickupLocation: { lat: -0.0917, lng: 34.7680, name: 'Kisumu Port' },
      destination: { lat: -1.2921, lng: 36.8219, name: 'Nairobi CBD' },
      weight: 0.7,
      senderName: 'Daniel Ochieng',
      senderPhone: '+254723456789',
      receiverName: 'Francis Maina',
      receiverPhone: '+254756789012',
      deliveryTime: '30 hrs',
      trackingHistory: [
        { status: 'Picked up', location: 'Kisumu Port', timestamp: '2019-07-10 12:00', description: 'Package picked up from sender' },
        { status: 'Delivered', location: 'Nairobi CBD', timestamp: '2019-07-11 18:00', description: 'Package delivered successfully' }
      ]
    },
    {
      id: '#RHCAG11',
      address: 'Eldoret Depot',
      date: '20 Aug 2019',
      status: 'In transit',
      pickupLocation: { lat: 0.5143, lng: 35.2698, name: 'Eldoret Depot' },
      destination: { lat: -1.2921, lng: 36.8219, name: 'Nairobi CBD' },
      weight: 2.8,
      senderName: 'Lucy Chepkemoi',
      senderPhone: '+254734567890',
      receiverName: 'Samuel Njoroge',
      receiverPhone: '+254767890123',
      deliveryTime: '22 hrs',
      trackingHistory: [
        { status: 'Picked up', location: 'Eldoret Depot', timestamp: '2019-08-20 08:00', description: 'Package picked up from sender' },
        { status: 'In transit', location: 'Nakuru', timestamp: '2019-08-20 16:00', description: 'Package in transit to destination' }
      ]
    }
  ];

  constructor(private googleMapsService: GoogleMapsService) {}

  async ngOnInit() {
    try {
      await this.googleMapsService.loadGoogleMaps();
      this.initMap();
      // Show first parcel by default
      if (this.sentParcels.length > 0) {
        this.showParcelRoute(this.sentParcels[0]);
      }
    } catch (error) {
      console.error('Error loading Google Maps:', error);
    }
  }

  initMap() {
    // Center map on Kenya
    this.map = new google.maps.Map(document.getElementById('map'), {
      zoom: 7,
      center: { lat: -1.2921, lng: 36.8219 }, // Nairobi coordinates
      styles: [
        {
          featureType: 'all',
          elementType: 'geometry.fill',
          stylers: [{ color: '#f5f5f5' }]
        },
        {
          featureType: 'water',
          elementType: 'geometry.fill',
          stylers: [{ color: '#c9d3df' }]
        },
        {
          featureType: 'administrative.country',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#4285f4' }, { weight: 2 }]
        }
      ]
    });

    // Initialize Directions Service and Renderer
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true, // We'll create our own custom markers
      polylineOptions: {
        strokeWeight: 4,
        strokeOpacity: 0.8
      }
    });
    this.directionsRenderer.setMap(this.map);
  }

  clearMapElements() {
    // Clear existing markers
    this.currentMarkers.forEach(marker => marker.setMap(null));
    this.currentMarkers = [];

    // Clear existing directions
    if (this.directionsRenderer) {
      this.directionsRenderer.setDirections({ routes: [] });
    }

    // Clear existing polyline (fallback)
    if (this.currentPolyline) {
      this.currentPolyline.setMap(null);
      this.currentPolyline = null;
    }
  }

  showParcelRoute(parcel: Parcel) {
    this.clearMapElements();
    this.selectedParcel = parcel;

    // Handle modal and scrolling
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

    // Create custom markers first
    this.createCustomMarkers(parcel);

    // Calculate and display the route
    this.calculateAndDisplayRoute(parcel);
  }

  createCustomMarkers(parcel: Parcel) {
    // Create pickup marker (green)
    const pickupMarker = new google.maps.Marker({
      position: parcel.pickupLocation,
      map: this.map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#10B981',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 3
      },
      title: `Pickup: ${parcel.pickupLocation.name}`,
      zIndex: 1000
    });

    // Create destination marker (blue)
    const destinationMarker = new google.maps.Marker({
      position: parcel.destination,
      map: this.map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#3B82F6',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 3
      },
      title: `Destination: ${parcel.destination.name}`,
      zIndex: 1000
    });

    // Create info windows
    const pickupInfoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 4px 0; color: #10B981;">Pickup Location</h3>
          <p style="margin: 0; color: #666;">${parcel.pickupLocation.name}</p>
          <p style="margin: 4px 0 0 0; color: #666; font-size: 12px;">Package ID: ${parcel.id}</p>
        </div>
      `
    });

    const destinationInfoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 4px 0; color: #3B82F6;">Destination</h3>
          <p style="margin: 0; color: #666;">${parcel.destination.name}</p>
          <p style="margin: 4px 0 0 0; color: #666; font-size: 12px;">Status: ${parcel.status}</p>
        </div>
      `
    });

    // Add click listeners for info windows
    pickupMarker.addListener('click', () => {
      destinationInfoWindow.close();
      pickupInfoWindow.open(this.map, pickupMarker);
    });

    destinationMarker.addListener('click', () => {
      pickupInfoWindow.close();
      destinationInfoWindow.open(this.map, destinationMarker);
    });

    this.currentMarkers.push(pickupMarker, destinationMarker);

    // If parcel is in transit, show current location
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
      avoidTolls: false
    };

    this.directionsService.route(request, (result: any, status: any) => {
      if (status === 'OK') {
        // Set the route color based on status
        const routeColor = this.getRouteColor(parcel.status);

        // Update the directions renderer with custom styling
        this.directionsRenderer.setOptions({
          polylineOptions: {
            strokeColor: routeColor,
            strokeWeight: 5,
            strokeOpacity: 0.8
          }
        });

        this.directionsRenderer.setDirections(result);

        // Optional: Add route information
        this.displayRouteInfo(result, parcel);
      } else {
        console.error('Directions request failed due to ' + status);
        // Fallback to straight line if directions fail
        this.createFallbackRoute(parcel);
      }
    });
  }

  getRouteColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return '#10B981'; // Green for completed
      case 'in transit':
        return '#F59E0B'; // Amber for in transit
      case 'picked':
        return '#3B82F6'; // Blue for picked
      case 'cancelled':
        return '#EF4444'; // Red for cancelled
      default:
        return '#6B7280'; // Gray for default
    }
  }

  createFallbackRoute(parcel: Parcel) {
    // Create a straight line as fallback
    this.currentPolyline = new google.maps.Polyline({
      path: [parcel.pickupLocation, parcel.destination],
      geodesic: true,
      strokeColor: this.getRouteColor(parcel.status),
      strokeOpacity: 0.8,
      strokeWeight: 4,
      strokeStyle: 'dashed' // Make it dashed to indicate it's not the actual route
    });

    this.currentPolyline.setMap(this.map);

    // Adjust map bounds to show both markers
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(parcel.pickupLocation);
    bounds.extend(parcel.destination);
    this.map.fitBounds(bounds);
  }

  displayRouteInfo(directionsResult: any, parcel: Parcel) {
    if (directionsResult.routes && directionsResult.routes.length > 0) {
      const route = directionsResult.routes[0];
      const leg = route.legs[0];

      // You can display this information in your UI
      console.log('Route Distance:', leg.distance.text);
      console.log('Route Duration:', leg.duration.text);

      // Optional: Create an info window with route details
      const routeInfoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #374151;">Route Information</h3>
            <p style="margin: 0; color: #666;"><strong>Package:</strong> ${parcel.id}</p>
            <p style="margin: 4px 0; color: #666;"><strong>Distance:</strong> ${leg.distance.text}</p>
            <p style="margin: 4px 0; color: #666;"><strong>Duration:</strong> ${leg.duration.text}</p>
            <p style="margin: 4px 0; color: #666;"><strong>Status:</strong> <span style="color: ${this.getRouteColor(parcel.status)};">${parcel.status}</span></p>
          </div>
        `
      });

      // Position the info window at the midpoint of the route
      const path = route.overview_path;
      const midPoint = path[Math.floor(path.length / 2)];

      // Add a small info marker at the midpoint (optional)
      const infoMarker = new google.maps.Marker({
        position: midPoint,
        map: this.map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: '#374151',
          fillOpacity: 0.8,
          strokeColor: '#fff',
          strokeWeight: 2
        },
        title: 'Route Info'
      });

      infoMarker.addListener('click', () => {
        routeInfoWindow.open(this.map, infoMarker);
      });

      this.currentMarkers.push(infoMarker);
    }
  }

  showCurrentLocationOnRoute(parcel: Parcel) {
    // For in-transit packages, show current location marker
    // This is a simplified version - in a real app, you'd get the actual current location
    const currentLat = (parcel.pickupLocation.lat + parcel.destination.lat) / 2;
    const currentLng = (parcel.pickupLocation.lng + parcel.destination.lng) / 2;

    const currentMarker = new google.maps.Marker({
      position: { lat: currentLat, lng: currentLng },
      map: this.map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 15,
        fillColor: '#8B5CF6',
        fillOpacity: 0.9,
        strokeColor: '#fff',
        strokeWeight: 3
      },
      title: 'Current Location',
      zIndex: 1001,
      animation: google.maps.Animation.BOUNCE // Add bounce animation
    });

    const currentInfoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 4px 0; color: #8B5CF6;">📍 Current Location</h3>
          <p style="margin: 0; color: #666;">Package ID: ${parcel.id}</p>
          <p style="margin: 4px 0 0 0; color: #666;">Status: ${parcel.status}</p>
          <p style="margin: 4px 0 0 0; color: #666; font-size: 12px;">Last updated: Just now</p>
        </div>
      `
    });

    currentMarker.addListener('click', () => {
      currentInfoWindow.open(this.map, currentMarker);
    });

    // Stop bouncing after 3 seconds
    setTimeout(() => {
      currentMarker.setAnimation(null);
    }, 3000);

    this.currentMarkers.push(currentMarker);
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    const parcels = this.getCurrentParcels();
    if (parcels.length > 0) {
      this.showParcelRoute(parcels[0]);
    }
  }

  getCurrentParcels(): Parcel[] {
    return this.activeTab === 'sent' ? this.sentParcels : this.receivedParcels;
  }

  getFilteredParcels(status: string): Parcel[] {
    const currentParcels = this.getCurrentParcels();
    return currentParcels.filter(p => p.status === status);
  }

  getCompletedParcels(): Parcel[] {
    const currentParcels = this.getCurrentParcels();
    return currentParcels.filter(p => p.status === 'Completed' || p.status === 'Delivered');
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
    console.log('View details for:', parcel);
  }

  closeModal() {
    this.showModal = false;
    this.modalParcel = null;
  }

  onSearch() {
    const query = this.searchQuery.toLowerCase();
    const parcels = this.getCurrentParcels();
    const found = parcels.find(p => p.id.toLowerCase().includes(query));

    if (found) {
      this.showParcelRoute(found);
    } else {
      console.log('Parcel not found:', this.searchQuery);
    }
  }
}
