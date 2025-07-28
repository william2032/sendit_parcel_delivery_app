import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {AdminDashboardStats} from '../models/admin-dashboard.interface';
import {environment} from '../../../environments/environment';
import {UserI} from '../models/users.interface';
import {ApiResponse} from '../models/api-response.interface';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

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
    return this.http.patch<UserI>(`${this.API_URL}/users/${userId}/status`, { status }).pipe(
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
    return this.http.patch<UserI>(`${this.API_URL}/users/${userId}/role`, { role }).pipe(
      catchError(this.handleError)
    );
  }
  // Get users by status
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
