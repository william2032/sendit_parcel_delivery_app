import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, ActivatedRoute, RouterLink} from '@angular/router';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {NgForOf, NgIf, NgSwitch, NgSwitchCase} from '@angular/common';
import {LoginRequest,ForgotPasswordRequest, RegisterRequest, ResetPasswordRequest} from '../../shared/models/user.models';
import {AuthService} from '../../shared/services/auth.service';
import {VerifyEmailComponent} from '../../shared/components/verify-email/verify-email.component';


@Component({
  selector: 'app-auth',
  standalone: true,
  templateUrl: './auth.component.html',
  imports: [
    NgSwitch,
    NgSwitchCase,
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    VerifyEmailComponent
  ],
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private modalCloseCount = 0;
  private maxModalAttempts = 3;
  private modalReopenTimeout: any;

  // Form modes
  currentMode: string | null = 'login';
  userEmail = '';

  // Forms
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  forgotPasswordForm!: FormGroup;
  resetPasswordForm!: FormGroup;

  // State
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  errorMessage = '';
  successMessage = '';
  showOtpModal = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
  }

  ngOnInit(): void {
    //Read mode from route data
    this.route.data.subscribe(data => {
      const mode = data['mode'] as 'login' | 'register' | 'forgot-password' | 'reset-password';
      if (mode) {
        this.currentMode = mode;
      }
    });

    this.initializeForms();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    // Login form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Register form
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      phone: [''],
      city: ['', [Validators.required, Validators.minLength(2)]],
      country: ['Kenya', [Validators.required, Validators.minLength(2)]]
    }, {validators: this.passwordMatchValidator});


    // Forgot password form
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    // Reset password form
    this.resetPasswordForm = this.fb.group({
      token: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {validators: this.passwordMatchValidator});
  }

  // Custom validator for password matching
  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({passwordMismatch: true});
      return {passwordMismatch: true};
    }
    return null;
  }

  // Mode switching methods
  switchToLogin(): void {
    this.currentMode = 'login';
    this.router.navigate(['/login']);
    this.clearMessages();
  }

  switchToRegister(): void {
    this.currentMode = 'register';
    this.router.navigate(['/register']);
    this.clearMessages();
  }

  switchToForgotPassword(): void {
    this.currentMode = 'forgot-password';
    this.router.navigate(['/forgot-password']);
    this.clearMessages();
  }

  switchToResetPassword(): void {
    this.currentMode = 'reset-password';
    this.router.navigate(['/reset-password']);
    this.clearMessages();
  }

  onClose() {
    this.currentMode = null;
    this.router.navigate(['/']);
    this.loginForm.reset(); // Reset forms
    this.registerForm.reset();
    this.forgotPasswordForm.reset();
    this.resetPasswordForm.reset();
  }

  // Form submission methods
  onLogin(): void {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.clearMessages();

      const credentials: LoginRequest = this.loginForm.value;

      this.authService.login(credentials)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.successMessage = response.message;
            // Redirect to dashboard or previous page
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.message;
          }
        });
    }
  }

  onRegister(): void {
    if (this.registerForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.clearMessages();
      const formValue: RegisterRequest = this.registerForm.getRawValue();

      const userData: RegisterRequest = {
        name: formValue.name,
        email: formValue.email,
        password: formValue.password,
        phone: formValue.phone,
        city: formValue.city,
        country: formValue.country,
      };

      this.authService.register(userData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            if (response.message.includes('successful')) {
              this.authService.setAuthData(response.access_token, response.user.id);
              this.showOtpModal = true;
              this.successMessage = 'Registration successful! Please verify your email.';
              this.registerForm.reset({ country: 'Kenya' });
            } else {
              this.errorMessage = response.message || 'Registration failed. Please try again.';
            }
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
          }
        });
    }
  }

  onForgotPassword(): void {
    if (this.forgotPasswordForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.clearMessages();

      const data: ForgotPasswordRequest = this.forgotPasswordForm.value;

      this.authService.forgotPassword(data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.successMessage = response.message;
            // Switch to reset password mode after sending email
            setTimeout(() => {
              this.switchToResetPassword();
            }, 2000);
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.message;
          }
        });
    }
  }

  onResetPassword(): void {
    if (this.resetPasswordForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.clearMessages();

      const data: ResetPasswordRequest = this.resetPasswordForm.value;

      this.authService.resetPassword(data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.successMessage = response.message;
            // Switch to login mode after successful reset
            setTimeout(() => {
              this.switchToLogin();
            }, 2000);
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.message;
          }
        });
    }
  }



  // Utility methods
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }


  // Form validation helpers
  isFieldInvalid(formName: string, fieldName: string): boolean {
    const form = this.getForm(formName);
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(formName: string, fieldName: string): string {
    const form = this.getForm(formName);
    const field = form.get(fieldName);

    if (field && field.errors) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['passwordMismatch']) {
        return 'Passwords do not match';
      }
    }

    return '';
  }

  private getForm(formName: string): FormGroup {
    switch (formName) {
      case 'login':
        return this.loginForm;
      case 'register':
        return this.registerForm;
      case 'forgot-password':
        return this.forgotPasswordForm;
      case 'reset-password':
        return this.resetPasswordForm;
      default:
        return this.loginForm;
    }
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'name': 'Name',
      'email': 'Email',
      'password': 'Password',
      'confirmPassword': 'Confirm Password',
      'token': 'Reset Token'
    };
    return labels[fieldName] || fieldName;
  }


  onOtpVerified(otp: string): void {
    // Call your OTP verification API
    this.authService.verifyOtp(otp)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showOtpModal = false;
            this.successMessage = 'Email verified successfully! Welcome to SendIT.';
            setTimeout(() => {
              this.router.navigate(['/home']);
            }, 2000);
          } else {
            this.errorMessage = 'Invalid verification code. Please try again.';
          }
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Invalid verification code. Please try again.';
        }
      });
  }

  onResendOtp(): void {
    this.authService.resendOtp()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.successMessage = 'New verification code sent to your email.';
        },
        error: (error) => {
          this.errorMessage = 'Failed to resend code. Please try again.';
        }
      });
  }

  onCloseOtpModal(): void {
    this.showOtpModal = false;
    this.modalCloseCount++;

    if (this.modalCloseCount < this.maxModalAttempts) {
      // Reopen modal after 3 seconds
      this.modalReopenTimeout = setTimeout(() => {
        this.showOtpModal = true;
        this.errorMessage = `Email verification is required to complete registration. Attempt ${this.modalCloseCount + 1} of ${this.maxModalAttempts}`;
      }, 3000);
    } else {
      // After 3 attempts, show final warning
      this.errorMessage = 'Email verification is required. Please verify your email to continue.';
      this.modalCloseCount = 0; // Reset for future attempts
    }
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}
