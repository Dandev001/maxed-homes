import { useState, useEffect, useCallback } from 'react'
import { paymentConfigQueries } from '../lib/queries/paymentConfig'
import type { PaymentConfig } from '../types/database'

/**
 * Hook to fetch active payment configs (for guests)
 * Payment details are fetched from backend to prevent frontend tampering
 */
export const usePaymentConfig = () => {
  const [paymentConfigs, setPaymentConfigs] = useState<PaymentConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPaymentConfigs = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const configs = await paymentConfigQueries.getActive()
      setPaymentConfigs(configs)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payment details'
      setError(errorMessage)
      console.error('Error fetching payment config:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPaymentConfigs()
  }, [fetchPaymentConfigs])

  return {
    paymentConfigs,
    loading,
    error,
    refetch: fetchPaymentConfigs,
  }
}

/**
 * Hook to fetch all payment configs (admin only)
 */
export const useAllPaymentConfigs = () => {
  const [paymentConfigs, setPaymentConfigs] = useState<PaymentConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPaymentConfigs = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const configs = await paymentConfigQueries.getAll()
      setPaymentConfigs(configs)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payment configs'
      setError(errorMessage)
      console.error('Error fetching payment configs:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPaymentConfigs()
  }, [fetchPaymentConfigs])

  return {
    paymentConfigs,
    loading,
    error,
    refetch: fetchPaymentConfigs,
  }
}

