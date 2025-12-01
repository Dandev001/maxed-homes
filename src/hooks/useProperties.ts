import { useState, useEffect, useCallback, useMemo } from 'react'
import { propertyQueries } from '../lib/queries'
import type {
  Property,
  PropertyWithImages,
  CreatePropertyInput,
  PropertyFilters,
  SearchParams,
  PaginatedResponse
} from '../types/database'

// Hook for fetching a single property
export const useProperty = (id: string) => {
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProperty = useCallback(async () => {
    if (!id) return

    setLoading(true)
    setError(null)

    try {
      const data = await propertyQueries.getById(id)
      setProperty(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch property')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchProperty()
  }, [fetchProperty])

  return { property, loading, error, refetch: fetchProperty }
}

// Hook for fetching a property with images
export const usePropertyWithImages = (id: string) => {
  const [property, setProperty] = useState<PropertyWithImages | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProperty = useCallback(async () => {
    if (!id) return

    setLoading(true)
    setError(null)

    try {
      const data = await propertyQueries.getWithImages(id)
      setProperty(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch property')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchProperty()
  }, [fetchProperty])

  return { property, loading, error, refetch: fetchProperty }
}

// Hook for fetching featured properties
export const useFeaturedProperties = (limit: number = 6) => {
  const [properties, setProperties] = useState<PropertyWithImages[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFeatured = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await propertyQueries.getFeatured(limit)
      setProperties(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch featured properties')
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchFeatured()
  }, [fetchFeatured])

  return { properties, loading, error, refetch: fetchFeatured }
}

// Hook for searching properties
export const usePropertySearch = (params: SearchParams, enabled: boolean = true) => {
  const [results, setResults] = useState<PaginatedResponse<PropertyWithImages> | null>(null)
  // Set initial loading to true when enabled (for first load)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  // Create a stable string representation of filters for dependency tracking
  const filtersKey = useMemo(() => JSON.stringify(params.filters || {}), [params.filters])

  const search = useCallback(async (searchParams: SearchParams) => {
    setLoading(true)
    setError(null)
    // Don't clear results immediately - keep showing previous results while loading
    // This prevents the skeleton from showing when quickly changing filters

    try {
      const data = await propertyQueries.search(searchParams)
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search properties')
      // On error, keep previous results if available
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Don't perform search if not enabled
    if (!enabled) {
      setLoading(false)
      return
    }

    let isCancelled = false
    
    const performSearch = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const data = await propertyQueries.search(params)
        if (!isCancelled) {
          setResults(data)
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Failed to search properties')
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    performSearch()

    return () => {
      isCancelled = true
    }
    // Use individual values to ensure stable dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.query, params.page, params.limit, params.sort_by, params.sort_order, filtersKey, enabled])

  return { results, loading, error, search }
}

// Hook for properties by city
export const usePropertiesByCity = (city: string, limit: number = 12) => {
  const [properties, setProperties] = useState<PropertyWithImages[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchByCity = useCallback(async () => {
    if (!city) return

    setLoading(true)
    setError(null)

    try {
      const data = await propertyQueries.getByCity(city, limit)
      setProperties(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch properties by city')
    } finally {
      setLoading(false)
    }
  }, [city, limit])

  useEffect(() => {
    fetchByCity()
  }, [fetchByCity])

  return { properties, loading, error, refetch: fetchByCity }
}

// Hook for creating a property
export const useCreateProperty = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createProperty = useCallback(async (input: CreatePropertyInput) => {
    setLoading(true)
    setError(null)

    try {
      const property = await propertyQueries.create(input)
      return property
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create property'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { createProperty, loading, error }
}

// Hook for updating a property
export const useUpdateProperty = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateProperty = useCallback(async (id: string, updates: Partial<CreatePropertyInput>) => {
    setLoading(true)
    setError(null)

    try {
      const property = await propertyQueries.update(id, updates)
      return property
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update property'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { updateProperty, loading, error }
}

// Hook for deleting a property
export const useDeleteProperty = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteProperty = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const success = await propertyQueries.delete(id)
      return success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete property'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { deleteProperty, loading, error }
}

// Hook for admin: Get all properties (including inactive)
export const useAllProperties = (params: {
  filters?: PropertyFilters
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  limit?: number
  query?: string
}, enabled: boolean = true) => {
  const [results, setResults] = useState<PaginatedResponse<PropertyWithImages> | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  const filtersKey = useMemo(() => JSON.stringify(params.filters || {}), [params.filters])

  const fetchAll = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      const data = await propertyQueries.getAllForAdmin(params)
      setResults(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch properties'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [params.query, params.page, params.limit, params.sort_by, params.sort_order, filtersKey, enabled])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    fetchAll()
  }, [fetchAll, enabled])

  return { results, loading, error, refetch: fetchAll }
}

// Hook for property statistics
export const usePropertyStats = () => {
  const [stats, setStats] = useState<{
    total: number
    active: number
    inactive: number
    featured: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await propertyQueries.getStats()
      setStats(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch property stats'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refetch: fetchStats }
}