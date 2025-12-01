// API-specific types for Maxed Homes Property Rental System

import type { 
  Property, 
  Booking, 
  Guest, 
  User, 
  PropertyFilters, 
  BookingFilters, 
  GuestFilters,
  SearchParams 
} from './index';

// Base API response structure
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp: Date;
  requestId?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: Date;
  requestId?: string;
}

// Property API types
export interface PropertyListResponse extends PaginatedResponse<Property> {
  filters?: PropertyFilters;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PropertyDetailResponse extends ApiResponse<Property> {
  relatedProperties?: Property[];
  availability?: PropertyAvailabilityResponse;
}

export interface PropertyAvailabilityResponse {
  propertyId: string;
  availableDates: Date[];
  unavailableDates: Date[];
  priceOverrides: PriceOverride[];
  minimumNights: number;
  maximumNights?: number;
}

export interface PriceOverride {
  date: Date;
  price: number;
  reason?: string;
}

export interface CreatePropertyRequest {
  title: string;
  description: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  areaSqft?: number;
  pricePerNight: number;
  cleaningFee?: number;
  securityDeposit?: number;
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  amenities?: string[];
  houseRules?: string;
  checkInTime?: string;
  checkOutTime?: string;
  minimumNights?: number;
  maximumNights?: number;
  isFeatured?: boolean;
}

export interface UpdatePropertyRequest extends Partial<CreatePropertyRequest> {
  id: string;
}

// Booking API types
export interface BookingListResponse extends PaginatedResponse<Booking> {
  filters?: BookingFilters;
  summary?: BookingSummary;
}

export interface BookingDetailResponse extends ApiResponse<Booking> {
  property: Property;
  guest: Guest;
  host: User;
  timeline?: BookingTimeline[];
}

export interface BookingSummary {
  totalBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  statusBreakdown: Record<string, number>;
}

export interface BookingTimeline {
  id: string;
  action: string;
  timestamp: Date;
  description: string;
  userId: string;
  userType: 'guest' | 'host' | 'admin';
}

export interface CreateBookingRequest {
  propertyId: string;
  checkInDate: Date;
  checkOutDate: Date;
  guestsCount: number;
  specialRequests?: string;
  guestInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export interface UpdateBookingRequest {
  id: string;
  status?: string;
  specialRequests?: string;
  cancellationReason?: string;
}

export interface BookingAvailabilityRequest {
  propertyId: string;
  checkInDate: Date;
  checkOutDate: Date;
  guestsCount: number;
}

export interface BookingAvailabilityResponse {
  isAvailable: boolean;
  totalNights: number;
  pricing: {
    basePrice: number;
    cleaningFee: number;
    securityDeposit: number;
    taxes: number;
    serviceFee: number;
    totalAmount: number;
    currency: string;
  };
  restrictions?: {
    minimumNights: number;
    maximumNights?: number;
    maxGuests: number;
  };
}

// Guest API types
export interface GuestListResponse extends PaginatedResponse<Guest> {
  filters?: GuestFilters;
  summary?: GuestSummary;
}

export interface GuestDetailResponse extends ApiResponse<Guest> {
  bookingHistory?: Booking[];
  preferences?: GuestPreferences;
  verificationStatus?: VerificationStatus;
}

export interface GuestSummary {
  totalGuests: number;
  activeGuests: number;
  verifiedGuests: number;
  newGuestsThisMonth: number;
}

export interface CreateGuestRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  preferences?: {
    propertyTypes?: string[];
    amenities?: string[];
    maxPrice?: number;
    minRating?: number;
    notifications?: {
      email: boolean;
      sms: boolean;
      push: boolean;
      marketing: boolean;
    };
  };
}

export interface UpdateGuestRequest extends Partial<CreateGuestRequest> {
  id: string;
}

// Search API types
export interface SearchResponse extends PaginatedResponse<Property> {
  query: string;
  filters: PropertyFilters;
  suggestions?: SearchSuggestion[];
  facets?: SearchFacets;
}

export interface SearchSuggestion {
  id: string;
  type: 'property' | 'location' | 'amenity';
  text: string;
  count?: number;
}

export interface SearchFacets {
  propertyTypes: FacetItem[];
  amenities: FacetItem[];
  cities: FacetItem[];
  priceRanges: FacetItem[];
  ratings: FacetItem[];
}

export interface FacetItem {
  value: string;
  count: number;
  selected?: boolean;
}

// Authentication API types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse extends ApiResponse<{
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}> {}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: 'host' | 'guest';
  termsAccepted: boolean;
}

export interface RegisterResponse extends ApiResponse<{
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}> {}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse extends ApiResponse<{
  token: string;
  refreshToken: string;
  expiresIn: number;
}> {}

// File upload API types
export interface FileUploadResponse extends ApiResponse<{
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}> {}

export interface BulkFileUploadResponse extends ApiResponse<{
  successful: FileUploadResponse[];
  failed: Array<{
    filename: string;
    error: string;
  }>;
}> {}

// Analytics API types
export interface AnalyticsResponse extends ApiResponse<{
  period: string;
  metrics: {
    totalProperties: number;
    totalBookings: number;
    totalRevenue: number;
    averageOccupancy: number;
    topPerformingProperties: Array<{
      propertyId: string;
      title: string;
      revenue: number;
      bookings: number;
    }>;
  };
  charts: {
    revenueOverTime: Array<{
      date: string;
      revenue: number;
    }>;
    bookingTrends: Array<{
      date: string;
      bookings: number;
    }>;
    occupancyRates: Array<{
      date: string;
      occupancy: number;
    }>;
  };
}> {}

// Notification API types
export interface NotificationResponse extends ApiResponse<{
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}> {}

export interface NotificationListResponse extends PaginatedResponse<NotificationResponse['data']> {}

// Re-export types from index for convenience
export type {
  Property,
  Booking,
  Guest,
  User,
  PropertyFilters,
  BookingFilters,
  GuestFilters,
  SearchParams
} from './index';
