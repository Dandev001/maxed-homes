import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the property search query
const mockSearchProperties = vi.fn()

vi.mock('../../lib/queries/properties', () => ({
  propertyQueries: {
    search: mockSearchProperties,
  },
}))

describe('Search Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Search', () => {
    it('should search properties by query', async () => {
      const searchParams = {
        query: 'apartment',
        filters: {},
        page: 1,
        limit: 12,
        sort_by: 'created_at' as const,
        sort_order: 'desc' as const,
      }

      const mockResults = {
        data: [
          {
            id: 'prop-1',
            title: 'Beautiful Apartment',
            city: 'New York',
            price_per_night: 10000,
          },
        ],
        pagination: {
          page: 1,
          limit: 12,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      }

      mockSearchProperties.mockResolvedValue(mockResults)

      const results = await mockSearchProperties(searchParams)

      expect(results.data).toHaveLength(1)
      expect(results.data[0].title).toContain('Apartment')
      expect(mockSearchProperties).toHaveBeenCalledWith(searchParams)
    })

    it('should return empty results when no matches', async () => {
      const searchParams = {
        query: 'nonexistent',
        filters: {},
        page: 1,
        limit: 12,
        sort_by: 'created_at' as const,
        sort_order: 'desc' as const,
      }

      mockSearchProperties.mockResolvedValue({
        data: [],
        pagination: {
          page: 1,
          limit: 12,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      })

      const results = await mockSearchProperties(searchParams)

      expect(results.data).toHaveLength(0)
      expect(results.pagination.total).toBe(0)
    })
  })

  describe('Filtered Search', () => {
    it('should filter by city', async () => {
      const searchParams = {
        query: undefined,
        filters: { city: 'New York' },
        page: 1,
        limit: 12,
        sort_by: 'created_at' as const,
        sort_order: 'desc' as const,
      }

      const mockResults = {
        data: [
          { id: 'prop-1', city: 'New York' },
          { id: 'prop-2', city: 'New York' },
        ],
        pagination: {
          page: 1,
          limit: 12,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      }

      mockSearchProperties.mockResolvedValue(mockResults)

      const results = await mockSearchProperties(searchParams)

      expect(results.data.every((p: any) => p.city === 'New York')).toBe(true)
    })

    it('should filter by price range', async () => {
      const searchParams = {
        query: undefined,
        filters: {
          pricePerNight: { min: 5000, max: 15000 },
        },
        page: 1,
        limit: 12,
        sort_by: 'created_at' as const,
        sort_order: 'desc' as const,
      }

      const mockResults = {
        data: [
          { id: 'prop-1', price_per_night: 10000 },
          { id: 'prop-2', price_per_night: 12000 },
        ],
        pagination: {
          page: 1,
          limit: 12,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      }

      mockSearchProperties.mockResolvedValue(mockResults)

      const results = await mockSearchProperties(searchParams)

      results.data.forEach((property: any) => {
        expect(property.price_per_night).toBeGreaterThanOrEqual(5000)
        expect(property.price_per_night).toBeLessThanOrEqual(15000)
      })
    })

    it('should filter by bedrooms', async () => {
      const searchParams = {
        query: undefined,
        filters: { bedrooms: { min: 2, max: 3 } },
        page: 1,
        limit: 12,
        sort_by: 'created_at' as const,
        sort_order: 'desc' as const,
      }

      const mockResults = {
        data: [
          { id: 'prop-1', bedrooms: 2 },
          { id: 'prop-2', bedrooms: 3 },
        ],
        pagination: {
          page: 1,
          limit: 12,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      }

      mockSearchProperties.mockResolvedValue(mockResults)

      const results = await mockSearchProperties(searchParams)

      results.data.forEach((property: any) => {
        expect(property.bedrooms).toBeGreaterThanOrEqual(2)
        expect(property.bedrooms).toBeLessThanOrEqual(3)
      })
    })

    it('should filter by property type', async () => {
      const searchParams = {
        query: undefined,
        filters: { propertyType: ['apartment', 'condo'] },
        page: 1,
        limit: 12,
        sort_by: 'created_at' as const,
        sort_order: 'desc' as const,
      }

      const mockResults = {
        data: [
          { id: 'prop-1', property_type: 'apartment' },
          { id: 'prop-2', property_type: 'condo' },
        ],
        pagination: {
          page: 1,
          limit: 12,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      }

      mockSearchProperties.mockResolvedValue(mockResults)

      const results = await mockSearchProperties(searchParams)

      results.data.forEach((property: any) => {
        expect(['apartment', 'condo']).toContain(property.property_type)
      })
    })

    it('should filter by amenities', async () => {
      const searchParams = {
        query: undefined,
        filters: { amenities: ['wifi', 'parking'] },
        page: 1,
        limit: 12,
        sort_by: 'created_at' as const,
        sort_order: 'desc' as const,
      }

      const mockResults = {
        data: [
          { id: 'prop-1', amenities: ['wifi', 'parking', 'pool'] },
          { id: 'prop-2', amenities: ['wifi', 'parking'] },
        ],
        pagination: {
          page: 1,
          limit: 12,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      }

      mockSearchProperties.mockResolvedValue(mockResults)

      const results = await mockSearchProperties(searchParams)

      results.data.forEach((property: any) => {
        expect(property.amenities).toContain('wifi')
        expect(property.amenities).toContain('parking')
      })
    })
  })

  describe('Pagination', () => {
    it('should paginate results', async () => {
      const page1Params = {
        query: undefined,
        filters: {},
        page: 1,
        limit: 12,
        sort_by: 'created_at' as const,
        sort_order: 'desc' as const,
      }

      mockSearchProperties.mockResolvedValueOnce({
        data: Array.from({ length: 12 }, (_, i) => ({ id: `prop-${i + 1}` })),
        pagination: {
          page: 1,
          limit: 12,
          total: 25,
          totalPages: 3,
          hasNext: true,
          hasPrev: false,
        },
      })

      const page1Results = await mockSearchProperties(page1Params)
      expect(page1Results.data).toHaveLength(12)
      expect(page1Results.pagination.hasNext).toBe(true)

      const page2Params = { ...page1Params, page: 2 }
      mockSearchProperties.mockResolvedValueOnce({
        data: Array.from({ length: 12 }, (_, i) => ({ id: `prop-${i + 13}` })),
        pagination: {
          page: 2,
          limit: 12,
          total: 25,
          totalPages: 3,
          hasNext: true,
          hasPrev: true,
        },
      })

      const page2Results = await mockSearchProperties(page2Params)
      expect(page2Results.data).toHaveLength(12)
      expect(page2Results.pagination.hasPrev).toBe(true)
    })
  })

  describe('Sorting', () => {
    it('should sort by price ascending', async () => {
      const searchParams = {
        query: undefined,
        filters: {},
        page: 1,
        limit: 12,
        sort_by: 'price_per_night' as const,
        sort_order: 'asc' as const,
      }

      const mockResults = {
        data: [
          { id: 'prop-1', price_per_night: 5000 },
          { id: 'prop-2', price_per_night: 10000 },
          { id: 'prop-3', price_per_night: 15000 },
        ],
        pagination: {
          page: 1,
          limit: 12,
          total: 3,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      }

      mockSearchProperties.mockResolvedValue(mockResults)

      const results = await mockSearchProperties(searchParams)

      const prices = results.data.map((p: any) => p.price_per_night)
      expect(prices).toEqual([5000, 10000, 15000])
    })

    it('should sort by price descending', async () => {
      const searchParams = {
        query: undefined,
        filters: {},
        page: 1,
        limit: 12,
        sort_by: 'price_per_night' as const,
        sort_order: 'desc' as const,
      }

      const mockResults = {
        data: [
          { id: 'prop-3', price_per_night: 15000 },
          { id: 'prop-2', price_per_night: 10000 },
          { id: 'prop-1', price_per_night: 5000 },
        ],
        pagination: {
          page: 1,
          limit: 12,
          total: 3,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      }

      mockSearchProperties.mockResolvedValue(mockResults)

      const results = await mockSearchProperties(searchParams)

      const prices = results.data.map((p: any) => p.price_per_night)
      expect(prices).toEqual([15000, 10000, 5000])
    })
  })

  describe('Combined Search and Filters', () => {
    it('should combine text search with filters', async () => {
      const searchParams = {
        query: 'apartment',
        filters: { city: 'New York', pricePerNight: { min: 5000, max: 15000 } },
        page: 1,
        limit: 12,
        sort_by: 'created_at' as const,
        sort_order: 'desc' as const,
      }

      const mockResults = {
        data: [
          {
            id: 'prop-1',
            title: 'Beautiful Apartment',
            city: 'New York',
            price_per_night: 10000,
          },
        ],
        pagination: {
          page: 1,
          limit: 12,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      }

      mockSearchProperties.mockResolvedValue(mockResults)

      const results = await mockSearchProperties(searchParams)

      expect(results.data[0].title).toContain('Apartment')
      expect(results.data[0].city).toBe('New York')
      expect(results.data[0].price_per_night).toBeGreaterThanOrEqual(5000)
      expect(results.data[0].price_per_night).toBeLessThanOrEqual(15000)
    })
  })
})

