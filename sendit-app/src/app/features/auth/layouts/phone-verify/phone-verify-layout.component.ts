import {Component, ViewChild} from '@angular/core';
import {OtpService} from '../../../../shared/services/otp.service';
import {OtpModalLayoutComponent} from '../otp-modal/otp-modal-layout.component';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-phone-verify',
  imports: [
    FormsModule, CommonModule, OtpModalLayoutComponent],
  templateUrl: './phone-verify-layout.component.html',
  styleUrl: './phone-verify-layout.component.scss'
})
export class PhoneVerifyLayoutComponent {
  phoneNumber: string = '';
  selectedCountryCode: string = '+254';
  showOtpModal: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  sessionId: string = '';

  constructor(private otpService: OtpService) {
  }

  get fullPhoneNumber(): string {
    return `${this.selectedCountryCode}${this.phoneNumber}`;
  }

  sendOtp() {
    if (!this.phoneNumber.trim()) {
      this.errorMessage = 'Please enter a valid phone number';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.otpService.sendOtp(this.fullPhoneNumber).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.sessionId = response.sessionId || '';
          this.showOtpModal = true;
        } else {
          this.errorMessage = response.message;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to send OTP. Please try again.';
        console.error('Send OTP error:', error);
      }
    });
  }

  onOtpVerify(otp: string) {
    this.otpService.verifyOtp(this.fullPhoneNumber, otp, this.sessionId).subscribe({
      next: (response) => {
        if (response.success) {
          // Handle successful verification
          console.log('OTP verified successfully:', response);
          // Store token if provided
          if (response.token) {
            localStorage.setItem('authToken', response.token);
          }
          // Close modal and redirect or show success
          this.otpModal.onVerificationSuccess();
          this.showSuccessMessage();
        } else {
          // Show error in modal
          this.otpModal.setError(response.message);
        }
      },
      error: (error) => {
        console.error('Verify OTP error:', error);
        this.otpModal.setError('Verification failed. Please try again.');
      }
    });
  }

  onOtpResend() {
    this.otpService.resendOtp(this.fullPhoneNumber).subscribe({
      next: (response) => {
        if (response.success) {
          this.sessionId = response.sessionId || '';
          // Show success message for resend
        } else {
          this.otpModal.setError('Failed to resend OTP');
        }
      },
      error: (error) => {
        console.error('Resend OTP error:', error);
        this.otpModal.setError('Failed to resend OTP');
      }
    });
  }

  onModalClose() {
    this.showOtpModal = false;
  }

  private showSuccessMessage() {
    alert('Phone number verified successfully!');
    // Redirect to dashboard or next step
  }

  // ViewChild reference for accessing modal methods
  @ViewChild('otpModal') otpModal!: OtpModalLayoutComponent;
}
