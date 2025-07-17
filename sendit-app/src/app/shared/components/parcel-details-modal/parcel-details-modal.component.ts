import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import {Parcel} from '../../models/parcel-interface';

@Component({
  selector: 'app-parcel-details-modal',
  imports: [CommonModule],
  templateUrl: './parcel-details-modal.component.html',
  styleUrl: './parcel-details-modal.component.scss',
  animations: [
    trigger('backdropAnimation', [
      state('void', style({ opacity: 0 })),
      state('visible', style({ opacity: 1 })),
      transition('void => visible', animate('200ms ease-out')),
      transition('visible => void', animate('150ms ease-in'))
    ]),
    trigger('modalAnimation', [
      state('void', style({
        opacity: 0,
        transform: 'scale(0.8) translateY(-100px)'
      })),
      state('visible', style({
        opacity: 1,
        transform: 'scale(1) translateY(0)'
      })),
      transition('void => visible', animate('300ms cubic-bezier(0.34, 1.56, 0.64, 1)')),
      transition('visible => void', animate('200ms ease-in'))
    ]),
    trigger('contentAnimation', [
      state('void', style({ opacity: 0 })),
      state('visible', style({ opacity: 1 })),
      transition('void => visible', animate('400ms 200ms ease-out'))
    ])
  ]

})
export class ParcelDetailsModalComponent implements OnInit, OnDestroy {
  @Input() parcel: Parcel | null = null;
  @Input() isVisible: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() trackPackage = new EventEmitter<Parcel>();

  isLoading: boolean = false;
  animationState: string = 'void';

  ngOnInit() {
    if (this.isVisible) {
      this.show();
    }
  }

  ngOnDestroy() {
    document.body.classList.remove('overflow-hidden');
  }

  ngOnChanges() {
    if (this.isVisible && this.parcel) {
      this.show();
    } else if (!this.isVisible) {
      this.hide();
    }
  }

  show() {
    this.isLoading = true;
    document.body.classList.add('overflow-hidden');

    setTimeout(() => {
      this.isLoading = false;
      this.animationState = 'visible';
    }, 500);
  }

  hide() {
    this.animationState = 'void';
    document.body.classList.remove('overflow-hidden');

    // Delay the actual closing to allow animation to complete
    setTimeout(() => {
      this.close.emit();
    }, 200);
  }

  closeModal() {
    this.hide();
  }

  onBackdropClick() {
    this.closeModal();
  }

  onTrackPackage() {
    if (this.parcel) {
      this.trackPackage.emit(this.parcel);
    }
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'picked':
        return 'bg-blue-100 text-blue-800';
      case 'in transit':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getWeightCategory(weight: number): string {
    if (weight <= 0.5) return 'Ultra Light Parcel';
    if (weight <= 2) return 'Light Parcel';
    if (weight <= 5) return 'Medium Parcel';
    if (weight <= 10) return 'Heavy Parcel';
    if (weight <= 20) return 'Extra Heavy Parcel';
    return 'Freight';
  }

  getEstimatedQuote(weight: number): string {
    if (weight <= 0.5) return 'KES 150 – 200';
    if (weight <= 2) return 'KES 250 – 400';
    if (weight <= 5) return 'KES 500 – 800';
    if (weight <= 10) return 'KES 900 – 1,200';
    if (weight <= 20) return 'KES 1,300 – 1,800';
    return 'KES 1,900 – 3,500';
  }
}
