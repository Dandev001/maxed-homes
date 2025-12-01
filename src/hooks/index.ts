// Export all hooks
export * from './useProperties'
export * from './useBookings'
export * from './useEmail'
export * from './useAvailability'
export * from './useGuests'
export * from './useContactMessages'
export * from './useFavorites'
export * from './usePayments'

// Re-export types for convenience
export type {
  Property,
  PropertyWithImages,
  PropertyWithAvailability,
  CreatePropertyInput,
  CreatePropertyImageInput,
  PropertyFilters,
  SearchParams,
  PaginatedResponse,
  Booking,
  BookingWithDetails,
  CreateBookingInput,
  BookingFilters,
  AvailabilityCalendar,
  CreateAvailabilityInput,
  AvailabilityFilters,
  Guest,
  CreateGuestInput,
  ContactMessage,
  CreateContactMessageInput,
  ContactMessageStatus,
  Favorite,
  FavoriteWithDetails,
  CreateFavoriteInput
} from '../types/database'