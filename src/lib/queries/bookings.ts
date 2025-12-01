import { supabase } from '../supabase'
import { cache, cacheKeys, CACHE_TTL } from '../cache'
import { logError } from '../../utils/logger'
import type {
  Booking,
  BookingWithDetails,
  CreateBookingInput,
  BookingFilters,
  PaginatedResponse,
  BookingStatus
} from '../../types/database'

/**
 * Valid booking status transitions
 * Maps from current status to allowed next statuses
 */
const VALID_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['awaiting_payment', 'cancelled'],
  awaiting_payment: ['awaiting_confirmation', 'expired', 'cancelled'],
  awaiting_confirmation: ['confirmed', 'payment_failed', 'cancelled'],
  payment_failed: ['awaiting_payment', 'cancelled'],
  confirmed: ['cancelled', 'completed'],
  cancelled: [], // Terminal state - no transitions allowed
  completed: [], // Terminal state - no transitions allowed
  expired: ['cancelled'], // Can be cancelled after expiration
}

/**
 * Validate if a status transition is allowed
 */
function isValidStatusTransition(
  currentStatus: BookingStatus,
  newStatus: BookingStatus
): boolean {
  // Cancellation is always allowed from any non-terminal state
  if (newStatus === 'cancelled' && currentStatus !== 'cancelled' && currentStatus !== 'completed') {
    return true
  }

  // Check if transition is in the allowed list
  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || []
  return allowedTransitions.includes(newStatus)
}

