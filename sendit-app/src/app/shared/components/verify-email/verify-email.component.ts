import {
  Component, EventEmitter, Input, Output,
  OnInit, ViewChild, ElementRef, AfterViewInit, ViewChildren, QueryList, OnDestroy
} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    NgForOf
  ]
})
export class VerifyEmailComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('input') inputRefs!: QueryList<ElementRef>;
  @Input() email: string = '';
  @Input() isVisible: boolean = false;
  @Output() otpSubmit = new EventEmitter<string>();
  @Output() resendRequest = new EventEmitter<void>();
  @Output() closeModal = new EventEmitter<void>();

  @ViewChild('input1') input1!: ElementRef;

  otpForm: FormGroup;
  countdown: number = 60;
  canResend: boolean = false;
  private countdownInterval: any;
  isLoading = false;

  constructor(private fb: FormBuilder) {
    this.otpForm = this.fb.group({
      digit1: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit2: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit3: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit4: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit5: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit6: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    });
  }

  ngOnInit(): void {
    this.startCountdown();
  }

  ngAfterViewInit(): void {
    if (this.isVisible) {
      setTimeout(() => this.input1?.nativeElement?.focus(), 100);
    }
  }

  onDigitInput(event: any, index: number): void {
    const value: string = event.target.value;
    const inputs = this.inputRefs.toArray();
    if (value.length > 1) {
      event.target.value = value.slice(-1);
    }
    if (/^\d$/.test(event.target.value) && inputs[index + 1]) {
      inputs[index + 1].nativeElement.focus();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    const input = event.currentTarget as HTMLInputElement;
    const inputs = this.inputRefs.toArray();
    if (event.key === 'Backspace' && !input.value && index > 0) {
      const prevInput = inputs[index - 1];
      prevInput.nativeElement.focus();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const data = event.clipboardData?.getData('text')?.replace(/\D/g, '')?.slice(0, 6) ?? '';
    if (data.length === 6) {
      this.otpForm.patchValue({
        digit1: data[0],
        digit2: data[1],
        digit3: data[2],
        digit4: data[3],
        digit5: data[4],
        digit6: data[5],
      });
    }
  }

  verifyOtp(): void {
    if (this.otpForm.valid) {
      const otp = Object.values(this.otpForm.value).join('');
      this.otpSubmit.emit(otp);
    }
  }

  onResendCode(): void {
    if (this.canResend) {
      this.canResend = false;
      this.countdown = 60;
      this.startCountdown();
      this.otpForm.reset();
      this.resendRequest.emit();
    }
  }

  startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.canResend = true;
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }

  onClose(): void {
    clearInterval(this.countdownInterval);
    this.closeModal.emit();
  }

  ngOnDestroy(): void {
    clearInterval(this.countdownInterval);
  }
}
