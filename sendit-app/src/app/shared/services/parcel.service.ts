import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Parcel } from '../models/parcel-interface';
import { environment } from '../../../environments/environment';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class ParcelService {
  private readonly API_URL = environment.apiUrl;

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {}

  private get apiUrl(): string {
    return `${this.API_URL}`;
  }

  private getHttpOptions(): { headers: HttpHeaders } {
    const token = localStorage.getItem('access_token');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      })
    };
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private setError(error: string | null): void {
    this.errorSubject.next(error);
  }

  private handleError(error: any): Observable<never> {
    console.error('ParcelService Error:', error);
    let errorMessage = 'An unexpected error occurred';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    this.setError(errorMessage);
    this.setLoading(false);
    return throwError(() => new Error(errorMessage));
  }

  getAllParcels(params?: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: string;
    type?: 'sent' | 'received';
  }): Observable<PaginatedResponse<Parcel>> {
    this.setLoading(true);
    this.setError(null);

    const { userId, type, ...queryParams } = params || {};
    let url = `${this.apiUrl}/parcels`;

    if (userId && type) {
      url = `${this.apiUrl}/parcels/${type}/${userId}`;
    }

    const searchParams = new URLSearchParams();

    if (queryParams.page !== undefined) {
      searchParams.append('page', queryParams.page.toString());
    }
    if (queryParams.limit !== undefined) {
      searchParams.append('limit', queryParams.limit.toString());
    }
    if (queryParams.status !== undefined) {
      searchParams.append('status', queryParams.status);
    }

    const queryString = searchParams.toString();
    const finalUrl = queryString ? `${url}?${queryString}` : url;

    return this.http.get<PaginatedResponse<Parcel>>(finalUrl, this.getHttpOptions()).pipe(
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError(error))
    );
  }

  getSentParcels(params?: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: string;
  }): Observable<PaginatedResponse<Parcel>> {
    if (!params?.userId) {
      this.setLoading(false);
      this.setError('userId is required for fetching sent parcels');
      return throwError(() => new Error('userId is required for fetching sent parcels'));
    }

    return this.getAllParcels({
      ...params,
      type: 'sent',
    });
  }

  getReceivedParcels(params?: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: string;
  }): Observable<PaginatedResponse<Parcel>> {
    if (!params?.userId) {
      this.setLoading(false);
      this.setError('userId is required for fetching received parcels');
      return throwError(() => new Error('userId is required for fetching received parcels'));
    }

    return this.getAllParcels({
      ...params,
      type: 'received',
    });
  }

  getParcelById(id: string): Observable<Parcel> {
    this.setLoading(true);
    this.setError(null);

    return this.http.get<Parcel>(
      `${this.apiUrl}/parcels/${id}`,
      this.getHttpOptions()
    ).pipe(
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError(error))
    );
  }

  trackParcel(trackingNumber: string): Observable<Parcel> {
    this.setLoading(true);
    this.setError(null);

    return this.http.get<Parcel>(
      `${this.apiUrl}/parcels/track/${trackingNumber}`,
      this.getHttpOptions()
    ).pipe(
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError(error))
    );
  }

  getParcelTrackingEvents(parcelId: string): Observable<any[]> {
    this.setLoading(true);
    this.setError(null);

    return this.http.get<any[]>(
      `${this.apiUrl}/parcels/${parcelId}/tracking`,
      this.getHttpOptions()
    ).pipe(
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError(error))
    );
  }

  searchParcels(query: string, type?: 'sent' | 'received'): Observable<Parcel[]> {
    this.setLoading(true);
    this.setError(null);

    const params = new URLSearchParams({ q: query });
    if (type) {
      params.append('type', type);
    }

    return this.http.get<Parcel[]>(
      `${this.apiUrl}/parcels/search?${params.toString()}`,
      this.getHttpOptions()
    ).pipe(
      tap(() => this.setLoading(false)),
      catchError(error => this.handleError(error))
    );
  }

  getParcelsByStatus(status: string, type: 'sent' | 'received', userId: string): Observable<Parcel[]> {
    return this.getAllParcels({
      status,
      userId,
      type,
    }).pipe(
      map(response => response.data)
    );
  }

  clearError(): void {
    this.setError(null);
  }
}
