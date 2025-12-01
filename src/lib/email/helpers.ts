// Helper functions for email notifications
import { supabase } from '../supabase'
import { logError, logDebug } from '../../utils/logger'
import type { BookingWithDetails } from '../../types/database'
import type { BookingEmailData } from './types'

/**
 * Get all active admin emails
 */
export async function getAdminEmails(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('email')
      .eq('status', 'active')

    if (error) {
      logError('Error fetching admin emails', error, 'emailHelpers')
      return []
    }

    return data?.map(admin => admin.email) || []
  } catch (error) {
    logError('Error fetching admin emails', error, 'emailHelpers')
    return []
  }
}

/**
 * Convert booking with details to email data
 */
export function bookingToEmailData(booking: BookingWithDetails): BookingEmailData {
  const property = booking.property as any
  const guest = booking.guest as any

  return {
    bookingId: booking.id,
    guestName: guest ? `${guest.first_name || ''} ${guest.last_name || ''}`.trim() || guest.email : 'Guest',
    guestEmail: guest?.email || '',
    propertyTitle: property?.title || 'Property',
    propertyAddress: property ? `${property.address || ''}, ${property.city || ''}, ${property.state || ''}`.trim() : '',
    checkInDate: booking.check_in_date,
    checkOutDate: booking.check_out_date,
    totalNights: booking.total_nights,
    totalAmount: booking.total_amount,
    bookingStatus: booking.status,
    paymentMethod: booking.payment_method || undefined,
    paymentReference: booking.payment_reference || undefined,
    paymentExpiresAt: booking.payment_expires_at || undefined,
    specialRequests: booking.special_requests || undefined,
    cancellationReason: booking.cancellation_reason || undefined,
  }
}

