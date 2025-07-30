import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {AdminDashboardStats} from '../models/admin-dashboard.interface';
import {environment} from '../../../environments/environment';
import {UserI} from '../models/users.interface';
import {ApiResponse} from '../models/api-response.interface';
import {DeliveryOrder, ParcelApiResponse, UpdateParcelRequest} from "../models/parcel-interface";

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private readonly API_URL = environment.apiUrl;

    constructor(private http: HttpClient) {
    }

    getDashboardStats(): Observable<AdminDashboardStats> {
        return this.http.get<AdminDashboardStats>(`${this.API_URL}/admin/dashboard/stats`).pipe(
            catchError(this.handleError)
        );
    }

    // Get all users
    getAllUsers(): Observable<UserI[] | ApiResponse<UserI[]>> {
        return this.http.get<UserI[]>(`${this.API_URL}/users`).pipe(
            catchError(this.handleError)
        );
    }

    // Update user status
    updateUserStatus(userId: string, status: boolean): Observable<UserI> {
        return this.http.patch<UserI>(`${this.API_URL}/users/${userId}/status`, {status}).pipe(
            catchError(this.handleError)
        );
    }

    // Delete user
    deleteUser(userId: string): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/users/${userId}`).pipe(
            catchError(this.handleError)
        );
    }

    updateUserRole(userId: string, role: string): Observable<UserI> {
        return this.http.patch<UserI>(`${this.API_URL}/users/${userId}`, {role}).pipe(
            catchError(this.handleError)
        );
    }

    // Get all parcels/orders
    getAllParcels(): Observable<DeliveryOrder[]> {
        return this.http.get<ParcelApiResponse>(`${this.API_URL}/parcels`).pipe(
            map(response => this.mapParcelsResponse(response.data)),
            catchError(this.handleError)
        );
    }

    // Get parcel by ID
    getParcelById(parcelId: string): Observable<DeliveryOrder> {
        return this.http.get<{ data: DeliveryOrder }>(`${this.API_URL}/parcels/${parcelId}`).pipe(
            map(response => this.mapParcelData(response.data)),
            catchError(this.handleError)
        );
    }



    // Update parcel
    updateParcel(parcelId: string, parcelData: UpdateParcelRequest): Observable<DeliveryOrder> {
        return this.http.patch<{ data: DeliveryOrder }>(`${this.API_URL}/parcels/${parcelId}`, parcelData).pipe(
            map(response => this.mapParcelData(response.data)),
            catchError(this.handleError)
        );
    }

    // Update parcel status only
    updateParcelStatus(parcelId: string, status: string): Observable<DeliveryOrder> {
        return this.http.patch<{ data: DeliveryOrder }>(`${this.API_URL}/parcels/${parcelId}/status`, {status}).pipe(
            map(response => this.mapParcelData(response.data)),
            catchError(this.handleError)
        );
    }

    // Delete parcel
    deleteParcel(parcelId: string): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/parcels/${parcelId}`).pipe(
            catchError(this.handleError)
        );
    }

    // Get parcels with filters (optional query parameters)
    getParcelsWithFilters(filters?: {
        status?: string;
        weightCategory?: string;
        page?: number;
        limit?: number;
        startDate?: string;
        endDate?: string;
    }): Observable<{ parcels: DeliveryOrder[], total: number, page: number, totalPages: number }> {
        let queryParams = '';

        if (filters) {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    params.append(key, value.toString());
                }
            });
            queryParams = params.toString() ? `?${params.toString()}` : '';
        }

        return this.http.get<{
            data: DeliveryOrder[],
            total: number,
            page: number,
            totalPages: number
        }>(`${this.API_URL}/parcels${queryParams}`).pipe(
            map(response => ({
                parcels: this.mapParcelsResponse(response.data),
                total: response.total,
                page: response.page,
                totalPages: response.totalPages
            })),
            catchError(this.handleError)
        );
    }

    getAvailableDrivers(): Observable<any[]> {
        return this.http.get<any[]>(`${this.API_URL}/admin/drivers/available`).pipe(
            catchError(this.handleError)
        );
    }

    assignDriver(parcelId: string, driverId: string): Observable<any> {
        return this.http.post<any>(`${this.API_URL}/admin/parcels/${parcelId}/assign-driver`, { driverId }).pipe(
            catchError(this.handleError)
        );
    }
    // Get parcels by status
    getParcelsByStatus(status: string): Observable<DeliveryOrder[]> {
        return this.http.get<ParcelApiResponse>(`${this.API_URL}/parcels?status=${status}`).pipe(
            map(response => this.mapParcelsResponse(response.data)),
            catchError(this.handleError)
        );
    }

    private mapParcelData(parcel: DeliveryOrder): DeliveryOrder {
        return {
            ...parcel,
            deliveryAddress: parcel.destination?.address || parcel.address,
            quote: this.generateQuote(parcel.weight, parcel.price)
        };
    }


    // Helper method to map array of parcels
    private mapParcelsResponse(parcels: DeliveryOrder[]): DeliveryOrder[] {
        return parcels.map(parcel => this.mapParcelData(parcel));
    }

    private generateQuote(weight: number, price: number): string {
        if (weight <= 0.5) return '0 - 0.5 kg';
        if (weight <= 2) return '0.6 - 2 kg';
        if (weight <= 5) return '2.1 - 5 kg';
        if (weight <= 10) return '5.1 - 10 kg';
        if (weight <= 20) return '10.1 - 20 kg';
        return 'Above 20 kg';
    }

    private handleError(error: HttpErrorResponse): Observable<never> {
        let errorMessage = 'An unknown error occurred';

        if (error.error instanceof ErrorEvent) {
            // Client-side error
            errorMessage = `Error: ${error.error.message}`;
        } else {
            // Server-side error
            switch (error.status) {
                case 400:
                    errorMessage = 'Bad request. Please check your input.';
                    break;
                case 401:
                    errorMessage = 'Unauthorized. Please log in again.';
                    break;
                case 403:
                    errorMessage = 'Forbidden. You do not have permission to perform this action.';
                    break;
                case 404:
                    errorMessage = 'User not found.';
                    break;
                case 500:
                    errorMessage = 'Internal server error. Please try again later.';
                    break;
                default:
                    errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
            }
        }

        console.error('AdminService Error:', error);
        return throwError(() => new Error(errorMessage));
    }
}
