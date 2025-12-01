import { supabase } from '../supabase'
import { cache, cacheKeys, CACHE_TTL } from '../cache'
import { logError } from '../../utils/logger'
import type {
  Review,
  ReviewWithDetails,
  CreateReviewInput,
  PaginatedResponse
} from '../../types/database'

export const reviewQueries = {
  // Get reviews for a property (only approved reviews)
  async getByProperty(propertyId: string, limit: number = 50): Promise<ReviewWithDetails[]> {
    const cacheKey = cacheKeys.propertyReviews(propertyId)
    const cached = cache.get<ReviewWithDetails[]>(cacheKey)
    
    if (cached) {
      return cached
    }

    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        guest:guests(*)
      `)
      .eq('property_id', propertyId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logError('Error fetching reviews', error, 'reviewQueries')
      return []
    }

    cache.set(cacheKey, data, CACHE_TTL.MEDIUM)
    return data
  },

  // Get property rating statistics
  async getPropertyRatingStats(propertyId: string): Promise<{
    averageRating: number
    totalReviews: number
  }> {
    const cacheKey = `${cacheKeys.propertyReviews(propertyId)}:stats`
    const cached = cache.get<{ averageRating: number; totalReviews: number }>(cacheKey)
    
    if (cached) {
      return cached
    }

    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('property_id', propertyId)
      .eq('status', 'approved')

    if (error) {
      logError('Error fetching rating stats', error, 'reviewQueries')
      return { averageRating: 0, totalReviews: 0 }
    }

    const totalReviews = data.length
    const averageRating = totalReviews > 0
      ? data.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0

    const stats = {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews
    }

    cache.set(cacheKey, stats, CACHE_TTL.MEDIUM)
    return stats
  },

  // Create a new review
  async create(input: CreateReviewInput): Promise<Review | null> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([{
          booking_id: input.booking_id,
          property_id: input.property_id,
          guest_id: input.guest_id,
          rating: input.rating,
          title: input.title || null,
          comment: input.comment || null,
          cleanliness_rating: input.cleanliness_rating || null,
          communication_rating: input.communication_rating || null,
          location_rating: input.location_rating || null,
          value_rating: input.value_rating || null,
          status: 'pending' // Reviews start as pending
        }])
        .select()
        .single()

      if (error) {
        logError('Error creating review', error, 'reviewQueries')
        throw error
      }

      // Invalidate related caches
      cache.delete(cacheKeys.propertyReviews(input.property_id))
      cache.delete(`${cacheKeys.propertyReviews(input.property_id)}:stats`)

      return data
    } catch (error) {
      console.error('Error creating review:', error)
      return null
    }
  },

  // Check if guest can review a property (has completed booking, no existing review)
  async canGuestReview(propertyId: string, guestId: string): Promise<{
    canReview: boolean
    bookingId?: string
    reason?: string
  }> {
    try {
      // Check if guest has a completed booking for this property
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, check_out_date, status')
        .eq('property_id', propertyId)
        .eq('guest_id', guestId)
        .eq('status', 'completed')
        .order('check_out_date', { ascending: false })
        .limit(1)

      if (bookingsError) {
        logError('Error checking bookings', bookingsError, 'reviewQueries')
        return { canReview: false, reason: 'Error checking booking status' }
      }

      if (!bookings || bookings.length === 0) {
        return { canReview: false, reason: 'No completed bookings found' }
      }

      const booking = bookings[0]
      const checkOutDate = new Date(booking.check_out_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      checkOutDate.setHours(0, 0, 0, 0)

      // Check if checkout date has passed
      if (checkOutDate > today) {
        return { canReview: false, reason: 'Booking has not completed yet' }
      }

      // Check if review already exists for this booking
      const { data: existingReview, error: reviewError } = await supabase
        .from('reviews')
        .select('id')
        .eq('booking_id', booking.id)
        .single()

      if (reviewError && reviewError.code !== 'PGRST116') { // PGRST116 = no rows returned
        logError('Error checking existing review', reviewError, 'reviewQueries')
        return { canReview: false, reason: 'Error checking existing review' }
      }

      if (existingReview) {
        return { canReview: false, reason: 'Review already submitted for this booking' }
      }

      return { canReview: true, bookingId: booking.id }
    } catch (error) {
      logError('Error checking if guest can review', error, 'reviewQueries')
      return { canReview: false, reason: 'Error checking review eligibility' }
    }
  },

  // Get review by booking ID (for guests to view/edit their own review)
  async getByBooking(bookingId: string): Promise<Review | null> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('booking_id', bookingId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // No review found
      }
      logError('Error fetching review by booking', error, 'reviewQueries')
      return null
    }

    return data
  },

  // Get reviews written by a guest (includes all statuses for the guest's own reviews)
  async getByGuest(guestId: string, limit: number = 50): Promise<ReviewWithDetails[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        property:properties(
          id, 
          title, 
          city, 
          state, 
          images:property_images(*)
        )
      `)
      .eq('guest_id', guestId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logError('Error fetching reviews by guest', error, 'reviewQueries')
      return []
    }

    // Sort images by is_primary and display_order
    if (data) {
      data.forEach((review: any) => {
        if (review.property?.images && Array.isArray(review.property.images)) {
          review.property.images.sort((a: any, b: any) => {
            if (a.is_primary && !b.is_primary) return -1;
            if (!a.is_primary && b.is_primary) return 1;
            return (a.display_order || 0) - (b.display_order || 0);
          });
        }
      });
    }

    return data || []
  }
}

