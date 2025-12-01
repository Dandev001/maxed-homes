import { useState, useCallback } from 'react'
import { paymentQueries } from '../lib/queries/payments'

export const useUploadPaymentProof = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadProof = useCallback(async (file: File, bookingId: string) => {
    setLoading(true)
    setError(null)

    try {
      const url = await paymentQueries.uploadPaymentProof(file, bookingId)
      if (!url) {
        throw new Error('Failed to upload payment proof')
      }
      return url
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload payment proof'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { uploadProof, loading, error }
}

