// Simple in-memory cache implementation
// In production, consider using Redis or a more sophisticated caching solution

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Clear cache entries that match a pattern
  clearPattern(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

export const cache = new MemoryCache()

// Cache key generators
export const cacheKeys = {
  property: (id: string) => `properties:${id}`,
  propertyList: (filters: string) => `properties:list:${filters}`,
  featuredProperties: () => 'properties:featured',
  propertyImages: (id: string) => `properties:${id}:images`,
  propertyAvailability: (id: string, dateRange: string) => `properties:${id}:availability:${dateRange}`,
  booking: (id: string) => `bookings:${id}`,
  guestBookings: (guestId: string) => `bookings:guest:${guestId}`,
  propertyBookings: (propertyId: string) => `bookings:property:${propertyId}`,
  guest: (id: string) => `guests:${id}`,
  availability: (propertyId: string, dateRange: string) => `availability:${propertyId}:${dateRange}`,
  propertyReviews: (propertyId: string) => `reviews:property:${propertyId}`,
  review: (id: string) => `reviews:${id}`,
  guestFavorites: (guestId: string) => `favorites:guest:${guestId}`,
  propertyFavorites: (propertyId: string) => `favorites:property:${propertyId}`,
  favorite: (guestId: string, propertyId: string) => `favorites:${guestId}:${propertyId}`
}

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  SHORT: 2 * 60 * 1000, // 2 minutes
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 15 * 60 * 1000, // 15 minutes
  VERY_LONG: 60 * 60 * 1000 // 1 hour
} as const
