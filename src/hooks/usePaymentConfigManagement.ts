import { useState, useCallback } from 'react'
import { paymentConfigQueries } from '../lib/queries/paymentConfig'
import type { PaymentConfig, CreatePaymentConfigInput, UpdatePaymentConfigInput } from '../types/database'

/**
 * Hook for managing payment configs (admin only)
 * Includes create, update, and delete operations
 */
export const usePaymentConfigManagement = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createPaymentConfig = useCallback(async (input: CreatePaymentConfigInput): Promise<PaymentConfig | null> => {
    setLoading(true)
    setError(null)

    try {
      const config = await paymentConfigQueries.create(input)
      if (!config) {
        throw new Error('Failed to create payment config')
      }
      return config
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create payment config'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const updatePaymentConfig = useCallback(async (id: string, input: UpdatePaymentConfigInput): Promise<PaymentConfig | null> => {
    setLoading(true)
    setError(null)

    try {
      const config = await paymentConfigQueries.update(id, input)
      if (!config) {
        throw new Error('Failed to update payment config')
      }
      return config
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update payment config'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const deletePaymentConfig = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const success = await paymentConfigQueries.delete(id)
      if (!success) {
        throw new Error('Failed to delete payment config')
      }
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete payment config'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    createPaymentConfig,
    updatePaymentConfig,
    deletePaymentConfig,
    loading,
    error,
  }
}

