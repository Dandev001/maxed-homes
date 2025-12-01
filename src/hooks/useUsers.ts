import { useState, useEffect, useCallback } from 'react'
import { guestQueries } from '../lib/queries/guests'
import { hostQueries } from '../lib/queries/hosts'
import { bookingQueries } from '../lib/queries/bookings'
import type { Guest, Host } from '../types/database'

// Hook for fetching all guests (admin)
export const useAllGuests = (page: number = 1, limit: number = 50) => {
  const [guests, setGuests] = useState<Guest[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGuests = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await guestQueries.getAll(page, limit)
      setGuests(result.data)
      setTotal(result.total)
      setTotalPages(result.total_pages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch guests')
      setGuests([])
    } finally {
      setLoading(false)
    }
  }, [page, limit])

  useEffect(() => {
    fetchGuests()
  }, [fetchGuests])

  return { guests, total, totalPages, loading, error, refetch: fetchGuests }
}

// Hook for fetching all hosts (admin)
export const useAllHosts = (page: number = 1, limit: number = 50) => {
  const [hosts, setHosts] = useState<Host[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHosts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await hostQueries.getAll(page, limit)
      setHosts(result.data)
      setTotal(result.total)
      setTotalPages(result.total_pages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch hosts')
      setHosts([])
    } finally {
      setLoading(false)
    }
  }, [page, limit])

  useEffect(() => {
    fetchHosts()
  }, [fetchHosts])

  return { hosts, total, totalPages, loading, error, refetch: fetchHosts }
}

// Hook for getting booking count for a guest
export const useGuestBookingCount = (guestId: string | null) => {
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!guestId) {
      setCount(null)
      return
    }

    const fetchCount = async () => {
      setLoading(true)
      try {
        const stats = await bookingQueries.getStats(undefined, guestId)
        setCount(stats.total)
      } catch (err) {
        console.error('Error fetching guest booking count:', err)
        setCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchCount()
  }, [guestId])

  return { count, loading }
}

// Hook for getting property count for a host
export const useHostPropertyCount = (hostId: string | null) => {
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!hostId) {
      setCount(null)
      return
    }

    const fetchCount = async () => {
      setLoading(true)
      try {
        const propertyCount = await hostQueries.getPropertyCount(hostId)
        setCount(propertyCount)
      } catch (err) {
        console.error('Error fetching host property count:', err)
        setCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchCount()
  }, [hostId])

  return { count, loading }
}

// Hook for host statistics
export const useHostStats = () => {
  const [stats, setStats] = useState<{
    total: number
    active: number
    inactive: number
    suspended: number
    pending_verification: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await hostQueries.getStats()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch host stats')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refetch: fetchStats }
}

// Hook for updating a host
export const useUpdateHost = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateHost = useCallback(async (id: string, updates: Partial<{
    email: string
    first_name: string
    last_name: string
    phone: string | null
    company_name: string | null
    profile_image_url: string | null
    bio: string | null
    status: string
    is_verified: boolean
  }>) => {
    setLoading(true)
    setError(null)

    try {
      const host = await hostQueries.update(id, updates)
      return host
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update host'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { updateHost, loading, error }
}

