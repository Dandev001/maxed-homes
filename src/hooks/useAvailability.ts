import { useState, useEffect, useCallback } from 'react'
import { availabilityQueries } from '../lib/queries'
import type {
  AvailabilityCalendar,
  CreateAvailabilityInput,
  AvailabilityFilters
} from '../types/database'

// Hook for fetching availability by property and date range
export const useAvailability = (
  propertyId: string,
  startDate: string,
  endDate: string
) => {
  const [availability, setAvailability] = useState<AvailabilityCalendar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAvailability = useCallback(async () => {
    if (!propertyId || !startDate || !endDate) return

    setLoading(true)
    setError(null)

    try {
      const data = await availabilityQueries.getByPropertyAndDateRange(
        propertyId,
        startDate,
        endDate
      )
      setAvailability(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch availability')
    } finally {
      setLoading(false)
    }
  }, [propertyId, startDate, endDate])

  useEffect(() => {
    fetchAvailability()
  }, [fetchAvailability])

  return { availability, loading, error, refetch: fetchAvailability }
}

// Hook for fetching available dates
export const useAvailableDates = (
  propertyId: string,
  startDate: string,
  endDate: string
) => {
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAvailableDates = useCallback(async () => {
    if (!propertyId || !startDate || !endDate) return

    setLoading(true)
    setError(null)

    try {
      const dates = await availabilityQueries.getAvailableDates(
        propertyId,
        startDate,
        endDate
      )
      setAvailableDates(dates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch available dates')
    } finally {
      setLoading(false)
    }
  }, [propertyId, startDate, endDate])

  useEffect(() => {
    fetchAvailableDates()
  }, [fetchAvailableDates])

  return { availableDates, loading, error, refetch: fetchAvailableDates }
}

// Hook for fetching unavailable dates
export const useUnavailableDates = (
  propertyId: string,
  startDate: string,
  endDate: string
) => {
  const [unavailableDates, setUnavailableDates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUnavailableDates = useCallback(async () => {
    if (!propertyId || !startDate || !endDate) return

    setLoading(true)
    setError(null)

    try {
      const dates = await availabilityQueries.getUnavailableDates(
        propertyId,
        startDate,
        endDate
      )
      setUnavailableDates(dates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch unavailable dates')
    } finally {
      setLoading(false)
    }
  }, [propertyId, startDate, endDate])

  useEffect(() => {
    fetchUnavailableDates()
  }, [fetchUnavailableDates])

  return { unavailableDates, loading, error, refetch: fetchUnavailableDates }
}

// Hook for checking specific dates availability
export const useDatesAvailability = (
  propertyId: string,
  dates: string[]
) => {
  const [datesAvailability, setDatesAvailability] = useState<{ [date: string]: boolean }>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkDates = useCallback(async () => {
    if (!propertyId || dates.length === 0) return

    setLoading(true)
    setError(null)

    try {
      const result = await availabilityQueries.checkDatesAvailable(propertyId, dates)
      setDatesAvailability(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check dates availability')
    } finally {
      setLoading(false)
    }
  }, [propertyId, dates])

  useEffect(() => {
    checkDates()
  }, [checkDates])

  return { datesAvailability, loading, error, refetch: checkDates }
}

// Hook for monthly calendar
export const useMonthlyCalendar = (
  propertyId: string,
  year: number,
  month: number
) => {
  const [calendar, setCalendar] = useState<AvailabilityCalendar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCalendar = useCallback(async () => {
    if (!propertyId) return

    setLoading(true)
    setError(null)

    try {
      const data = await availabilityQueries.getMonthlyCalendar(propertyId, year, month)
      setCalendar(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch monthly calendar')
    } finally {
      setLoading(false)
    }
  }, [propertyId, year, month])

  useEffect(() => {
    fetchCalendar()
  }, [fetchCalendar])

  return { calendar, loading, error, refetch: fetchCalendar }
}

// Hook for bulk updating availability
export const useBulkUpdateAvailability = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bulkUpdate = useCallback(async (updates: CreateAvailabilityInput[]) => {
    setLoading(true)
    setError(null)

    try {
      const result = await availabilityQueries.bulkUpdate(updates)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk update availability'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { bulkUpdate, loading, error }
}

// Hook for setting unavailable dates
export const useSetUnavailable = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setUnavailable = useCallback(async (
    propertyId: string,
    dates: string[],
    reason?: string
  ) => {
    setLoading(true)
    setError(null)

    try {
      const result = await availabilityQueries.setUnavailable(propertyId, dates, reason)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set unavailable dates'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { setUnavailable, loading, error }
}

// Hook for setting available dates
export const useSetAvailable = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setAvailable = useCallback(async (
    propertyId: string,
    dates: string[],
    priceOverride?: number,
    minimumNightsOverride?: number
  ) => {
    setLoading(true)
    setError(null)

    try {
      const result = await availabilityQueries.setAvailable(
        propertyId,
        dates,
        priceOverride,
        minimumNightsOverride
      )
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set available dates'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { setAvailable, loading, error }
}

// Hook for setting price override
export const useSetPriceOverride = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setPriceOverride = useCallback(async (
    propertyId: string,
    dates: string[],
    price: number
  ) => {
    setLoading(true)
    setError(null)

    try {
      const result = await availabilityQueries.setPriceOverride(propertyId, dates, price)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set price override'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { setPriceOverride, loading, error }
}

// Hook for generating availability
export const useGenerateAvailability = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateAvailability = useCallback(async (
    propertyId: string,
    startDate: string,
    endDate: string,
    defaultAvailable: boolean = true,
    defaultPrice?: number
  ) => {
    setLoading(true)
    setError(null)

    try {
      const result = await availabilityQueries.generateAvailability(
        propertyId,
        startDate,
        endDate,
        defaultAvailable,
        defaultPrice
      )
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate availability'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { generateAvailability, loading, error }
}

// Hook for availability statistics
export const useAvailabilityStats = (
  propertyId: string,
  startDate: string,
  endDate: string
) => {
  const [stats, setStats] = useState<{
    totalDays: number
    availableDays: number
    unavailableDays: number
    occupancyRate: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!propertyId || !startDate || !endDate) return

    setLoading(true)
    setError(null)

    try {
      const data = await availabilityQueries.getStats(propertyId, startDate, endDate)
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch availability stats')
    } finally {
      setLoading(false)
    }
  }, [propertyId, startDate, endDate])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refetch: fetchStats }
}

// Hook for searching availability
export const useAvailabilitySearch = (filters: AvailabilityFilters) => {
  const [results, setResults] = useState<AvailabilityCalendar[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (searchFilters: AvailabilityFilters) => {
    setLoading(true)
    setError(null)

    try {
      const data = await availabilityQueries.search(searchFilters)
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search availability')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    search(filters)
  }, [search, filters])

  return { results, loading, error, search }
}
