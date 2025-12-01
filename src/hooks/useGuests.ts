import { useState, useEffect, useCallback } from 'react'
import { guestQueries } from '../lib/queries'
import type {
  Guest,
  CreateGuestInput
} from '../types/database'

// Hook for fetching a single guest
export const useGuest = (id: string) => {
  const [guest, setGuest] = useState<Guest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGuest = useCallback(async () => {
    if (!id) {
      setLoading(false)
      setGuest(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await guestQueries.getById(id)
      setGuest(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch guest')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchGuest()
  }, [fetchGuest])

  return { guest, loading, error, refetch: fetchGuest }
}

// Hook for fetching guest by email
export const useGuestByEmail = (email: string) => {
  const [guest, setGuest] = useState<Guest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGuest = useCallback(async () => {
    // If no email, set loading to false and return
    if (!email || email.trim() === '') {
      setLoading(false)
      setGuest(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await guestQueries.getByEmail(email)
      setGuest(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch guest by email')
      setGuest(null)
    } finally {
      setLoading(false)
    }
  }, [email])

  useEffect(() => {
    fetchGuest()
  }, [fetchGuest])

  return { guest, loading, error, refetch: fetchGuest }
}

// Hook for creating a guest
export const useCreateGuest = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createGuest = useCallback(async (input: CreateGuestInput) => {
    setLoading(true)
    setError(null)

    try {
      const guest = await guestQueries.create(input)
      return guest
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create guest'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { createGuest, loading, error }
}

// Hook for updating a guest
export const useUpdateGuest = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateGuest = useCallback(async (id: string, updates: Partial<CreateGuestInput>) => {
    setLoading(true)
    setError(null)

    try {
      const guest = await guestQueries.update(id, updates)
      return guest
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update guest'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { updateGuest, loading, error }
}

// Hook for deleting a guest
export const useDeleteGuest = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteGuest = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const success = await guestQueries.delete(id)
      return success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete guest'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { deleteGuest, loading, error }
}

// Hook for getting or creating a guest
export const useGetOrCreateGuest = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getOrCreateGuest = useCallback(async (input: CreateGuestInput) => {
    setLoading(true)
    setError(null)

    try {
      const guest = await guestQueries.getOrCreate(input)
      return guest
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get or create guest'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { getOrCreateGuest, loading, error }
}

// Hook for updating guest preferences
export const useUpdateGuestPreferences = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updatePreferences = useCallback(async (id: string, preferences: Record<string, any>) => {
    setLoading(true)
    setError(null)

    try {
      const guest = await guestQueries.updatePreferences(id, preferences)
      return guest
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update guest preferences'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { updatePreferences, loading, error }
}

// Hook for guest statistics
export const useGuestStats = () => {
  const [stats, setStats] = useState<{
    total: number
    active: number
    inactive: number
    blocked: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await guestQueries.getStats()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch guest stats')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refetch: fetchStats }
}
