import {Component, OnInit} from '@angular/core';
import {Customer} from '../../../../shared/models/users.interface';
import {DeliveryFormData} from '../../../../shared/models/parcel-interface';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-delivery',
  imports: [CommonModule, FormsModule],
  templateUrl: './delivery-layout.component.html',
  styleUrl: './delivery-layout.component.scss'
})
export class DeliveryLayoutComponent implements OnInit {
  formData: DeliveryFormData = {
    sender: '',
    receiver: '',
    emailAddress: '',
    receiverNo: '',
    deliveryLocation: '',
    pickupLocation: '',
    arrivalTime: '1 Day',
    weightCategory: ''
  };

  // Loading states
  isSubmitting: boolean = false;
  isLoadingCustomers: boolean = false;

  // Dropdown options
  customers: Customer[] = [];
  weightCategories = [
    { value: 'ultra-light', label: 'Ultra Light Parcel (0 - 0.5 kg)', priceRange: 'KSh 150 - 300' },
    { value: 'light', label: 'Light Parcel (0.6 - 2 kg)', priceRange: 'KSh 300 - 600' },
    { value: 'medium', label: 'Medium Parcel (2.1 - 5 kg)', priceRange: 'KSh 600 - 1200' },
    { value: 'heavy', label: 'Heavy Parcel (5.1 - 10 kg)', priceRange: 'KSh 1200 - 2500' },
    { value: 'extra-heavy', label: 'Extra Heavy Parcel (10.1 - 20 kg)', priceRange: 'KSh 2500 - 5000' },
    { value: 'freight', label: 'Freight (Above 20 kg)', priceRange: 'KSh 5000+' }
  ];

  arrivalTimeOptions = ['3 Hrs', '10 Hrs', '1 Day', '3 Days +'];

  // Dropdown states
  showSenderDropdown: boolean = false;
  showWeightDropdown: boolean = false;

  constructor() {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  // Load customers from backend (mock implementation)
  loadCustomers(): void {
    this.isLoadingCustomers = true;

    // Simulate API call
    setTimeout(() => {
      this.customers = [
        { id: '1', name: 'John Doe', email: 'john.doe@email.com', phone: '+254700000001' },
        { id: '2', name: 'Jane Smith', email: 'jane.smith@email.com', phone: '+254700000002' },
        { id: '3', name: 'Mike Johnson', email: 'mike.johnson@email.com', phone: '+254700000003' },
        { id: '4', name: 'Sarah Wilson', email: 'sarah.wilson@email.com', phone: '+254700000004' },
        { id: '5', name: 'David Brown', email: 'david.brown@email.com', phone: '+254700000005' }
      ];
      this.isLoadingCustomers = false;
    }, 1000);
  }

  // Handle sender selection
  onSenderSelect(customer: Customer): void {
    this.formData.sender = customer.name;
    this.showSenderDropdown = false;
  }

  // Handle weight category selection
  onWeightCategorySelect(category: any): void {
    this.formData.weightCategory = category.value;
    this.showWeightDropdown = false;
  }

  // Get selected weight category details
  getSelectedWeightCategory(): any {
    return this.weightCategories.find(cat => cat.value === this.formData.weightCategory);
  }

  // Handle arrival time selection
  onArrivalTimeSelect(time: string): void {
    this.formData.arrivalTime = time;
  }

  // Form validation
  isFormValid(): boolean {
    return !!(
      this.formData.sender &&
      this.formData.receiver &&
      this.formData.emailAddress &&
      this.formData.receiverNo &&
      this.formData.deliveryLocation &&
      this.formData.pickupLocation &&
      this.formData.weightCategory
    );
  }

  // Handle form submission
  onSubmit(): void {
    if (!this.isFormValid()) {
      alert('Please fill in all required fields');
      return;
    }

    this.isSubmitting = true;

    // Prepare data for backend
    const orderData = {
      sender: this.formData.sender,
      receiver: this.formData.receiver,
      receiverEmail: this.formData.emailAddress,
      receiverPhone: this.formData.receiverNo,
      deliveryAddress: this.formData.deliveryLocation,
      pickupAddress: this.formData.pickupLocation,
      estimatedArrival: this.formData.arrivalTime,
      weightCategory: this.formData.weightCategory,
      createdAt: new Date().toISOString(),
      status: 'Pending'
    };

    // Simulate API call
    setTimeout(() => {
      console.log('Order submitted:', orderData);

      // Reset form on success
      this.resetForm();
      this.isSubmitting = false;

      // Show success message (you can implement a toast notification here)
      alert('Order placed successfully!');
    }, 2000);
  }

  // Reset form
  resetForm(): void {
    this.formData = {
      sender: '',
      receiver: '',
      emailAddress: '',
      receiverNo: '',
      deliveryLocation: '',
      pickupLocation: '',
      arrivalTime: '1 Day',
      weightCategory: ''
    };
  }

  // Close dropdowns when clicking outside
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-container')) {
      this.showSenderDropdown = false;
      this.showWeightDropdown = false;
    }
  }
}
