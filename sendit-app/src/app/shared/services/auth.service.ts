import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, BehaviorSubject, throwError, Subject} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';
import {Router} from '@angular/router';
import {environment} from '../../../environments/environment';
import {
  AuthResponse, ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest, User
} from '../models/user.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  private logoutSubject = new Subject<void>();
  private accessToken: string | null = null;
  private userId: string | null = null;

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })

  };
  // In your auth service


  constructor(private http: HttpClient, private router: Router) {
    // Check if user is already logged in
    this.loadUserFromStorage();
  }

  // Store tokens after registration
  setAuthData(accessToken: string, userId: string): void {
    this.accessToken = accessToken;
    this.userId = userId;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('userId', userId);
  }

  clearAuthData(): void {
    this.accessToken = null;
    this.userId = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
  }
  get logout$(): Observable<void> {
    return this.logoutSubject.asObservable();
  }

  get currentUser$(): Observable<User | null> {
    return this.userSubject.asObservable();
  }

  getHttpOptions(): any {
    return this.httpOptions;
  }

  // Login method
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials, this.httpOptions)
      .pipe(
        tap(response => {
          this.setSession(response);
          this.userSubject.next(response.user);

          const role = response.user.role?.toUpperCase();

          if (role === 'ADMIN') {
            this.router.navigate(['/auth/admin/dashboard']);
          } else {
            this.router.navigate(['/']);
          }
        }),
        catchError(this.handleError)
      );
  }


  // Register method
  register(userData: RegisterRequest): Observable<AuthResponse> {
    const fixedUserData = {
      ...userData,
    };
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/register`, fixedUserData, this.httpOptions)
      .pipe(
        tap(response => {
          this.setSession(response);
        }),
        catchError(this.handleError)
      );
  }

  // Forgot password method
  forgotPassword(data: ForgotPasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/auth/forgot-password`, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Reset password method
  resetPassword(data: ResetPasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/auth/reset-password`, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Logout method
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('token_expires_at');
    this.userSubject.next(null);
    this.logoutSubject.next();
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    const token = localStorage.getItem('access_token');
    const expiresAt = localStorage.getItem('token_expires_at');

    if (!token || !expiresAt) {
      return false;
    }

    const now = new Date().getTime();
    const expiration = parseInt(expiresAt);

    if (now >= expiration) {
      this.logout();
      return false;
    }

    return true;
  }

  // Get authorization token
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // Private methods
  private setSession(authResult: AuthResponse): void {
    const expiresAt = new Date().getTime() + (authResult.expires_in * 1000);

    localStorage.setItem('access_token', authResult.access_token);
    localStorage.setItem('user', JSON.stringify(authResult.user));
    localStorage.setItem('token_expires_at', expiresAt.toString());

    this.userSubject.next(authResult.user);
  }

  private loadUserFromStorage(): void {
    if (this.isLoggedIn()) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        this.userSubject.next(user);
      }
    }
  }

  // New OTP verification method
  verifyOtp(otp: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.accessToken || localStorage.getItem('accessToken')}`
    });
    const body = {
      userId: this.userId || localStorage.getItem('userId'),
      otp
    };
    return this.http.post(`${this.API_URL}/auth/verify-email`, body, { headers });
  }

  resendOtp(): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.accessToken || localStorage.getItem('accessToken')}`
    });
    const body = {
      userId: this.userId || localStorage.getItem('userId')
    };
    return this.http.post(`${this.API_URL}/auth/resend-otp`, body, { headers });
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