export const bookingQueries = {
  // Get booking by ID
  async getById(id: string): Promise<BookingWithDetails | null> {
    const cacheKey = cacheKeys.booking(id)
    const cached = cache.get<BookingWithDetails>(cacheKey)
    
    if (cached) {
      return cached
    }

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        property:properties(*),
        guest:guests(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      logError('Error fetching booking', error, 'bookingQueries')
      return null
    }

    cache.set(cacheKey, data, CACHE_TTL.MEDIUM)
    return data
  },

  // Get bookings for a guest
  async getByGuest(guestId: string, limit: number = 20): Promise<BookingWithDetails[]> {
    const cacheKey = `${cacheKeys.guestBookings(guestId)}:${limit}`
    const cached = cache.get<BookingWithDetails[]>(cacheKey)
    
    if (cached) {
      return cached
    }

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        property:properties(*),
        guest:guests(*)
      `)
      .eq('guest_id', guestId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logError('Error fetching guest bookings', error, 'bookingQueries')
      return []
    }

    cache.set(cacheKey, data, CACHE_TTL.MEDIUM)
    return data
  },

  // Get bookings for a property
  async getByProperty(propertyId: string, limit: number = 20): Promise<BookingWithDetails[]> {
    const cacheKey = `${cacheKeys.propertyBookings(propertyId)}:${limit}`
    const cached = cache.get<BookingWithDetails[]>(cacheKey)
    
    if (cached) {
      return cached
    }

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        property:properties(*),
        guest:guests(*)
      `)
      .eq('property_id', propertyId)
      .order('check_in_date', { ascending: false })
      .limit(limit)

    if (error) {
      logError('Error fetching property bookings', error, 'bookingQueries')
      return []
    }

    cache.set(cacheKey, data, CACHE_TTL.MEDIUM)
    return data
  },

  // Search bookings with filters
  async search(filters: BookingFilters, page: number = 1, limit: number = 20): Promise<PaginatedResponse<BookingWithDetails>> {
    const cacheKey = `bookings:search:${JSON.stringify({ filters, page, limit })}`
    const cached = cache.get<PaginatedResponse<BookingWithDetails>>(cacheKey)
    
    if (cached) {
      return cached
    }

    let queryBuilder = supabase
      .from('bookings')
      .select(`
        *,
        property:properties(*),
        guest:guests(*)
      `, { count: 'exact' })

    // Apply filters
    if (filters.property_id) {
      queryBuilder = queryBuilder.eq('property_id', filters.property_id)
    }
    if (filters.guest_id) {
      queryBuilder = queryBuilder.eq('guest_id', filters.guest_id)
    }
    if (filters.status) {
      queryBuilder = queryBuilder.eq('status', filters.status)
    }
    if (filters.check_in_date_from) {
      queryBuilder = queryBuilder.gte('check_in_date', filters.check_in_date_from)
    }
    if (filters.check_in_date_to) {
      queryBuilder = queryBuilder.lte('check_in_date', filters.check_in_date_to)
    }
    if (filters.check_out_date_from) {
      queryBuilder = queryBuilder.gte('check_out_date', filters.check_out_date_from)
    }
    if (filters.check_out_date_to) {
      queryBuilder = queryBuilder.lte('check_out_date', filters.check_out_date_to)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    queryBuilder = queryBuilder.range(from, to).order('created_at', { ascending: false })

    const { data, error, count } = await queryBuilder

    if (error) {
      logError('Error searching bookings', error, 'bookingQueries')
      return {
        data: [],
        total: 0,
        page,
        limit,
        total_pages: 0,
        has_next: false,
        has_prev: false
      }
    }

    const total = count || 0
    const total_pages = Math.ceil(total / limit)

    const result: PaginatedResponse<BookingWithDetails> = {
      data,
      total,
      page,
      limit,
      total_pages,
      has_next: page < total_pages,
      has_prev: page > 1
    }

    cache.set(cacheKey, result, CACHE_TTL.SHORT)
    return result
  },

  // Check availability for a property
  async checkAvailability(
    propertyId: string,
    checkInDate: string,
    checkOutDate: string
  ): Promise<{ available: boolean; conflictingBookings: Booking[] }> {
    const cacheKey = `availability:${propertyId}:${checkInDate}:${checkOutDate}`
    const cached = cache.get<{ available: boolean; conflictingBookings: Booking[] }>(cacheKey)
    
    if (cached) {
      return cached
    }

    // Check for overlapping bookings
    const { data: conflictingBookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('property_id', propertyId)
      .in('status', ['confirmed', 'pending'])
      .or(`and(check_in_date.lt.${checkOutDate},check_out_date.gt.${checkInDate})`)

    if (error) {
      logError('Error checking availability', error, 'bookingQueries')
      return { available: false, conflictingBookings: [] }
    }

    const available = conflictingBookings.length === 0
    const result = { available, conflictingBookings }

    cache.set(cacheKey, result, CACHE_TTL.SHORT)
    return result
  },

  // Create new booking
  async create(input: CreateBookingInput): Promise<Booking | null> {
    // First check availability
    const availability = await this.checkAvailability(
      input.property_id,
      input.check_in_date,
      input.check_out_date
    )

    if (!availability.available) {
      throw new Error('Property is not available for the selected dates')
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert(input)
      .select()
      .single()

    if (error) {
      logError('Error creating booking', error, 'bookingQueries')
      return null
    }

    // Clear related caches
    cache.clearPattern(`bookings:guest:${input.guest_id}`)
    cache.clearPattern(`bookings:property:${input.property_id}`)
    cache.clearPattern(`availability:${input.property_id}:`)
    cache.clearPattern('bookings:search:')

    return data
  },

  // Update booking status
  async updateStatus(id: string, status: string, cancellationReason?: string): Promise<Booking | null> {
    // Get current booking to validate transition
    const currentBooking = await this.getById(id)
    if (!currentBooking) {
      logError('Booking not found for status update', { id }, 'bookingQueries')
      return null
    }

    // Validate status transition
    if (!isValidStatusTransition(currentBooking.status as BookingStatus, status as BookingStatus)) {
      const error = new Error(
        `Invalid status transition from '${currentBooking.status}' to '${status}'. ` +
        `Allowed transitions: ${VALID_STATUS_TRANSITIONS[currentBooking.status as BookingStatus]?.join(', ') || 'none'}`
      )
      logError('Invalid status transition', error, 'bookingQueries')
      throw error
    }

    const updates: any = { status }
    
    if (status === 'cancelled' && cancellationReason) {
      updates.cancellation_reason = cancellationReason
      updates.cancelled_at = new Date().toISOString()
    }

    // If transitioning to expired, set cancelled_at
    if (status === 'expired') {
      updates.cancelled_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logError('Error updating booking status', error, 'bookingQueries')
      return null
    }

    // Clear related caches
    cache.delete(cacheKeys.booking(id))
    cache.clearPattern(`bookings:guest:${data.guest_id}`)
    cache.clearPattern(`bookings:property:${data.property_id}`)
    cache.clearPattern(`availability:${data.property_id}:`)
    cache.clearPattern('bookings:search:')

    return data
  },

  // Cancel booking
  async cancel(id: string, reason: string): Promise<Booking | null> {
    return this.updateStatus(id, 'cancelled', reason)
  },

  // Confirm booking (admin approves - transitions to awaiting_payment)
  async confirm(id: string): Promise<Booking | null> {
    // Get booking to calculate commission and validate transition
    const booking = await this.getById(id)
    if (!booking) return null

    // Validate transition - can only confirm from pending
    if (booking.status !== 'pending') {
      const error = new Error(
        `Cannot confirm booking: booking status is '${booking.status}', expected 'pending'`
      )
      logError('Invalid booking confirmation transition', error, 'bookingQueries')
      throw error
    }

    // Calculate commission (10% default, can be from env)
    const commissionRate = parseFloat(import.meta.env.VITE_PLATFORM_COMMISSION_RATE || '0.10')
    const platformCommission = booking.total_amount * commissionRate
    const hostPayout = booking.total_amount - platformCommission

    // Set payment expiration (2 hours from now, can be from env)
    const deadlineHours = parseInt(import.meta.env.VITE_PAYMENT_DEADLINE_HOURS || '2')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + deadlineHours)

    const updates: any = {
      status: 'awaiting_payment',
      platform_commission: platformCommission,
      host_payout_amount: hostPayout,
      payment_expires_at: expiresAt.toISOString()
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logError('Error confirming booking', error, 'bookingQueries')
      return null
    }

    // Clear caches
    cache.delete(cacheKeys.booking(id))
    cache.clearPattern(`bookings:guest:${data.guest_id}`)
    cache.clearPattern(`bookings:property:${data.property_id}`)
    cache.clearPattern('bookings:search:')

    return data
  },

  // Guest marks payment as completed
  async markAsPaid(
    id: string,
    paymentMethod: string,
    paymentReference: string,
    paymentProofUrl?: string
  ): Promise<Booking | null> {
    // Get current booking to validate transition
    const currentBooking = await this.getById(id)
    if (!currentBooking) {
      logError('Booking not found for marking as paid', { id }, 'bookingQueries')
      return null
    }

    // Validate transition - can only mark as paid from awaiting_payment or payment_failed (retry)
    if (currentBooking.status !== 'awaiting_payment' && currentBooking.status !== 'payment_failed') {
      const error = new Error(
        `Cannot mark payment as paid: booking status is '${currentBooking.status}', expected 'awaiting_payment' or 'payment_failed'`
      )
      logError('Invalid mark as paid transition', error, 'bookingQueries')
      throw error
    }

    const updates: any = {
      status: 'awaiting_confirmation',
      payment_method: paymentMethod,
      payment_reference: paymentReference
    }

    if (paymentProofUrl) {
      updates.payment_proof_url = paymentProofUrl
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logError('Error marking payment as paid', error, 'bookingQueries')
      return null
    }

    // Clear caches
    cache.delete(cacheKeys.booking(id))
    cache.clearPattern(`bookings:guest:${data.guest_id}`)
    cache.clearPattern(`bookings:property:${data.property_id}`)
    cache.clearPattern('bookings:search:')

    return data
  },

  // Admin confirms payment received
  async confirmPayment(id: string, notes?: string): Promise<Booking | null> {
    // Get current booking to validate transition
    const currentBooking = await this.getById(id)
    if (!currentBooking) {
      logError('Booking not found for payment confirmation', { id }, 'bookingQueries')
      return null
    }

    // Validate transition - can only confirm payment from awaiting_confirmation
    if (currentBooking.status !== 'awaiting_confirmation') {
      const error = new Error(
        `Cannot confirm payment: booking status is '${currentBooking.status}', expected 'awaiting_confirmation'`
      )
      logError('Invalid payment confirmation transition', error, 'bookingQueries')
      throw error
    }

    const updates: any = {
      status: 'confirmed',
      payment_confirmed_by: 'admin', // TODO: Get actual admin ID from auth context
      payment_confirmed_at: new Date().toISOString()
    }

    if (notes) {
      // Note: payment_notes field doesn't exist in schema, we'll skip it for MVP
      // Can be added later if needed
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logError('Error confirming payment', error, 'bookingQueries')
      return null
    }

    // Clear caches
    cache.delete(cacheKeys.booking(id))
    cache.clearPattern(`bookings:guest:${data.guest_id}`)
    cache.clearPattern(`bookings:property:${data.property_id}`)
    cache.clearPattern('bookings:search:')

    return data
  },

  // Admin rejects payment
  async rejectPayment(id: string, reason: string): Promise<Booking | null> {
    // Get current booking to validate transition
    const currentBooking = await this.getById(id)
    if (!currentBooking) {
      logError('Booking not found for payment rejection', { id }, 'bookingQueries')
      return null
    }

    // Validate transition - can only reject from awaiting_confirmation
    if (currentBooking.status !== 'awaiting_confirmation') {
      const error = new Error(
        `Cannot reject payment: booking status is '${currentBooking.status}', expected 'awaiting_confirmation'`
      )
      logError('Invalid payment rejection', error, 'bookingQueries')
      throw error
    }

    const updates: any = {
      status: 'payment_failed'
      // Note: payment_notes field doesn't exist in schema, we'll skip it for MVP
      // Can store reason in cancellation_reason if needed, but that's not ideal
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logError('Error rejecting payment', error, 'bookingQueries')
      return null
    }

    // Clear caches
    cache.delete(cacheKeys.booking(id))
    cache.clearPattern(`bookings:guest:${data.guest_id}`)
    cache.clearPattern(`bookings:property:${data.property_id}`)
    cache.clearPattern('bookings:search:')

    return data
  },

  // Expire unpaid bookings (called by cron job)
  async expireUnpaidBookings(): Promise<{ expired: number; errors: number }> {
    try {
      // Use RPC call to database function for better performance and atomicity
      const { data, error } = await supabase.rpc('expire_unpaid_bookings')

      if (error) {
        logError('Error expiring unpaid bookings via RPC', error, 'bookingQueries')
        // Fallback to direct update if RPC fails
        return await this.expireUnpaidBookingsDirect()
      }

      const expiredCount = data || 0
      
      // Clear all booking-related caches since we don't know which bookings were affected
      cache.clearPattern('bookings:')
      cache.clearPattern('availability:')

      return { expired: expiredCount, errors: 0 }
    } catch (err) {
      logError('Error in expireUnpaidBookings', err, 'bookingQueries')
      return { expired: 0, errors: 1 }
    }
  },

  // Fallback direct update method if RPC is not available
  async expireUnpaidBookingsDirect(): Promise<{ expired: number; errors: number }> {
    try {
      const now = new Date().toISOString()

      // Find bookings that need to be expired
      const { data: bookingsToExpire, error: fetchError } = await supabase
        .from('bookings')
        .select('id')
        .eq('status', 'awaiting_payment')
        .not('payment_expires_at', 'is', null)
        .lt('payment_expires_at', now)

      if (fetchError) {
        logError('Error fetching bookings to expire', fetchError, 'bookingQueries')
        return { expired: 0, errors: 1 }
      }

      if (!bookingsToExpire || bookingsToExpire.length === 0) {
        return { expired: 0, errors: 0 }
      }

      const bookingIds = bookingsToExpire.map(b => b.id)
      let expiredCount = 0
      let errorCount = 0

      // Expire each booking individually to ensure proper validation
      for (const bookingId of bookingIds) {
        try {
          const result = await this.updateStatus(bookingId, 'expired')
          if (result) {
            expiredCount++
          } else {
            errorCount++
          }
        } catch (err) {
          logError(`Error expiring booking ${bookingId}`, err, 'bookingQueries')
          errorCount++
        }
      }

      // Clear all booking-related caches
      cache.clearPattern('bookings:')
      cache.clearPattern('availability:')

      return { expired: expiredCount, errors: errorCount }
    } catch (err) {
      logError('Error in expireUnpaidBookingsDirect', err, 'bookingQueries')
      return { expired: 0, errors: 1 }
    }
  },

  // Get booking statistics
  async getStats(propertyId?: string, guestId?: string): Promise<{
    total: number
    confirmed: number
    pending: number
    cancelled: number
    completed: number
    totalRevenue: number
  }> {
    const cacheKey = `booking:stats:${propertyId || 'all'}:${guestId || 'all'}`
    const cached = cache.get(cacheKey)
    
    if (cached) {
      return cached
    }

    let queryBuilder = supabase
      .from('bookings')
      .select('status, total_amount')

    if (propertyId) {
      queryBuilder = queryBuilder.eq('property_id', propertyId)
    }
    if (guestId) {
      queryBuilder = queryBuilder.eq('guest_id', guestId)
    }

    const { data, error } = await queryBuilder

    if (error) {
      logError('Error fetching booking stats', error, 'bookingQueries')
      return {
        total: 0,
        confirmed: 0,
        pending: 0,
        cancelled: 0,
        completed: 0,
        totalRevenue: 0
      }
    }

    const stats = data.reduce((acc, booking) => {
      acc.total++
      acc[booking.status as keyof typeof acc]++
      if (booking.status === 'confirmed' || booking.status === 'completed') {
        acc.totalRevenue += booking.total_amount
      }
      return acc
    }, {
      total: 0,
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      completed: 0,
      totalRevenue: 0
    })

    cache.set(cacheKey, stats, CACHE_TTL.MEDIUM)
    return stats
  },

  // Get revenue over time (last 7 days)
  async getRevenueOverTime(days: number = 7): Promise<Array<{ date: string; revenue: number }>> {
    const cacheKey = `booking:revenue:${days}days`
    const cached = cache.get<Array<{ date: string; revenue: number }>>(cacheKey)
    
    if (cached) {
      return cached
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('bookings')
      .select('created_at, total_amount, status')
      .gte('created_at', startDate.toISOString())
      .in('status', ['confirmed', 'completed'])

    if (error) {
      logError('Error fetching revenue over time', error, 'bookingQueries')
      return []
    }

    // Group by date
    const revenueByDate: Record<string, number> = {}
    
    // Initialize all dates with 0
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (days - 1 - i))
      date.setHours(0, 0, 0, 0)
      const dateKey = date.toISOString().split('T')[0]
      revenueByDate[dateKey] = 0
    }

    // Sum revenue by date
    data.forEach((booking) => {
      const dateKey = new Date(booking.created_at).toISOString().split('T')[0]
      if (revenueByDate[dateKey] !== undefined) {
        revenueByDate[dateKey] += booking.total_amount || 0
      }
    })

    // Convert to array
    const result = Object.entries(revenueByDate)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date))

    cache.set(cacheKey, result, CACHE_TTL.SHORT)
    return result
  }
}
