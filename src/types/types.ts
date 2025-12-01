// Comprehensive type exports for Maxed Homes Property Rental System
// This file consolidates all types for easy importing

// Core domain types
export type {
  // Property types
  Property,
  PropertyType,
  PropertyStatus,
  PropertyImage,
  Amenity,
  AmenityCategory,
  
  // Booking types
  Booking,
  BookingStatus,
  BookingPricing,
  
  // Guest types
  Guest,
  GuestStatus,
  EmergencyContact,
  GuestPreferences,
  NotificationPreferences,
  AccessibilityPreferences,
  VerificationStatus,
  
  // User types
  User,
  
  // Filter types
  PropertyFilters,
  BookingFilters,
  GuestFilters,
  
  // Search types
  SearchParams,
  SearchSuggestion,
  
  // Component types
  BaseComponentProps,
  LoadingState,
  FormState
} from './index';

// API types
export type {
  // Base API types
  ApiResponse,
  PaginatedResponse,
  ErrorResponse,
  
  // Property API types
  PropertyListResponse,
  PropertyDetailResponse,
  PropertyAvailabilityResponse,
  PriceOverride,
  CreatePropertyRequest,
  UpdatePropertyRequest,
  
  // Booking API types
  BookingListResponse,
  BookingDetailResponse,
  BookingSummary,
  BookingTimeline,
  CreateBookingRequest,
  UpdateBookingRequest,
  BookingAvailabilityRequest,
  BookingAvailabilityResponse,
  
  // Guest API types
  GuestListResponse,
  GuestDetailResponse,
  GuestSummary,
  CreateGuestRequest,
  UpdateGuestRequest,
  
  // Search API types
  SearchResponse,
  SearchFacets,
  FacetItem,
  
  // Authentication API types
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  
  // File upload API types
  FileUploadResponse,
  BulkFileUploadResponse,
  
  // Analytics API types
  AnalyticsResponse,
  
  // Notification API types
  NotificationResponse,
  NotificationListResponse
} from './api';

// Database types (Supabase)
export type {
  // Database enums
  PropertyStatus as DbPropertyStatus,
  BookingStatus as DbBookingStatus,
  GuestStatus as DbGuestStatus,
  
  // Database interfaces
  Property as DbProperty,
  PropertyImage as DbPropertyImage,
  Guest as DbGuest,
  Booking as DbBooking,
  AvailabilityCalendar,
  
  // Extended database types
  PropertyWithImages,
  PropertyWithAvailability,
  BookingWithDetails,
  
  // Database input types
  CreatePropertyInput,
  CreatePropertyImageInput,
  CreateGuestInput,
  CreateBookingInput,
  CreateAvailabilityInput,
  
  // Database filter types
  PropertyFilters as DbPropertyFilters,
  BookingFilters as DbBookingFilters,
  AvailabilityFilters,
  
  // Database search types
  SearchParams as DbSearchParams,
  PaginatedResponse as DbPaginatedResponse,
  
  // Cache types
  CacheKey
} from './database';

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// Common utility types for the application
export type ID = string;
export type Timestamp = string | Date;
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'zh' | 'ja' | 'ko';

// Form validation types
export interface ValidationRule<T = any> {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
}

export interface FormField<T = any> {
  name: keyof T;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'radio';
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: ValidationRule<T>;
  disabled?: boolean;
  readonly?: boolean;
}

// Event types
export interface PropertyEvent {
  type: 'created' | 'updated' | 'deleted' | 'featured' | 'unfeatured';
  propertyId: string;
  timestamp: Date;
  userId: string;
  changes?: Record<string, any>;
}

export interface BookingEvent {
  type: 'created' | 'confirmed' | 'cancelled' | 'completed' | 'modified';
  bookingId: string;
  propertyId: string;
  guestId: string;
  timestamp: Date;
  userId: string;
  changes?: Record<string, any>;
}

// Configuration types
export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  features: {
    enableAnalytics: boolean;
    enableNotifications: boolean;
    enableReviews: boolean;
    enableMessaging: boolean;
  };
  limits: {
    maxFileSize: number;
    maxImagesPerProperty: number;
    maxGuestsPerBooking: number;
  };
}

// Theme and UI types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    warning: string;
    success: string;
    info: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
  };
  breakpoints: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
}

// Export everything as a namespace for convenience
export * as Types from './index';
export * as ApiTypes from './api';
export * as DatabaseTypes from './database';
