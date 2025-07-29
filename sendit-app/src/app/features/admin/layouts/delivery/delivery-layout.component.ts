import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {SenderSearchResult} from '../../../../shared/models/users.interface';
import {AdminCreateParcelRequest, DeliveryFormData, WeightCategory} from '../../../../shared/models/parcel-interface';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {Observable, of, Subject, Subscription} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, filter, map, switchMap} from 'rxjs/operators';
import {environment} from '../../../../../environments/environment';
import {GoogleMapsService} from '../../../../shared/services/google-maps';

interface Sender {
  id: string;
  name: string;
  email: string;
  phone: string;
}



interface PlaceResult {
  address: string;
  placeId: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

type WeightCategoryValue = 'ULTRA_LIGHT' | 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'EXTRA_HEAVY' | 'FREIGHT';


@Component({
  selector: 'app-delivery',
  imports: [CommonModule, FormsModule],
  templateUrl: './delivery-layout.component.html',
  styleUrl: './delivery-layout.component.scss'
})
export class DeliveryLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('pickupAddressInput', { static: false }) pickupAddressInput!: ElementRef;
  @ViewChild('destinationAddressInput', { static: false }) destinationAddressInput!: ElementRef;

  private readonly API_URL = environment.apiUrl;
  private subscriptions = new Subscription();

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

  // Additional form fields for API integration
  selectedSender: Sender | null = null;
  senderSearchQuery: string = '';
  weight: number = 0;
  description: string = '';
  quote: number = 0;
  estimatedDeliveryTime: string = '';

  // Location fields
  pickupAddress: string = '';
  destinationAddress: string = '';
  pickupName: string = '';
  destinationName: string = '';
  selectedPickupPlace: PlaceResult | null = null;
  selectedDestinationPlace: PlaceResult | null = null;


  // Loading states
  isSubmitting: boolean = false;
  isSearchingSenders: boolean = false;
  isLoadingGoogleMaps: boolean = false;

  // Dropdown options
  senders: Sender[] = [];
  weightCategories = [
    {
      value: WeightCategory.ULTRA_LIGHT,
      label: 'Ultra Light Parcel (0 - 0.5 kg)',
      priceRange: 'KSh 150 - 300',
      minWeight: 0,
      maxWeight: 0.5,
      basePrice: 225
    },
    {
      value: WeightCategory.LIGHT,
      label: 'Light Parcel (0.6 - 2 kg)',
      priceRange: 'KSh 300 - 600',
      minWeight: 0.6,
      maxWeight: 2,
      basePrice: 450
    },
    {
      value: WeightCategory.MEDIUM,
      label: 'Medium Parcel (2.1 - 5 kg)',
      priceRange: 'KSh 600 - 1200',
      minWeight: 2.1,
      maxWeight: 5,
      basePrice: 900
    },
    {
      value: WeightCategory.HEAVY,
      label: 'Heavy Parcel (5.1 - 10 kg)',
      priceRange: 'KSh 1200 - 2500',
      minWeight: 5.1,
      maxWeight: 10,
      basePrice: 1850
    },
    {
      value: WeightCategory.EXTRA_HEAVY,
      label: 'Extra Heavy Parcel (10.1 - 20 kg)',
      priceRange: 'KSh 2500 - 5000',
      minWeight: 10.1,
      maxWeight: 20,
      basePrice: 3750
    },
    {
      value: WeightCategory.FREIGHT,
      label: 'Freight (Above 20 kg)',
      priceRange: 'KSh 5000+',
      minWeight: 20.1,
      maxWeight: 1000,
      basePrice: 5000
    }
  ];

  arrivalTimeOptions = ['3 Hrs', '10 Hrs', '1 Day', '3 Days +'];

  // Dropdown states
  showSenderDropdown: boolean = false;
  showWeightDropdown: boolean = false;

  // Search subject for debouncing (increased debounce time)
  private senderSearchSubject = new Subject<string>();

  // Google Places autocomplete instances
  private pickupAutocomplete: google.maps.places.Autocomplete | null = null;
  private destinationAutocomplete: google.maps.places.Autocomplete | null = null;

  constructor(
    private http: HttpClient,
    private googleMapsService: GoogleMapsService
  ) {}

  ngOnInit(): void {
    this.setupSenderSearch();
    this.initializeGooglePlaces();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Setup sender search with optimized debouncing
  setupSenderSearch(): void {
    const searchSubscription = this.senderSearchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      filter(query => query.trim().length >= 2), // Only search if query is at least 2 characters
      switchMap(query => {
        console.log('Searching for:', query);
        this.isSearchingSenders = true;
        return this.searchSenders(query);
      })
    ).subscribe({
      next: (senders) => {
        this.senders = senders;
        this.isSearchingSenders = false;
        // Keep dropdown open if we have results or if still searching
        if (senders.length > 0 || this.senderSearchQuery.length >= 2) {
          this.showSenderDropdown = true;
        }
      },
      error: (error) => {
        console.error('Sender search error:', error);
        this.senders = [];
        this.isSearchingSenders = false;
        this.showSenderDropdown = true;
      }
    });

    this.subscriptions.add(searchSubscription);
  }

