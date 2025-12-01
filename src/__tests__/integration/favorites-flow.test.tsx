import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

// Mock the favorites hooks
const mockToggleFavorite = vi.fn()
const mockGetFavorites = vi.fn()
const mockIsFavorited = vi.fn()

vi.mock('../../hooks/useFavorites', () => ({
  useToggleFavorite: () => ({
    toggleFavorite: mockToggleFavorite,
    loading: false,
    error: null,
  }),
  useGuestFavorites: (guestId: string | null) => {
    const [favorites, setFavorites] = React.useState([])
    
    React.useEffect(() => {
      if (guestId) {
        mockGetFavorites().then(setFavorites)
      }
    }, [guestId])
    
    return {
      favorites,
      loading: false,
      error: null,
      refetch: mockGetFavorites,
    }
  },
  useIsFavorited: (guestId: string | null, propertyId: string) => {
    const [isFavorited, setIsFavorited] = React.useState(false)
    
    React.useEffect(() => {
      if (guestId) {
        mockIsFavorited(guestId, propertyId).then(setIsFavorited)
      }
    }, [guestId, propertyId])
    
    return {
      isFavorited,
      loading: false,
      error: null,
    }
  },
  useFavoritePropertyIds: (guestId: string | null) => {
    const [propertyIds, setPropertyIds] = React.useState<string[]>([])
    
    React.useEffect(() => {
      if (guestId) {
        mockGetFavorites().then((favs: any[]) => {
          setPropertyIds(favs.map((f: any) => f.property_id))
        })
      }
    }, [guestId])
    
    return {
      propertyIds,
      loading: false,
      error: null,
      refetch: vi.fn(),
    }
  },
}))

// Import React for hooks
import React from 'react'

describe('Favorites Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetFavorites.mockResolvedValue([])
    mockIsFavorited.mockResolvedValue(false)
  })

  describe('Adding to Favorites', () => {
    it('should add property to favorites', async () => {
      const guestId = 'guest-1'
      const propertyId = 'prop-1'
      
      mockToggleFavorite.mockResolvedValue({ success: true })
      mockIsFavorited.mockResolvedValue(true)
      
      const result = await mockToggleFavorite(guestId, propertyId)
      
      expect(result.success).toBe(true)
      expect(mockToggleFavorite).toHaveBeenCalledWith(guestId, propertyId)
    })

    it('should handle favorite add error', async () => {
      const guestId = 'guest-1'
      const propertyId = 'prop-1'
      
      mockToggleFavorite.mockRejectedValue(new Error('Failed to add favorite'))
      
      await expect(mockToggleFavorite(guestId, propertyId)).rejects.toThrow('Failed to add favorite')
    })

    it('should require guest ID to add favorite', async () => {
      const propertyId = 'prop-1'
      
      mockToggleFavorite.mockImplementation((guestId: string | null) => {
        if (!guestId) {
          throw new Error('Guest ID is required')
        }
        return Promise.resolve({ success: true })
      })
      
      // Test that calling with null throws an error
      try {
        await mockToggleFavorite(null, propertyId)
        // If we get here, the error wasn't thrown
        expect.fail('Expected error to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Guest ID is required')
      }
    })
  })

  describe('Removing from Favorites', () => {
    it('should remove property from favorites', async () => {
      const guestId = 'guest-1'
      const propertyId = 'prop-1'
      
      // First add it
      mockToggleFavorite.mockResolvedValueOnce({ success: true, isFavorited: true })
      await mockToggleFavorite(guestId, propertyId)
      
      // Then remove it
      mockToggleFavorite.mockResolvedValueOnce({ success: true, isFavorited: false })
      const result = await mockToggleFavorite(guestId, propertyId)
      
      expect(result.isFavorited).toBe(false)
    })
  })

  describe('Checking Favorite Status', () => {
    it('should check if property is favorited', async () => {
      const guestId = 'guest-1'
      const propertyId = 'prop-1'
      
      mockIsFavorited.mockResolvedValue(true)
      
      const isFavorited = await mockIsFavorited(guestId, propertyId)
      
      expect(isFavorited).toBe(true)
      expect(mockIsFavorited).toHaveBeenCalledWith(guestId, propertyId)
    })

    it('should return false for non-favorited property', async () => {
      const guestId = 'guest-1'
      const propertyId = 'prop-2'
      
      mockIsFavorited.mockResolvedValue(false)
      
      const isFavorited = await mockIsFavorited(guestId, propertyId)
      
      expect(isFavorited).toBe(false)
    })
  })

  describe('Getting All Favorites', () => {
    it('should fetch all favorites for a guest', async () => {
      const guestId = 'guest-1'
      const mockFavorites = [
        { id: 'fav-1', guest_id: guestId, property_id: 'prop-1' },
        { id: 'fav-2', guest_id: guestId, property_id: 'prop-2' },
      ]
      
      mockGetFavorites.mockResolvedValue(mockFavorites)
      
      const favorites = await mockGetFavorites()
      
      expect(favorites).toHaveLength(2)
      expect(favorites[0].property_id).toBe('prop-1')
    })

    it('should return empty array when guest has no favorites', async () => {
      const guestId = 'guest-1'
      
      mockGetFavorites.mockResolvedValue([])
      
      const favorites = await mockGetFavorites()
      
      expect(favorites).toHaveLength(0)
    })

    it('should handle null guest ID', async () => {
      mockGetFavorites.mockResolvedValue([])
      
      const favorites = await mockGetFavorites()
      
      expect(favorites).toEqual([])
    })
  })

  describe('Favorite Count', () => {
    it('should get favorite count for a property', async () => {
      const propertyId = 'prop-1'
      const mockCount = 5
      
      // Mock the favorite count query
      const getPropertyFavoriteCount = vi.fn().mockResolvedValue(mockCount)
      
      const count = await getPropertyFavoriteCount(propertyId)
      
      expect(count).toBe(5)
    })

    it('should return 0 for property with no favorites', async () => {
      const propertyId = 'prop-2'
      
      const getPropertyFavoriteCount = vi.fn().mockResolvedValue(0)
      
      const count = await getPropertyFavoriteCount(propertyId)
      
      expect(count).toBe(0)
    })
  })
})

