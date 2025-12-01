import { useState, useEffect, useCallback } from 'react'
import { reviewQueries } from '../lib/queries/reviews'
import type { ReviewWithDetails, CreateReviewInput } from '../types/database'

// Hook for fetching reviews for a property
export const useReviews = (propertyId: string) => {
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReviews = useCallback(async () => {
    if (!propertyId) return

    setLoading(true)
    setError(null)

    try {
      const data = await reviewQueries.getByProperty(propertyId)
      setReviews(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews')
    } finally {
      setLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  return { reviews, loading, error, refetch: fetchReviews }
}

// Hook for fetching property rating statistics
export const usePropertyRating = (propertyId: string) => {
  const [rating, setRating] = useState<{ averageRating: number; totalReviews: number }>({
    averageRating: 0,
    totalReviews: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRating = useCallback(async () => {
    if (!propertyId) return

    setLoading(true)
    setError(null)

    try {
      const stats = await reviewQueries.getPropertyRatingStats(propertyId)
      setRating(stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rating')
    } finally {
      setLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    fetchRating()
  }, [fetchRating])

  return { rating, loading, error, refetch: fetchRating }
}

// Hook for creating a review
export const useCreateReview = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createReview = useCallback(async (input: CreateReviewInput) => {
    setLoading(true)
    setError(null)

    try {
      const review = await reviewQueries.create(input)
      if (!review) {
        throw new Error('Failed to create review')
      }
      return review
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create review'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { createReview, loading, error }
}

// Hook for checking if guest can review a property
export const useCanGuestReview = (propertyId: string, guestId: string | null) => {
  const [canReview, setCanReview] = useState<{
    canReview: boolean
    bookingId?: string
    reason?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkCanReview = useCallback(async () => {
    if (!propertyId || !guestId) {
      setCanReview({ canReview: false, reason: 'Guest ID required' })
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await reviewQueries.canGuestReview(propertyId, guestId)
      setCanReview(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check review eligibility'
      setError(errorMessage)
      setCanReview({ canReview: false, reason: errorMessage })
    } finally {
      setLoading(false)
    }
  }, [propertyId, guestId])

  useEffect(() => {
    checkCanReview()
  }, [checkCanReview])

  return { canReview, loading, error, refetch: checkCanReview }
}

// Hook for fetching reviews written by a guest
export const useGuestReviews = (guestId: string) => {
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReviews = useCallback(async () => {
    if (!guestId) {
      setLoading(false)
      setReviews([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await reviewQueries.getByGuest(guestId)
      setReviews(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews')
    } finally {
      setLoading(false)
    }
  }, [guestId])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  return { reviews, loading, error, refetch: fetchReviews }
}