  // Search senders from backend with better error handling
  searchSenders(query: string): Observable<Sender[]> {
    if (!query || query.trim().length < 2) {
      return of([]);
    }

    const cleanQuery = query.trim();
    return this.http.get<{data: SenderSearchResult[]}>(`${this.API_URL}/admin/senders/search?query=${encodeURIComponent(cleanQuery)}`).pipe(
      map(response => {
        // Ensure we always return an array

        const data = response?.data || [];
        console.log('Sender search results:', data); // Debug log
        return data.map(sender => ({
          id: sender.id,
          name: sender.name,
          email: sender.email,
          phone: sender.phone
        }));
      }),
      catchError(error => {
        console.error('Error searching senders:', error);
        return of([]);
      })
    );
  }

  // Initialize Google Places autocomplete
  async initializeGooglePlaces(): Promise<void> {
    try {
      this.isLoadingGoogleMaps = true;
      await this.googleMapsService.loadGoogleMaps();

      // Wait for view to be ready
      setTimeout(() => {
        this.setupPickupAutocomplete();
        this.setupDestinationAutocomplete();
        this.isLoadingGoogleMaps = false;
      }, 100);
    } catch (error) {
      console.error('Failed to load Google Maps:', error);
      this.isLoadingGoogleMaps = false;
    }
  }

