import { supabase } from '../supabase'
import { cache, cacheKeys, CACHE_TTL } from '../cache'
import { logError } from '../../utils/logger'
import type {
  Favorite,
  FavoriteWithDetails,
  CreateFavoriteInput,
  PropertyWithImages
} from '../../types/database'

export const favoriteQueries = {
  // Get all favorites for a guest
  async getByGuest(guestId: string): Promise<FavoriteWithDetails[]> {
    const cacheKey = cacheKeys.guestFavorites(guestId)
    const cached = cache.get<FavoriteWithDetails[]>(cacheKey)
    
    if (cached) {
      return cached
    }

    const { data, error } = await supabase
      .from('favorites')
      .select(`
        *,
        property:properties(
          *,
          images:property_images(*)
        ),
        guest:guests(*)
      `)
      .eq('guest_id', guestId)
      .order('created_at', { ascending: false })

    if (error) {
      logError('Error fetching guest favorites', error, 'favoriteQueries')
      return []
    }

    // Transform the data to match PropertyWithImages structure
    const favorites: FavoriteWithDetails[] = (data || []).map((fav: any) => ({
      ...fav,
      property: {
        ...fav.property,
        images: fav.property?.images || []
      } as PropertyWithImages
    }))

    cache.set(cacheKey, favorites, CACHE_TTL.MEDIUM)
    return favorites
  },

  // Check if a property is favorited by a guest
  async isFavorited(guestId: string, propertyId: string): Promise<boolean> {
    const cacheKey = cacheKeys.favorite(guestId, propertyId)
    const cached = cache.get<boolean>(cacheKey)
    
    if (cached !== null) {
      return cached
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('guest_id', guestId)
      .eq('property_id', propertyId)
      .maybeSingle()

    if (error) {
      // If error is PGRST116 or 406, it means no row found (not favorited)
      if (error.code === 'PGRST116' || error.status === 406) {
        cache.set(cacheKey, false, CACHE_TTL.MEDIUM)
        return false
      }
      logError('Error checking if property is favorited', error, 'favoriteQueries')
      return false
    }

    const isFavorited = !!data
    cache.set(cacheKey, isFavorited, CACHE_TTL.MEDIUM)
    return isFavorited
  },

  // Get all property IDs favorited by a guest (lightweight query)
  async getFavoritePropertyIds(guestId: string): Promise<string[]> {
    const cacheKey = `${cacheKeys.guestFavorites(guestId)}:ids`
    const cached = cache.get<string[]>(cacheKey)
    
    if (cached) {
      return cached
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('property_id')
      .eq('guest_id', guestId)

    if (error) {
      logError('Error fetching favorite property IDs', error, 'favoriteQueries')
      return []
    }

    const propertyIds = (data || []).map((fav: any) => fav.property_id)
    cache.set(cacheKey, propertyIds, CACHE_TTL.MEDIUM)
    return propertyIds
  },

  // Get count of favorites for a property
  async getPropertyFavoriteCount(propertyId: string): Promise<number> {
    const cacheKey = `${cacheKeys.propertyFavorites(propertyId)}:count`
    const cached = cache.get<number>(cacheKey)
    
    if (cached !== null) {
      return cached
    }

    const { data, error, count } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('property_id', propertyId)

    if (error) {
      logError('Error fetching property favorite count', error, 'favoriteQueries')
      return 0
    }

    const favoriteCount = count || 0
    cache.set(cacheKey, favoriteCount, CACHE_TTL.MEDIUM)
    return favoriteCount
  },

  // Add a favorite
  async create(input: CreateFavoriteInput): Promise<Favorite | null> {
    const { data, error } = await supabase
      .from('favorites')
      .insert(input)
      .select()
      .single()

    if (error) {
      // If it's a unique constraint violation, the favorite already exists
      if (error.code === '23505') {
        // Try to get the existing favorite
        const existing = await this.getFavorite(input.guest_id, input.property_id)
        return existing
      }
      logError('Error creating favorite', error, 'favoriteQueries')
      return null
    }

    // Clear related caches
    cache.clearPattern(`favorites:guest:${input.guest_id}`)
    cache.clearPattern(`favorites:property:${input.property_id}`)
    cache.delete(cacheKeys.favorite(input.guest_id, input.property_id))

    return data
  },

  // Remove a favorite
  async delete(guestId: string, propertyId: string): Promise<boolean> {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('guest_id', guestId)
      .eq('property_id', propertyId)

    if (error) {
      logError('Error deleting favorite', error, 'favoriteQueries')
      return false
    }

    // Clear related caches
    cache.clearPattern(`favorites:guest:${guestId}`)
    cache.clearPattern(`favorites:property:${propertyId}`)
    cache.delete(cacheKeys.favorite(guestId, propertyId))

    return true
  },

  // Toggle favorite (add if not exists, remove if exists)
  async toggle(guestId: string, propertyId: string): Promise<{ isFavorited: boolean; favorite: Favorite | null }> {
    const isFavorited = await this.isFavorited(guestId, propertyId)
    
    if (isFavorited) {
      const deleted = await this.delete(guestId, propertyId)
      return { isFavorited: false, favorite: null }
    } else {
      const favorite = await this.create({ guest_id: guestId, property_id: propertyId })
      return { isFavorited: true, favorite }
    }
  },

  // Get a specific favorite (helper method)
  async getFavorite(guestId: string, propertyId: string): Promise<Favorite | null> {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('guest_id', guestId)
      .eq('property_id', propertyId)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116' || error.status === 406) {
        return null
      }
      logError('Error fetching favorite', error, 'favoriteQueries')
      return null
    }

    return data
  }
}


