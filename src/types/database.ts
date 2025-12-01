// Database types for Maxed Homes Property Rental System
// Generated from Supabase schema

export type PropertyStatus = 'active' | 'inactive' | 'maintenance' | 'sold'
export type BookingStatus = 
  | 'pending' 
  | 'awaiting_payment'      // NEW - Admin approved, waiting for guest payment
  | 'awaiting_confirmation' // NEW - Guest paid, waiting for admin verification
  | 'payment_failed'        // NEW - Payment was rejected by admin
  | 'confirmed' 
  | 'cancelled' 
  | 'completed' 
  | 'expired'
export type GuestStatus = 'active' | 'inactive' | 'blocked'
export type HostStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification'
export type ReviewStatus = 'pending' | 'approved' | 'rejected'
export type ContactMessageStatus = 'new' | 'read' | 'replied' | 'archived'
export type AdminRole = 'admin' | 'super_admin' | 'moderator'
export type AdminStatus = 'active' | 'inactive' | 'suspended'
export type PaymentMethodType = 'mtn_momo' | 'moov_momo' | 'bank_transfer'

export interface Property {
  id: string
  host_id: string
  title: string
  description: string | null
  property_type: string
  bedrooms: number
  bathrooms: number
  max_guests: number
  area_sqft: number | null
  price_per_night: number
  cleaning_fee: number
  security_deposit: number
  address: string
  city: string
  state: string
  zip_code: string | null
  country: string
  latitude: number | null
  longitude: number | null
  amenities: string[]
  house_rules: string | null
  cancellation_policy: string | null
  safety_property: string | null
  check_in_time: string
  check_out_time: string
  minimum_nights: number
  maximum_nights: number | null
  status: PropertyStatus
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface PropertyImage {
  id: string
  property_id: string
  image_url: string
  alt_text: string | null
  caption: string | null
  display_order: number
  is_primary: boolean
  created_at: string
}

export interface Guest {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  date_of_birth: string | null
  profile_image_url: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  preferences: Record<string, any> | null
  status: GuestStatus
  created_at: string
  updated_at: string
}

export interface Host {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  company_name: string | null
  profile_image_url: string | null
  bio: string | null
  status: HostStatus
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  property_id: string
  guest_id: string
  check_in_date: string
  check_out_date: string
  guests_count: number
  total_nights: number
  base_price: number
  cleaning_fee: number
  security_deposit: number
  taxes: number
  total_amount: number
  status: BookingStatus
  special_requests: string | null
  cancellation_reason: string | null
  cancelled_at: string | null
  // Payment fields
  payment_method?: string | null
  payment_reference?: string | null
  payment_proof_url?: string | null
  payment_confirmed_by?: string | null
  payment_confirmed_at?: string | null
  payment_expires_at?: string | null
  platform_commission?: number
  host_payout_amount?: number | null
  created_at: string
  updated_at: string
}

export interface AvailabilityCalendar {
  id: string
  property_id: string
  date: string
  is_available: boolean
  price_override: number | null
  minimum_nights_override: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  booking_id: string
  property_id: string
  guest_id: string
  rating: number
  title: string | null
  comment: string | null
  cleanliness_rating: number | null
  communication_rating: number | null
  location_rating: number | null
  value_rating: number | null
  status: ReviewStatus
  host_response: string | null
  host_response_at: string | null
  created_at: string
  updated_at: string
}

export interface ContactMessage {
  id: string
  full_name: string
  email: string
  phone: string | null
  subject: string
  message: string
  status: ContactMessageStatus
  created_at: string
  updated_at: string
}

export interface Favorite {
  id: string
  guest_id: string
  property_id: string
  created_at: string
}

export interface Admin {
  id: string
  user_id: string | null
  email: string
  role: AdminRole
  status: AdminStatus
  permissions: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface PaymentConfig {
  id: string
  payment_method: PaymentMethodType
  account_name: string
  account_number: string
  bank_name: string | null
  is_active: boolean
  instructions: string | null
  display_order: number
  created_at: string
  updated_at: string
}

// Extended types with relationships
export interface PropertyWithImages extends Property {
  images: PropertyImage[]
  host?: {
    id: string
    email: string
    first_name: string
    last_name: string
    phone: string | null
    company_name: string | null
    profile_image_url: string | null
    bio: string | null
    status: string
    is_verified: boolean
    created_at: string
    updated_at: string
  }
}

export interface PropertyWithAvailability extends Property {
  images: PropertyImage[]
  availability: AvailabilityCalendar[]
}

export interface BookingWithDetails extends Booking {
  property: Property
  guest: Guest
}

export interface ReviewWithDetails extends Review {
  guest: Guest
}

export interface FavoriteWithDetails extends Favorite {
  property: PropertyWithImages
  guest: Guest
}

// Input types for creating/updating records
export interface CreatePropertyInput {
  host_id?: string
  title: string
  description?: string
  property_type: string
  bedrooms: number
  bathrooms: number
  max_guests: number
  area_sqft?: number
  price_per_night: number
  cleaning_fee?: number
  security_deposit?: number
  address: string
  city: string
  state: string
  zip_code?: string
  country?: string
  latitude?: number
  longitude?: number
  amenities?: string[]
  house_rules?: string
  cancellation_policy?: string
  safety_property?: string
  check_in_time?: string
  check_out_time?: string
  minimum_nights?: number
  maximum_nights?: number
  status?: PropertyStatus
  is_featured?: boolean
}

export interface CreatePropertyImageInput {
  property_id: string
  image_url: string
  alt_text?: string
  caption?: string
  display_order?: number
  is_primary?: boolean
}

export interface CreateGuestInput {
  email: string
  first_name: string
  last_name: string
  phone?: string
  date_of_birth?: string
  profile_image_url?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  preferences?: Record<string, any>
  status?: GuestStatus
}

export interface CreateBookingInput {
  property_id: string
  guest_id: string
  check_in_date: string
  check_out_date: string
  guests_count: number
  base_price: number
  cleaning_fee?: number
  security_deposit?: number
  taxes?: number
  total_amount: number
  special_requests?: string
}

export interface CreateAvailabilityInput {
  property_id: string
  date: string
  is_available?: boolean
  price_override?: number
  minimum_nights_override?: number
  notes?: string
}

export interface CreateReviewInput {
  booking_id: string
  property_id: string
  guest_id: string
  rating: number
  title?: string
  comment?: string
  cleanliness_rating?: number
  communication_rating?: number
  location_rating?: number
  value_rating?: number
}

export interface CreateContactMessageInput {
  full_name: string
  email: string
  phone?: string
  subject: string
  message: string
}

export interface CreateFavoriteInput {
  guest_id: string
  property_id: string
}

export interface CreatePaymentConfigInput {
  payment_method: PaymentMethodType
  account_name: string
  account_number: string
  bank_name?: string | null
  is_active?: boolean
  instructions?: string | null
  display_order?: number
}

export interface UpdatePaymentConfigInput {
  account_name?: string
  account_number?: string
  bank_name?: string | null
  is_active?: boolean
  instructions?: string | null
  display_order?: number
}

// Query filter types
export interface PropertyFilters {
  city?: string
  state?: string
  property_type?: string
  min_price?: number
  max_price?: number
  min_bedrooms?: number
  min_bathrooms?: number
  min_guests?: number
  amenities?: string[]
  is_featured?: boolean
  status?: PropertyStatus
}

export interface BookingFilters {
  property_id?: string
  guest_id?: string
  status?: BookingStatus
  check_in_date_from?: string
  check_in_date_to?: string
  check_out_date_from?: string
  check_out_date_to?: string
}

export interface AvailabilityFilters {
  property_id?: string
  date_from?: string
  date_to?: string
  is_available?: boolean
}

// Search and pagination types
export interface SearchParams {
  query?: string
  filters?: PropertyFilters
  sort_by?: 'price' | 'created_at' | 'title' | 'rating'
  sort_order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

// Cache key types
export type CacheKey = 
  | `properties:${string}` // Single property
  | `properties:list:${string}` // Property list with filters
  | `properties:featured` // Featured properties
  | `properties:${string}:images` // Property images
  | `properties:${string}:availability:${string}` // Property availability
  | `bookings:${string}` // Single booking
  | `bookings:guest:${string}` // Guest bookings
  | `bookings:property:${string}` // Property bookings
  | `guests:${string}` // Single guest
  | `availability:${string}:${string}` // Availability range
  | `reviews:property:${string}` // Property reviews
  | `reviews:${string}` // Single review
  | `favorites:guest:${string}` // Guest favorites
  | `favorites:property:${string}` // Property favorites count
  | `favorites:${string}:${string}` // Specific guest-property favorite