  // Setup pickup location autocomplete
  setupPickupAutocomplete(): void {
    if (!this.pickupAddressInput?.nativeElement) return;

    const options: google.maps.places.AutocompleteOptions = {
      componentRestrictions: { country: 'KE' },
      fields: ['place_id', 'formatted_address', 'geometry'],
      types: ['establishment', 'geocode']
    };

    this.pickupAutocomplete = new google.maps.places.Autocomplete(
      this.pickupAddressInput.nativeElement,
      options
    );

    this.pickupAutocomplete.addListener('place_changed', () => {
      const place = this.pickupAutocomplete!.getPlace();
      if (place.formatted_address && place.place_id) {
        if (!place.geometry?.location) return;

        this.selectedPickupPlace = {
          address: place.formatted_address,
          placeId: place.place_id,
          coordinates: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          }
        };

        this.pickupAddress = place.formatted_address;
        this.formData.pickupLocation = place.formatted_address;
      }
    });

  }

  // Setup destination location autocomplete
  setupDestinationAutocomplete(): void {
    if (!this.destinationAddressInput?.nativeElement) return;

    const options: google.maps.places.AutocompleteOptions = {
      componentRestrictions: { country: 'KE' },
      fields: ['place_id', 'formatted_address', 'geometry'],
      types: ['establishment', 'geocode']
    };

    this.destinationAutocomplete = new google.maps.places.Autocomplete(
      this.destinationAddressInput.nativeElement,
      options
    );

    this.destinationAutocomplete.addListener('place_changed', () => {
      const place = this.destinationAutocomplete!.getPlace();
      if (place.formatted_address && place.place_id) {
        if (!place.geometry?.location) return;

        this.selectedDestinationPlace = {
          address: place.formatted_address,
          placeId: place.place_id,
          coordinates: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          }
        };

        this.destinationAddress = place.formatted_address;
        this.formData.deliveryLocation = place.formatted_address;
      }
    });

  }

  // Handle sender search input with optimized debouncing
  onSenderSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const query = target.value.trim();

    this.senderSearchQuery = query;

    // Clear previous results if query is too short
    if (query.length < 2) {
      this.senders = [];
      this.showSenderDropdown = false;
      this.isSearchingSenders = false;
      return;
    }

    // Show dropdown immediately
    this.showSenderDropdown = true;

    // Trigger debounced search
    this.senderSearchSubject.next(query);
  }

  // Handle sender selection
  onSenderSelect(sender: Sender): void {
    this.selectedSender = sender;
    this.formData.sender = sender.name;
    this.senderSearchQuery = sender.name;
    this.showSenderDropdown = false;
  }

  // Handle weight category selection with auto-calculation
  onWeightCategorySelect(category: any): void {
    this.formData.weightCategory = category.value.toUpperCase() as WeightCategoryValue;
    this.showWeightDropdown = false;

    // Auto-set weight to middle of range and calculate quote
    this.weight = (category.minWeight + category.maxWeight) / 2;
    this.calculateQuote();
  }

  // Calculate quote based on weight and category
  calculateQuote(): void {
    const selectedCategory = this.getSelectedWeightCategory();
    if (selectedCategory && this.weight > 0) {
      // Calculate price based on weight within category range
      const weightRatio = (this.weight - selectedCategory.minWeight) / (selectedCategory.maxWeight - selectedCategory.minWeight);
      const priceVariation = selectedCategory.basePrice * 0.3; // 30% variation within range
      this.quote = Math.round((selectedCategory.basePrice + (priceVariation * weightRatio)) * 100) / 100;
    }
  }

  // Get selected weight category details
  getSelectedWeightCategory(): any {
    return this.weightCategories.find(cat => cat.value.toUpperCase() === this.formData.weightCategory);
  }

  // Handle arrival time selection
  onArrivalTimeSelect(time: string): void {
    this.formData.arrivalTime = time;
    this.calculateEstimatedDeliveryTime(time);
  }

  // Calculate estimated delivery time
  calculateEstimatedDeliveryTime(arrivalTime: string): void {
    const now = new Date();
    let deliveryDate = new Date(now);

    switch (arrivalTime) {
      case '3 Hrs':
        deliveryDate.setHours(now.getHours() + 3);
        break;
      case '10 Hrs':
        deliveryDate.setHours(now.getHours() + 10);
        break;
      case '1 Day':
        deliveryDate.setDate(now.getDate() + 1);
        break;
      case '3 Days +':
        deliveryDate.setDate(now.getDate() + 3);
        break;
    }

    this.estimatedDeliveryTime = deliveryDate.toISOString();
  }

  // Form validation
  isFormValid(): boolean {
    return !!(
      this.selectedSender &&
      this.formData.receiver &&
      this.formData.emailAddress &&
      this.formData.receiverNo &&
      this.pickupName &&
      this.selectedPickupPlace &&
      this.selectedPickupPlace.coordinates &&
      this.destinationName &&
      this.selectedDestinationPlace &&
      this.selectedDestinationPlace.coordinates &&
      this.formData.weightCategory &&
      this.weight > 0 &&
      this.quote >= 0
    );
  }

  // Handle form submission
  onSubmit(): void {
    if (!this.isFormValid()) {
      alert('Please fill in all required fields');
      return;
    }

    if (!this.selectedSender || !this.selectedPickupPlace || !this.selectedDestinationPlace) {
      alert('Please complete all selections');
      return;
    }

    this.isSubmitting = true;

    // Prepare data for backend API
    const parcelData: AdminCreateParcelRequest = {
      senderId: this.selectedSender.id,
      senderPhone: this.selectedSender.phone,
      receiverName: this.formData.receiver,
      receiverPhone: this.formData.receiverNo,
      receiverEmail: this.formData.emailAddress,
      weight: this.weight,
      weightCategory: this.formData.weightCategory as 'ULTRA_LIGHT' | 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'EXTRA_HEAVY' | 'FREIGHT',
      description: this.description || undefined,
      pickupLocation: {
        name: this.pickupName,
        address: this.selectedPickupPlace.address,
        latitude: this.selectedPickupPlace.coordinates?.lat || 0,
        longitude: this.selectedPickupPlace.coordinates?.lng || 0,
        placeId: this.selectedPickupPlace.placeId
      },
      destinationLocation: {
        name: this.destinationName,
        address: this.selectedDestinationPlace.address,
        latitude: this.selectedDestinationPlace.coordinates?.lat || 0,
        longitude: this.selectedDestinationPlace.coordinates?.lng || 0,
        placeId: this.selectedDestinationPlace.placeId
      },
      quote: this.quote,
      currency: 'KES',
      estimatedDeliveryTime: this.estimatedDeliveryTime || undefined
    };

    console.log('Sending weight category:', this.formData.weightCategory);
    console.log('Full parcel data:', JSON.stringify(parcelData, null, 2));

    // Call the parcel creation service
    this.createParcel(parcelData).subscribe({
      next: (response) => {
        console.log('Parcel created successfully:', response);
        alert('Order placed successfully!');
        this.resetForm();
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error creating parcel:', error);
        alert('Failed to place order. Please try again.');
        this.isSubmitting = false;
      }
    });
  }

  // Create parcel API call
  createParcel(parcelData: AdminCreateParcelRequest): Observable<any> {
    return this.http.post<{ data: any }>(`${this.API_URL}/admin/parcels`, parcelData).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('API Error:', error);
        throw error;
      })
    );
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

    this.selectedSender = null;
    this.senderSearchQuery = '';
    this.weight = 0;
    this.description = '';
    this.quote = 0;
    this.estimatedDeliveryTime = '';
    this.senders = [];

    // Reset location fields
    this.pickupAddress = '';
    this.destinationAddress = '';
    this.pickupName = '';
    this.destinationName = '';
    this.selectedPickupPlace = null;
    this.selectedDestinationPlace = null;

    // Clear autocomplete inputs
    if (this.pickupAddressInput?.nativeElement) {
      this.pickupAddressInput.nativeElement.value = '';
    }
    if (this.destinationAddressInput?.nativeElement) {
      this.destinationAddressInput.nativeElement.value = '';
    }
  }

  // Handle weight input change
  onWeightChange(): void {
    this.calculateQuote();
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
