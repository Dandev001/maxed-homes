// React hooks for email notifications
import { useState, useCallback } from 'react'
import {
  sendBookingRequestCreatedEmail,
  sendBookingApprovedEmail,
  sendBookingRejectedEmail,
  sendPaymentReceivedEmail,
  sendBookingConfirmedEmail,
  sendBookingCancelledEmail,
  sendAdminNewBookingEmail,
  sendAdminPaymentAwaitingEmail,
} from '../lib/email'
import type { BookingEmailData } from '../lib/email/types'
import { logError } from '../utils/logger'

/**
 * Hook for sending booking request created email
 */
export function useSendBookingRequestEmail() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = useCallback(async (data: BookingEmailData) => {
    setLoading(true)
    setError(null)

    try {
      const result = await sendBookingRequestCreatedEmail(data)
      if (!result.success) {
        throw new Error(result.error || 'Failed to send email')
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send email'
      setError(errorMessage)
      logError('Failed to send booking request email', err, 'useEmail')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { send, loading, error }
}

/**
 * Hook for sending booking approved email
 */
export function useSendBookingApprovedEmail() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = useCallback(async (data: BookingEmailData) => {
    setLoading(true)
    setError(null)

    try {
      const result = await sendBookingApprovedEmail(data)
      if (!result.success) {
        throw new Error(result.error || 'Failed to send email')
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send email'
      setError(errorMessage)
      logError('Failed to send booking approved email', err, 'useEmail')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { send, loading, error }
}

/**
 * Hook for sending booking rejected email
 */
export function useSendBookingRejectedEmail() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = useCallback(async (data: BookingEmailData) => {
    setLoading(true)
    setError(null)

    try {
      const result = await sendBookingRejectedEmail(data)
      if (!result.success) {
        throw new Error(result.error || 'Failed to send email')
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send email'
      setError(errorMessage)
      logError('Failed to send booking rejected email', err, 'useEmail')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { send, loading, error }
}

/**
 * Hook for sending payment received email
 */
export function useSendPaymentReceivedEmail() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = useCallback(async (data: BookingEmailData) => {
    setLoading(true)
    setError(null)

    try {
      const result = await sendPaymentReceivedEmail(data)
      if (!result.success) {
        throw new Error(result.error || 'Failed to send email')
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send email'
      setError(errorMessage)
      logError('Failed to send payment received email', err, 'useEmail')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { send, loading, error }
}

/**
 * Hook for sending booking confirmed email
 */
export function useSendBookingConfirmedEmail() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = useCallback(async (data: BookingEmailData) => {
    setLoading(true)
    setError(null)

    try {
      const result = await sendBookingConfirmedEmail(data)
      if (!result.success) {
        throw new Error(result.error || 'Failed to send email')
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send email'
      setError(errorMessage)
      logError('Failed to send booking confirmed email', err, 'useEmail')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { send, loading, error }
}

/**
 * Hook for sending booking cancelled email
 */
export function useSendBookingCancelledEmail() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = useCallback(async (data: BookingEmailData) => {
    setLoading(true)
    setError(null)

    try {
      const result = await sendBookingCancelledEmail(data)
      if (!result.success) {
        throw new Error(result.error || 'Failed to send email')
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send email'
      setError(errorMessage)
      logError('Failed to send booking cancelled email', err, 'useEmail')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { send, loading, error }
}

/**
 * Hook for sending admin notifications
 */
export function useSendAdminEmail() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendNewBooking = useCallback(async (data: BookingEmailData, adminEmail: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await sendAdminNewBookingEmail(data, adminEmail)
      if (!result.success) {
        throw new Error(result.error || 'Failed to send email')
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send email'
      setError(errorMessage)
      logError('Failed to send admin new booking email', err, 'useEmail')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const sendPaymentAwaiting = useCallback(async (data: BookingEmailData, adminEmail: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await sendAdminPaymentAwaitingEmail(data, adminEmail)
      if (!result.success) {
        throw new Error(result.error || 'Failed to send email')
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send email'
      setError(errorMessage)
      logError('Failed to send admin payment awaiting email', err, 'useEmail')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { sendNewBooking, sendPaymentAwaiting, loading, error }
}

