import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import {map, catchError, switchMap} from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  ConfirmManualDeliveryDto,
  DriverLocationI,
  DriverLocationResponseDto,
  LocationSearchDto, LocationSuggestionDto, NotifyPickupDto, NotifyReceiverPickupDto,
  UpdateDriverLocationDto
} from '../models/location.interface';
import {Parcel} from '../models/parcel-interface';


// export interface BackendParcel {
//   id: string;
//   trackingNumber: string;
//   status: string;
//   createdAt: string;
//   driverId: string;
//   weight: number;
//   price: number;
//   deliveryTime?: string;
//   estimatedDeliveryDate: string;
//   destinationLocation: {
//     latitude: number;
//     longitude: number;
//     address: string;
//     name?: string;
//   };
//   pickupLocation?: {
//     latitude: number;
//     longitude: number;
//     address: string;
//     name?: string;
//   };
//   currentLocation?: {
//     latitude: number;
//     longitude: number;
//     address: string;
//   };
//   sender: {
//     name: string;
//     email: string;
//     phone: string;
//   };
//   receiver: {
//     name: string;
//     email: string;
//     phone: string;
//   };
//   trackingEvents?: any[];
// }

@Injectable({
  providedIn: 'root'
})
export class DriversService {
  private readonly baseUrl = `${environment.apiUrl}/drivers`;
  private readonly parcelsUrl = `${environment.apiUrl}/parcels`;

