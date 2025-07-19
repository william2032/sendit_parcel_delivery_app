import {Component, Input, Output, EventEmitter, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-otp-modal',
  imports: [
    NgIf,
    ReactiveFormsModule,
    NgForOf
  ],
  templateUrl: './otp-modal-layout.component.html',
  styleUrl: './otp-modal-layout.component.scss'
})
export class OtpModalLayoutComponent implements OnInit {
  @Input() isVisible: boolean = false;
  @Input() phoneNumber: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() verify = new EventEmitter<string>();
  @Output() resend = new EventEmitter<void>();

  otpForm: FormGroup;
  digits: string[] = ['', '', '', '', ''];
  isLoading: boolean = false;
  errorMessage: string = '';
  isResendDisabled: boolean = false;
  resendTimer: number = 0;

  constructor(private fb: FormBuilder) {
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]]
    });
  }

  ngOnInit() {
    // Auto-focus first input when modal opens
    if (this.isVisible) {
      setTimeout(() => {
        const firstInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (firstInput) firstInput.focus();
      }, 100);
    }
  }

  get isOtpComplete(): boolean {
    return this.digits.every(digit => digit !== '') && this.digits.join('').length === 5;
  }

  onDigitInput(event: any, index: number) {
    const value = event.target.value.replace(/\D/g, ''); // Only allow digits

    if (value) {
      this.digits[index] = value.charAt(0);

      // Move to next input
      if (index < 4) {
        const nextInput = event.target.nextElementSibling;
        if (nextInput) nextInput.focus();
      }
    } else {
      this.digits[index] = '';
    }

    this.clearError();
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    // Handle backspace
    if (event.key === 'Backspace' && !this.digits[index] && index > 0) {
      const prevInput = (event.target as HTMLElement).previousElementSibling as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        this.digits[index - 1] = '';
      }
    }

    // Handle arrow keys
    if (event.key === 'ArrowLeft' && index > 0) {
      const prevInput = (event.target as HTMLElement).previousElementSibling as HTMLInputElement;
      if (prevInput) prevInput.focus();
    }

    if (event.key === 'ArrowRight' && index < 4) {
      const nextInput = (event.target as HTMLElement).nextElementSibling as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  }

  onPaste(event: ClipboardEvent, index: number) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text').replace(/\D/g, '') || '';

    if (pastedData.length >= 5) {
      // Fill all inputs with pasted data
      for (let i = 0; i < 5; i++) {
        this.digits[i] = pastedData.charAt(i) || '';
      }

      // Focus last filled input
      const lastIndex = Math.min(4, pastedData.length - 1);
      const inputs = document.querySelectorAll('input[type="text"]') as NodeListOf<HTMLInputElement>;
      if (inputs[lastIndex]) inputs[lastIndex].focus();
    }
  }

  onSubmit() {
    if (this.isOtpComplete) {
      this.isLoading = true;
      const otpCode = this.digits.join('');
      this.verify.emit(otpCode);
    }
  }

  resendCode() {
    if (!this.isResendDisabled) {
      this.startResendTimer();
      this.resend.emit();
      this.clearError();
    }
  }

  startResendTimer() {
    this.isResendDisabled = true;
    this.resendTimer = 30;

    const timer = setInterval(() => {
      this.resendTimer--;
      if (this.resendTimer <= 0) {
        this.isResendDisabled = false;
        clearInterval(timer);
      }
    }, 1000);
  }

  closeModal() {
    this.close.emit();
    this.resetForm();
  }

  resetForm() {
    this.digits = ['', '', '', '', ''];
    this.isLoading = false;
    this.errorMessage = '';
  }

  clearError() {
    this.errorMessage = '';
  }

  // Method to be called from parent component when verification fails
  setError(message: string) {
    this.errorMessage = message;
    this.isLoading = false;
  }

  // Method to be called from parent component when verification succeeds
  onVerificationSuccess() {
    this.isLoading = false;
    this.closeModal();
  }

}
