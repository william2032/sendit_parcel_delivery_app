import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {SendOtpResponse, VerifyOtpResponse} from '../models/otp.interface';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OtpService {
  private readonly baseUrl = 'http://localhost:3000/api'; // Adjust to your NestJS backend URL

  constructor(private http: HttpClient) {}

  /**
   * Send OTP to phone number
   */
  sendOtp(phoneNumber: string): Observable<SendOtpResponse> {
    return this.http.post<SendOtpResponse>(`${this.baseUrl}/otp/send`, {
      phoneNumber
    });
  }

  /**
   * Verify OTP code
   */
  verifyOtp(phoneNumber: string, otp: string, sessionId?: string): Observable<VerifyOtpResponse> {
    return this.http.post<VerifyOtpResponse>(`${this.baseUrl}/otp/verify`, {
      phoneNumber,
      otp,
      sessionId
    });
  }

  /**
   * Resend OTP to phone number
   */
  resendOtp(phoneNumber: string): Observable<SendOtpResponse> {
    return this.http.post<SendOtpResponse>(`${this.baseUrl}/otp/resend`, {
      phoneNumber
    });
  }
}
