// Export all query functions
export { propertyQueries, propertyImageQueries } from './properties'
export { bookingQueries } from './bookings'
export { availabilityQueries } from './availability'
export { guestQueries } from './guests'
export { hostQueries } from './hosts'
export { reviewQueries } from './reviews'
export { contactMessageQueries } from './contactMessages'
export { favoriteQueries } from './favorites'
export { paymentQueries } from './payments'

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
  Host,
  Review,
  ReviewWithDetails,
  ReviewStatus,
  CreateReviewInput,
  ContactMessage,
  CreateContactMessageInput,
  ContactMessageStatus,
  Favorite,
  FavoriteWithDetails,
  CreateFavoriteInput
} from '../../types/database'
