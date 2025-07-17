import { Component, OnInit } from '@angular/core';
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
  activeTab: string = 'sent';
  searchQuery: string = '';
  map: any;
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
  }

  clearMapElements() {
    // Clear existing markers
    this.currentMarkers.forEach(marker => marker.setMap(null));
    this.currentMarkers = [];

    // Clear existing polyline
    if (this.currentPolyline) {
      this.currentPolyline.setMap(null);
      this.currentPolyline = null;
    }
  }

  showParcelRoute(parcel: Parcel) {
    this.clearMapElements();
    this.selectedParcel = parcel;

    // Create pickup marker (green)
    const pickupMarker = new google.maps.Marker({
      position: parcel.pickupLocation,
      map: this.map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#10B981',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2
      },
      title: `Pickup: ${parcel.pickupLocation.name}`
    });

    // Create destination marker (blue)
    const destinationMarker = new google.maps.Marker({
      position: parcel.destination,
      map: this.map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#3B82F6',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2
      },
      title: `Destination: ${parcel.destination.name}`
    });

    // Create info windows
    const pickupInfoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 4px 0; color: #10B981;">Pickup Location</h3>
          <p style="margin: 0; color: #666;">${parcel.pickupLocation.name}</p>
        </div>
      `
    });

    const destinationInfoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 4px 0; color: #3B82F6;">Destination</h3>
          <p style="margin: 0; color: #666;">${parcel.destination.name}</p>
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

    // Create route line
    this.currentPolyline = new google.maps.Polyline({
      path: [parcel.pickupLocation, parcel.destination],
      geodesic: true,
      strokeColor: parcel.status === 'Completed' || parcel.status === 'Delivered' ? '#10B981' : '#3B82F6',
      strokeOpacity: 1.0,
      strokeWeight: 3
    });

    this.currentPolyline.setMap(this.map);

    // If parcel is in transit, show current location
    if (parcel.status === 'In transit') {
      this.showCurrentLocation(parcel);
    }

    // Adjust map bounds to show both markers
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(parcel.pickupLocation);
    bounds.extend(parcel.destination);
    this.map.fitBounds(bounds);
  }

  showCurrentLocation(parcel: Parcel) {
    // Calculate a point roughly halfway between pickup and destination
    const currentLat = (parcel.pickupLocation.lat + parcel.destination.lat) / 2;
    const currentLng = (parcel.pickupLocation.lng + parcel.destination.lng) / 2;

    const currentMarker = new google.maps.Marker({
      position: { lat: currentLat, lng: currentLng },
      map: this.map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#8B5CF6',
        fillOpacity: 0.8,
        strokeColor: '#fff',
        strokeWeight: 3
      },
      title: 'Current Location'
    });

    const currentInfoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 4px 0; color: #8B5CF6;">Current Location</h3>
          <p style="margin: 0; color: #666;">Package ID: ${parcel.id}</p>
          <p style="margin: 4px 0 0 0; color: #666;">Status: ${parcel.status}</p>
        </div>
      `
    });

    currentMarker.addListener('click', () => {
      currentInfoWindow.open(this.map, currentMarker);
    });

    this.currentMarkers.push(currentMarker);
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    // Show first parcel of the selected tab
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
    this.showParcelRoute(parcel);
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
