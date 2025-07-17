import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsService {
  private mapLoaded = false;

  async loadGoogleMaps(): Promise<typeof google.maps> {
    if (this.mapLoaded) {
      return Promise.resolve(google.maps);
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=geometry,places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.mapLoaded = true;
        resolve(google.maps);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async geocodeAddress(address: string): Promise<google.maps.GeocoderResult> {
    const geocoder = new google.maps.Geocoder();

    return new Promise((resolve, reject) => {
      geocoder.geocode(
        {
          address: address + ', Kenya',
          region: 'KE'
        },
        (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results) {
            resolve(results[0]);
          } else {
            reject(status);
          }
        }
      );
    });
  }
}