  // Subject to track location updates
  private locationUpdateSubject = new BehaviorSubject<DriverLocationResponseDto | null>(null);
  public locationUpdate$ = this.locationUpdateSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Update driver's current location
   */
  updateDriverLocation(driverId: string, locationData: UpdateDriverLocationDto): Observable<DriverLocationResponseDto> {
    return this.http.put<DriverLocationResponseDto>(`${this.baseUrl}/${driverId}/location`, locationData)
      .pipe(
        map(response => {
          this.locationUpdateSubject.next(response);
          return response;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get driver's location history
   */
  getDriverLocations(driverId: string): Observable<DriverLocationI[]> {
    return this.http.get<DriverLocationI[]>(`${this.baseUrl}/${driverId}/locations`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get driver's current location
   */
  getDriverCurrentLocation(driverId: string): Observable<DriverLocationI | null> {
    return this.http.get<DriverLocationI | null>(`${this.baseUrl}/${driverId}/location/current`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Search for location suggestions
   */
  searchLocations(searchDto: LocationSearchDto): Observable<LocationSuggestionDto[]> {
    let params = new HttpParams().set('query', searchDto.query);
    if (searchDto.limit) {
      params = params.set('limit', searchDto.limit.toString());
    }

    return this.http.get<LocationSuggestionDto[]>(`${this.baseUrl}/locations/search`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get parcels assigned to driver
   */
  getDriverAssignedParcels(driverId: string): Observable<Parcel[]> {
    return this.http.get<Parcel[]>(`${this.baseUrl}/${driverId}/parcels`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Notify pickup completion
   */
  notifyParcelPickup(driverId: string, parcelId: string, pickupData?: NotifyPickupDto): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${driverId}/parcels/${parcelId}/pickup`, pickupData || {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Notify receiver for pickup (when driver arrives at destination)
   */
  notifyReceiverForPickup(driverId: string, parcelId: string, notifyData?: NotifyReceiverPickupDto): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${driverId}/parcels/${parcelId}/notify-receiver`, notifyData || {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Confirm manual delivery
   */
  confirmManualDelivery(driverId: string, parcelId: string, deliveryData?: ConfirmManualDeliveryDto): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${driverId}/parcels/${parcelId}/manual-delivery`, deliveryData || {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Update parcel status (for backward compatibility with your component)
   */
  updateParcelStatus(driverId: string, parcelId: string, status: string, location?: string): Observable<void> {
    const body = {
      status,
      location: location || undefined
    };

    return this.http.put<void>(`${this.parcelsUrl}/${parcelId}/status`, body)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update parcel location with current driver position
   */
  updateParcelLocationWithGPS(driverId: string, parcelId: string): Observable<DriverLocationResponseDto> {
    return new Observable(observer => {
      if (!navigator.geolocation) {
        observer.error(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: UpdateDriverLocationDto = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };

          this.updateDriverLocation(driverId, locationData).subscribe({
            next: (response) => observer.next(response),
            error: (error) => observer.error(error),
            complete: () => observer.complete()
          });
        },
        (error) => observer.error(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Update parcel location with custom address
   */
  updateParcelLocationWithAddress(driverId: string, parcelId: string, address: string): Observable<DriverLocationResponseDto> {
    // First geocode the address, then update location
    return this.searchLocations({ query: address, limit: 1 }).pipe(
      map(suggestions => {
        if (suggestions.length === 0) {
          throw new Error('Address not found');
        }
        return suggestions[0];
      }),
      switchMap(location => {
        const locationData: UpdateDriverLocationDto = {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address
        };
        return this.updateDriverLocation(driverId, locationData);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Transform backend parcel to frontend parcel format
   */
    // If the input already matches the Parcel interface, return a Parcel.

  transformParcelToFrontend(parcel: Parcel): Parcel {
    return {
      id: parcel.id,
      trackingNumber: parcel.trackingNumber,
      status: parcel.status,

      date: parcel.date ?? (parcel.createdAt ? parcel.createdAt.split('T')[0] : ''),

      createdAt: parcel.createdAt,

      address: parcel.address ?? parcel.destination?.address ?? '',

      pickupLocation: parcel.pickupLocation,
      destination: parcel.destination,
      currentLocation: parcel.currentLocation,

      // Sender
      senderId: parcel.senderId,
      sender: parcel.sender,
      senderName: parcel.senderName,
      senderPhone: parcel.senderPhone,
      senderEmail: parcel.senderEmail,

      // Receiver
      receiverId: parcel.receiverId,
      receiver: parcel.receiver,
      receiverName: parcel.receiverName,
      receiverPhone: parcel.receiverPhone,
      receiverEmail: parcel.receiverEmail,

      // Driver
      driverId: parcel.driverId,
      driver: parcel.driver,

      // Delivery
      deliveryTime: parcel.deliveryTime,
      estimatedDeliveryDate: parcel.estimatedDeliveryDate,

      // Tracking
      trackingEvents: parcel.trackingEvents ?? [],

      // Commerce
      price: parcel.price,

      // Notifications (fallbacks if missing)
      notificationsSent: parcel.notificationsSent ?? {
        customerPickup: false,
        customerDelivery: false,
        recipientDelivery: false,
        driverAssignment: !!parcel.driverId,
      },

      // Weight
      weight: parcel.weight,
      weightCategory:
        parcel.weightCategory ?? (this.determineWeightCategory
          ? this.determineWeightCategory(parcel.weight)
          : 'MEDIUM'),
    };
  }


  /**
   * Determine weight category based on weight
   */
  private determineWeightCategory(weight: number): string {
    if (weight <= 1) return 'ULTRA_LIGHT';
    if (weight <= 3) return 'LIGHT';
    if (weight <= 10) return 'MEDIUM';
    if (weight <= 25) return 'HEAVY';
    return 'EXTRA_HEAVY';
  }

  /**
   * Error handler
   */
  private handleError = (error: any): Observable<never> => {
    console.error('DriversService Error:', error);
    throw error;
  };
}

// Additional utility functions that might be useful
export class LocationUtils {
  /**
   * Calculate distance between two points using Haversine formula
   */
  static calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
      Math.sin(dLng/2) * Math.sin(dLng/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Format distance for display
   */
  static formatDistance(distanceInMeters: number): string {
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)}m`;
    }
    return `${(distanceInMeters / 1000).toFixed(1)}km`;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
