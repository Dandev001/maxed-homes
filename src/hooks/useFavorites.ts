import { useState, useEffect, useCallback } from 'react'
import { favoriteQueries } from '../lib/queries'
import type {
  Favorite,
  FavoriteWithDetails
} from '../types/database'

// Hook for fetching all favorites for a guest
export const useGuestFavorites = (guestId: string | null) => {
  const [favorites, setFavorites] = useState<FavoriteWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFavorites = useCallback(async () => {
    if (!guestId) {
      setLoading(false)
      setFavorites([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await favoriteQueries.getByGuest(guestId)
      setFavorites(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch favorites')
    } finally {
      setLoading(false)
    }
  }, [guestId])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  return { favorites, loading, error, refetch: fetchFavorites }
}

// Hook for checking if a property is favorited
export const useIsFavorited = (guestId: string | null, propertyId: string) => {
  const [isFavorited, setIsFavorited] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkFavorited = useCallback(async () => {
    if (!guestId) {
      setLoading(false)
      setIsFavorited(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const favorited = await favoriteQueries.isFavorited(guestId, propertyId)
      setIsFavorited(favorited)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check favorite status')
    } finally {
      setLoading(false)
    }
  }, [guestId, propertyId])

  useEffect(() => {
    checkFavorited()
  }, [checkFavorited])

  return { isFavorited, loading, error, refetch: checkFavorited }
}

// Hook for getting favorite property IDs (lightweight)
export const useFavoritePropertyIds = (guestId: string | null) => {
  const [propertyIds, setPropertyIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPropertyIds = useCallback(async () => {
    if (!guestId) {
      setLoading(false)
      setPropertyIds([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const ids = await favoriteQueries.getFavoritePropertyIds(guestId)
      setPropertyIds(ids)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch favorite property IDs')
    } finally {
      setLoading(false)
    }
  }, [guestId])

  useEffect(() => {
    fetchPropertyIds()
  }, [fetchPropertyIds])

  return { propertyIds, loading, error, refetch: fetchPropertyIds }
}

// Hook for toggling a favorite
export const useToggleFavorite = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleFavorite = useCallback(async (guestId: string, propertyId: string) => {
    if (!guestId) {
      throw new Error('Guest ID is required')
    }

    setLoading(true)
    setError(null)

    try {
      const result = await favoriteQueries.toggle(guestId, propertyId)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle favorite'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { toggleFavorite, loading, error }
}

// Hook for adding a favorite
export const useAddFavorite = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addFavorite = useCallback(async (guestId: string, propertyId: string) => {
    if (!guestId) {
      throw new Error('Guest ID is required')
    }

    setLoading(true)
    setError(null)

    try {
      const favorite = await favoriteQueries.create({ guest_id: guestId, property_id: propertyId })
      return favorite
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add favorite'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { addFavorite, loading, error }
}

// Hook for removing a favorite
export const useRemoveFavorite = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const removeFavorite = useCallback(async (guestId: string, propertyId: string) => {
    if (!guestId) {
      throw new Error('Guest ID is required')
    }

    setLoading(true)
    setError(null)

    try {
      const success = await favoriteQueries.delete(guestId, propertyId)
      return success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove favorite'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { removeFavorite, loading, error }
}

// Hook for getting property favorite count
export const usePropertyFavoriteCount = (propertyId: string) => {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCount = useCallback(async () => {
    if (!propertyId) {
      setLoading(false)
      setCount(0)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const favoriteCount = await favoriteQueries.getPropertyFavoriteCount(propertyId)
      setCount(favoriteCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch favorite count')
    } finally {
      setLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    fetchCount()
  }, [fetchCount])

  return { count, loading, error, refetch: fetchCount }
}


