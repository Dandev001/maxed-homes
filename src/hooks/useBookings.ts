import { useState, useEffect, useCallback } from 'react'
import { bookingQueries } from '../lib/queries'
import type {
  Booking,
  BookingWithDetails,
  CreateBookingInput,
  BookingFilters,
  PaginatedResponse
} from '../types/database'
import { sendBookingRequestCreatedEmail, sendAdminNewBookingEmail } from '../lib/email'
import { bookingToEmailData, getAdminEmails } from '../lib/email/helpers'
import { logError, logDebug } from '../utils/logger'

// Hook for fetching a single booking
export const useBooking = (id: string) => {
  const [booking, setBooking] = useState<BookingWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBooking = useCallback(async () => {
    if (!id) return

    setLoading(true)
    setError(null)

    try {
      const data = await bookingQueries.getById(id)
      setBooking(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch booking')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchBooking()
  }, [fetchBooking])

  return { booking, loading, error, refetch: fetchBooking }
}

// Hook for fetching bookings by guest
export const useGuestBookings = (guestId: string, limit: number = 20) => {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBookings = useCallback(async () => {
    if (!guestId) {
      setLoading(false)
      setBookings([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await bookingQueries.getByGuest(guestId, limit)
      setBookings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch guest bookings')
    } finally {
      setLoading(false)
    }
  }, [guestId, limit])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  return { bookings, loading, error, refetch: fetchBookings }
}

// Hook for fetching bookings by property
export const usePropertyBookings = (propertyId: string, limit: number = 20) => {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBookings = useCallback(async () => {
    if (!propertyId) return

    setLoading(true)
    setError(null)

    try {
      const data = await bookingQueries.getByProperty(propertyId, limit)
      setBookings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch property bookings')
    } finally {
      setLoading(false)
    }
  }, [propertyId, limit])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  return { bookings, loading, error, refetch: fetchBookings }
}

// Hook for searching bookings
export const useBookingSearch = (filters: BookingFilters, page: number = 1, limit: number = 20) => {
  const [results, setResults] = useState<PaginatedResponse<BookingWithDetails> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (searchFilters: BookingFilters, searchPage: number = 1) => {
    setLoading(true)
    setError(null)

    try {
      const data = await bookingQueries.search(searchFilters, searchPage, limit)
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search bookings')
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    search(filters, page)
  }, [search, filters, page])

  return { results, loading, error, search }
}

// Hook for checking availability
export const useAvailabilityCheck = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkAvailability = useCallback(async (
    propertyId: string,
    checkInDate: string,
    checkOutDate: string
  ) => {
    setLoading(true)
    setError(null)

    try {
      const result = await bookingQueries.checkAvailability(propertyId, checkInDate, checkOutDate)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check availability'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { checkAvailability, loading, error }
}

// Hook for creating a booking
export const useCreateBooking = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createBooking = useCallback(async (input: CreateBookingInput) => {
    setLoading(true)
    setError(null)

    try {
      const booking = await bookingQueries.create(input)
      
      // Send email notifications (non-blocking)
      if (booking) {
        try {
          const bookingWithDetails = await bookingQueries.getById(booking.id)
          if (bookingWithDetails) {
            const emailData = bookingToEmailData(bookingWithDetails)
            
            // Send to guest
            sendBookingRequestCreatedEmail(emailData).catch(err => {
              logError('Failed to send booking request email to guest', err, 'useCreateBooking')
            })
            
            // Send to admins
            const adminEmails = await getAdminEmails()
            adminEmails.forEach(adminEmail => {
              sendAdminNewBookingEmail(emailData, adminEmail).catch(err => {
                logError('Failed to send admin notification email', err, 'useCreateBooking')
              })
            })
          }
        } catch (emailError) {
          // Don't fail booking creation if email fails
          logError('Error sending booking emails', emailError, 'useCreateBooking')
        }
      }
      
      return booking
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create booking'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { createBooking, loading, error }
}

// Hook for updating booking status
export const useUpdateBookingStatus = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateStatus = useCallback(async (id: string, status: string, cancellationReason?: string) => {
    setLoading(true)
    setError(null)

    try {
      const booking = await bookingQueries.updateStatus(id, status, cancellationReason)
      return booking
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update booking status'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { updateStatus, loading, error }
}

// Hook for cancelling a booking
export const useCancelBooking = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cancelBooking = useCallback(async (id: string, reason: string) => {
    setLoading(true)
    setError(null)

    try {
      const booking = await bookingQueries.cancel(id, reason)
      
      // Send email notification (non-blocking)
      if (booking) {
        try {
          const bookingWithDetails = await bookingQueries.getById(id)
          if (bookingWithDetails) {
            const emailData = bookingToEmailData(bookingWithDetails)
            const { sendBookingCancelledEmail } = await import('../lib/email')
            sendBookingCancelledEmail(emailData).catch(err => {
              logError('Failed to send booking cancelled email', err, 'useCancelBooking')
            })
          }
        } catch (emailError) {
          logError('Error sending booking cancelled email', emailError, 'useCancelBooking')
        }
      }
      
      return booking
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel booking'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { cancelBooking, loading, error }
}

// Hook for confirming a booking
export const useConfirmBooking = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirmBooking = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const booking = await bookingQueries.confirm(id)
      
      // Send email notification (non-blocking)
      if (booking) {
        try {
          const bookingWithDetails = await bookingQueries.getById(id)
          if (bookingWithDetails) {
            const emailData = bookingToEmailData(bookingWithDetails)
            const { sendBookingApprovedEmail } = await import('../lib/email')
            sendBookingApprovedEmail(emailData).catch(err => {
              logError('Failed to send booking approved email', err, 'useConfirmBooking')
            })
          }
        } catch (emailError) {
          logError('Error sending booking approved email', emailError, 'useConfirmBooking')
        }
      }
      
      return booking
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to confirm booking'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { confirmBooking, loading, error }
}

// Hook for booking statistics
export const useBookingStats = (propertyId?: string, guestId?: string) => {
  const [stats, setStats] = useState<{
    total: number
    confirmed: number
    pending: number
    cancelled: number
    completed: number
    totalRevenue: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await bookingQueries.getStats(propertyId, guestId)
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch booking stats')
    } finally {
      setLoading(false)
    }
  }, [propertyId, guestId])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refetch: fetchStats }
}

// Hook for revenue over time
export const useRevenueOverTime = (days: number = 7) => {
  const [data, setData] = useState<Array<{ date: string; revenue: number }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await bookingQueries.getRevenueOverTime(days)
      setData(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch revenue data'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

// Hook for marking payment as paid (guest)
export const useMarkAsPaid = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const markAsPaid = useCallback(async (
    id: string,
    paymentMethod: string,
    paymentReference: string,
    paymentProofUrl?: string
  ) => {
    setLoading(true)
    setError(null)

    try {
      const booking = await bookingQueries.markAsPaid(id, paymentMethod, paymentReference, paymentProofUrl)
      
      // Send email notifications (non-blocking)
      if (booking) {
        try {
          const bookingWithDetails = await bookingQueries.getById(id)
          if (bookingWithDetails) {
            const emailData = bookingToEmailData(bookingWithDetails)
            
            // Send to guest
            const { sendPaymentReceivedEmail } = await import('../lib/email')
            sendPaymentReceivedEmail(emailData).catch(err => {
              logError('Failed to send payment received email to guest', err, 'useMarkAsPaid')
            })
            
            // Send to admins
            const adminEmails = await getAdminEmails()
            const { sendAdminPaymentAwaitingEmail } = await import('../lib/email')
            adminEmails.forEach(adminEmail => {
              sendAdminPaymentAwaitingEmail(emailData, adminEmail).catch(err => {
                logError('Failed to send admin payment notification email', err, 'useMarkAsPaid')
              })
            })
          }
        } catch (emailError) {
          logError('Error sending payment emails', emailError, 'useMarkAsPaid')
        }
      }
      
      return booking
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark payment as paid'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { markAsPaid, loading, error }
}

// Hook for confirming payment (admin)
export const useConfirmPayment = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirmPayment = useCallback(async (id: string, notes?: string) => {
    setLoading(true)
    setError(null)

    try {
      const booking = await bookingQueries.confirmPayment(id, notes)
      
      // Send email notification (non-blocking)
      if (booking) {
        try {
          const bookingWithDetails = await bookingQueries.getById(id)
          if (bookingWithDetails) {
            const emailData = bookingToEmailData(bookingWithDetails)
            const { sendBookingConfirmedEmail } = await import('../lib/email')
            sendBookingConfirmedEmail(emailData).catch(err => {
              logError('Failed to send booking confirmed email', err, 'useConfirmPayment')
            })
          }
        } catch (emailError) {
          logError('Error sending booking confirmed email', emailError, 'useConfirmPayment')
        }
      }
      
      return booking
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to confirm payment'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { confirmPayment, loading, error }
}

// Hook for rejecting payment (admin)
export const useRejectPayment = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rejectPayment = useCallback(async (id: string, reason: string) => {
    setLoading(true)
    setError(null)

    try {
      const booking = await bookingQueries.rejectPayment(id, reason)
      return booking
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject payment'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { rejectPayment, loading, error }
}

// Hook for expiring unpaid bookings (admin/system use)
export const useExpireUnpaidBookings = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const expireUnpaidBookings = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await bookingQueries.expireUnpaidBookings()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to expire unpaid bookings'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { expireUnpaidBookings, loading, error }
}