import { supabase } from '../supabase'
import { cache, cacheKeys, CACHE_TTL } from '../cache'
import { logError } from '../../utils/logger'
import type {
  Property,
  PropertyWithImages,
  PropertyWithAvailability,
  CreatePropertyInput,
  CreatePropertyImageInput,
  PropertyFilters,
  SearchParams,
  PaginatedResponse
} from '../../types/database'

// Property Queries with Caching

export const propertyQueries = {
  // Get single property by ID
  async getById(id: string): Promise<Property | null> {
    const cacheKey = cacheKeys.property(id)
    const cached = cache.get<Property>(cacheKey)
    
    if (cached) {
      return cached
    }

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .eq('status', 'active')
      .single()

    if (error) {
      logError('Error fetching property', error, 'propertyQueries')
      return null
    }

    cache.set(cacheKey, data, CACHE_TTL.MEDIUM)
    return data
  },

  // Get property with images and host
  async getWithImages(id: string): Promise<PropertyWithImages | null> {
    const cacheKey = `${cacheKeys.property(id)}:with-images`
    const cached = cache.get<PropertyWithImages>(cacheKey)
    
    if (cached) {
      return cached
    }

    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        images:property_images(*),
        host:hosts(*)
      `)
      .eq('id', id)
      .eq('status', 'active')
      .single()

    if (error) {
      logError('Error fetching property with images', error, 'propertyQueries')
      return null
    }

    // Sort images by display_order
    if (data.images) {
      data.images.sort((a: any, b: any) => a.display_order - b.display_order)
    }

    cache.set(cacheKey, data, CACHE_TTL.MEDIUM)
    return data
  },

  // Get featured properties
  async getFeatured(limit: number = 6): Promise<PropertyWithImages[]> {
    const cacheKey = `${cacheKeys.featuredProperties()}:${limit}`
    const cached = cache.get<PropertyWithImages[]>(cacheKey)
    
    if (cached) {
      return cached
    }

    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        images:property_images(*),
        host:hosts(*)
      `)
      .eq('status', 'active')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logError('Error fetching featured properties', error, 'propertyQueries')
      return []
    }

    // Sort images by display_order for each property
    data.forEach((property: any) => {
      if (property.images) {
        property.images.sort((a: any, b: any) => a.display_order - b.display_order)
      }
    })

    cache.set(cacheKey, data, CACHE_TTL.MEDIUM)
    return data
  },

  // Search properties with filters and pagination
  async search(params: SearchParams): Promise<PaginatedResponse<PropertyWithImages>> {
    const {
      query,
      filters = {},
      sort_by = 'created_at',
      sort_order = 'desc',
      page = 1,
      limit = 12
    } = params

    // Create cache key from search parameters
    const cacheKey = cacheKeys.propertyList(
      JSON.stringify({ query, filters, sort_by, sort_order, page, limit })
    )
    const cached = cache.get<PaginatedResponse<PropertyWithImages>>(cacheKey)
    
    if (cached) {
      return cached
    }

    let queryBuilder = supabase
      .from('properties')
      .select(`
        *,
        images:property_images(*),
        host:hosts(*)
      `, { count: 'exact' })
      .eq('status', 'active')

    // Apply filters
    if (filters.city) {
      queryBuilder = queryBuilder.eq('city', filters.city)
    }
    if (filters.state) {
      queryBuilder = queryBuilder.eq('state', filters.state)
    }
    if (filters.property_type) {
      queryBuilder = queryBuilder.eq('property_type', filters.property_type)
    }
    if (filters.min_price) {
      queryBuilder = queryBuilder.gte('price_per_night', filters.min_price)
    }
    if (filters.max_price) {
      queryBuilder = queryBuilder.lte('price_per_night', filters.max_price)
    }
    if (filters.min_bedrooms) {
      queryBuilder = queryBuilder.gte('bedrooms', filters.min_bedrooms)
    }
    if (filters.min_bathrooms) {
      queryBuilder = queryBuilder.gte('bathrooms', filters.min_bathrooms)
    }
    if (filters.min_guests) {
      queryBuilder = queryBuilder.gte('max_guests', filters.min_guests)
    }
    if (filters.amenities && filters.amenities.length > 0) {
      queryBuilder = queryBuilder.overlaps('amenities', filters.amenities)
    }
    if (filters.is_featured !== undefined) {
      queryBuilder = queryBuilder.eq('is_featured', filters.is_featured)
    }

    // Apply text search - search across multiple fields
    if (query && query.trim()) {
      const searchTerm = query.trim()
      // Escape special characters for Supabase query
      const escapedTerm = searchTerm.replace(/'/g, "''")
      
      // Use or() with proper syntax for multiple field search
      // Format: field1.ilike.%value%,field2.ilike.%value%
      queryBuilder = queryBuilder.or(
        `title.ilike.%${escapedTerm}%,` +
        `description.ilike.%${escapedTerm}%,` +
        `city.ilike.%${escapedTerm}%,` +
        `state.ilike.%${escapedTerm}%,` +
        `address.ilike.%${escapedTerm}%,` +
        `zip_code.ilike.%${escapedTerm}%,` +
        `property_type.ilike.%${escapedTerm}%`
      )
      
      // Note: Amenities search would require array operations which are complex
      // For now, we search in the main text fields. Users can use the amenities filter
      // for specific amenity searches
    }

    // Apply sorting
    queryBuilder = queryBuilder.order(sort_by, { ascending: sort_order === 'asc' })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    queryBuilder = queryBuilder.range(from, to)

    const { data, error, count } = await queryBuilder

    if (error) {
      logError('Error searching properties', error, 'propertyQueries')
      return {
        data: [],
        total: 0,
        page,
        limit,
        total_pages: 0,
        has_next: false,
        has_prev: false
      }
    }

    // Sort images by display_order for each property
    data.forEach((property: any) => {
      if (property.images) {
        property.images.sort((a: any, b: any) => a.display_order - b.display_order)
      }
    })

    const total = count || 0
    const total_pages = Math.ceil(total / limit)

    const result: PaginatedResponse<PropertyWithImages> = {
      data,
      total,
      page,
      limit,
      total_pages,
      has_next: page < total_pages,
      has_prev: page > 1
    }

    cache.set(cacheKey, result, CACHE_TTL.SHORT)
    return result
  },

  // Get properties by city
  async getByCity(city: string, limit: number = 12): Promise<PropertyWithImages[]> {
    const cacheKey = `${cacheKeys.propertyList(`city:${city}`)}:${limit}`
    const cached = cache.get<PropertyWithImages[]>(cacheKey)
    
    if (cached) {
      return cached
    }

    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        images:property_images(*)
      `)
      .eq('status', 'active')
      .eq('city', city)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logError('Error fetching properties by city', error, 'propertyQueries')
      return []
    }

    // Sort images by display_order for each property
    data.forEach((property: any) => {
      if (property.images) {
        property.images.sort((a: any, b: any) => a.display_order - b.display_order)
      }
    })

    cache.set(cacheKey, data, CACHE_TTL.MEDIUM)
    return data
  },

  // Create new property
  async create(input: CreatePropertyInput): Promise<Property | null> {
    const { data, error } = await supabase
      .from('properties')
      .insert(input)
      .select()
      .single()

    if (error) {
      logError('Error creating property', error, 'propertyQueries')
      return null
    }

    // Clear related caches
    cache.clearPattern('properties:list:')
    cache.clearPattern('properties:featured')

    return data
  },

  // Update property
  async update(id: string, updates: Partial<CreatePropertyInput>): Promise<Property | null> {
    // Try using the database function first (bypasses RLS)
    // This is more reliable than relying on RLS policies
    try {
      const { data: functionData, error: functionError } = await supabase.rpc('update_property_admin', {
        property_id: id,
        updates: updates as any
      })

      if (!functionError && functionData) {
        // Clear caches
        cache.delete(cacheKeys.property(id))
        cache.delete(`${cacheKeys.property(id)}:with-images`)
        cache.clearPattern('properties:list:')
        cache.clearPattern('properties:featured')
        return functionData as Property
      }
    } catch (err) {
      // If function doesn't exist or fails, fall back to regular update
      console.warn('Function update failed, trying regular update:', err)
    }

    // Fallback to regular update
    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      // Log detailed error information
      logError('Error updating property', error, 'propertyQueries')
      
      // Provide more context for RLS errors
      if (error.code === 'PGRST116') {
        console.error('Update failed: No rows returned. This usually means RLS policy blocked the update.')
        console.error('Make sure you have admin permissions and the update policy includes WITH CHECK clause.')
      }
      
      return null
    }

    // If no data returned, it means the update was blocked by RLS
    if (!data) {
      logError('Update returned no data - likely RLS policy issue', { id, updates }, 'propertyQueries')
      return null
    }

    // Clear related caches
    cache.delete(cacheKeys.property(id))
    cache.delete(`${cacheKeys.property(id)}:with-images`)
    cache.clearPattern('properties:list:')
    cache.clearPattern('properties:featured')

    return data
  },

  // Delete property
  async delete(id: string): Promise<boolean> {
    // First, fetch all images associated with this property to delete them from storage
    const { data: images, error: imagesError } = await supabase
      .from('property_images')
      .select('image_url')
      .eq('property_id', id)

    if (!imagesError && images && images.length > 0) {
      // Extract file paths from image URLs and delete from storage
      const filePaths: string[] = []
      
      for (const image of images) {
        if (image.image_url) {
          // Extract file path from URL
          // URLs are typically: https://project.supabase.co/storage/v1/object/public/property-images/properties/filename.jpg
          // We need: properties/filename.jpg
          try {
            const url = new URL(image.image_url)
            const pathParts = url.pathname.split('/')
            const bucketIndex = pathParts.indexOf('property-images')
            
            if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
              // Get everything after 'property-images/'
              const filePath = pathParts.slice(bucketIndex + 1).join('/')
              filePaths.push(filePath)
            } else {
              // Fallback: try to extract from pathname directly
              // If URL contains '/property-images/', extract everything after it
              const match = url.pathname.match(/\/property-images\/(.+)$/)
              if (match && match[1]) {
                filePaths.push(match[1])
              }
            }
          } catch (err) {
            // If URL parsing fails, try to extract path manually
            const match = image.image_url.match(/property-images[\/\\](.+)$/i)
            if (match && match[1]) {
              filePaths.push(match[1])
            }
          }
        }
      }

      // Delete all image files from storage
      if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('property-images')
          .remove(filePaths)

        if (storageError) {
          console.warn('Error deleting images from storage:', storageError)
          // Don't fail the entire operation if storage deletion fails
          // The database records will still be deleted via CASCADE
        } else {
          console.log(`Deleted ${filePaths.length} image(s) from storage`)
        }
      }
    }

    // Now delete the property (this will cascade delete image records from database)
    const { data, error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id)
      .select()

    if (error) {
      logError('Error deleting property', error, 'propertyQueries')
      
      // Provide more context for different error types
      if (error.code === 'PGRST116' || error.code === '42501') {
        console.error('Delete failed: RLS policy may have blocked the deletion.')
        console.error('Make sure you have admin permissions and the delete policy is correctly configured.')
      } else if (error.code === '23503') {
        console.error('Delete failed: Foreign key constraint violation.')
        console.error('This property may have associated bookings, reviews, or other related data that prevent deletion.')
      }
      
      return false
    }

    // Check if any rows were actually deleted
    // If RLS blocks the delete, data will be null or empty array
    if (!data || data.length === 0) {
      logError('Delete returned no rows - likely RLS policy issue or property not found', { id }, 'propertyQueries')
      console.error('No rows were deleted. This usually means:')
      console.error('1. RLS policy blocked the deletion (check admin permissions)')
      console.error('2. Property with this ID does not exist')
      console.error('3. Foreign key constraints prevent deletion (check for related bookings/reviews)')
      return false
    }

    // Clear related caches
    cache.delete(cacheKeys.property(id))
    cache.delete(`${cacheKeys.property(id)}:with-images`)
    cache.clearPattern('properties:list:')
    cache.clearPattern('properties:featured')

    return true
  },

  // Admin: Get all properties (including inactive)
  async getAllForAdmin(params: {
    filters?: PropertyFilters
    sort_by?: string
    sort_order?: 'asc' | 'desc'
    page?: number
    limit?: number
    query?: string
  }): Promise<PaginatedResponse<PropertyWithImages>> {
    const {
      filters = {},
      sort_by = 'created_at',
      sort_order = 'desc',
      page = 1,
      limit = 24,
      query
    } = params

    let queryBuilder = supabase
      .from('properties')
      .select(`
        *,
        images:property_images(*),
        host:hosts(*)
      `, { count: 'exact' })

    // Apply filters (no status filter - get all)
    if (filters.status) {
      queryBuilder = queryBuilder.eq('status', filters.status)
    }
    if (filters.city) {
      queryBuilder = queryBuilder.eq('city', filters.city)
    }
    if (filters.state) {
      queryBuilder = queryBuilder.eq('state', filters.state)
    }
    if (filters.property_type) {
      queryBuilder = queryBuilder.eq('property_type', filters.property_type)
    }
    if (filters.min_price) {
      queryBuilder = queryBuilder.gte('price_per_night', filters.min_price)
    }
    if (filters.max_price) {
      queryBuilder = queryBuilder.lte('price_per_night', filters.max_price)
    }
    if (filters.min_bedrooms) {
      queryBuilder = queryBuilder.gte('bedrooms', filters.min_bedrooms)
    }
    if (filters.min_bathrooms) {
      queryBuilder = queryBuilder.gte('bathrooms', filters.min_bathrooms)
    }
    if (filters.min_guests) {
      queryBuilder = queryBuilder.gte('max_guests', filters.min_guests)
    }
    if (filters.amenities && filters.amenities.length > 0) {
      queryBuilder = queryBuilder.overlaps('amenities', filters.amenities)
    }
    if (filters.is_featured !== undefined) {
      queryBuilder = queryBuilder.eq('is_featured', filters.is_featured)
    }

    // Apply text search
    if (query && query.trim()) {
      const searchTerm = query.trim()
      const escapedTerm = searchTerm.replace(/'/g, "''")
      
      queryBuilder = queryBuilder.or(
        `title.ilike.%${escapedTerm}%,` +
        `description.ilike.%${escapedTerm}%,` +
        `city.ilike.%${escapedTerm}%,` +
        `state.ilike.%${escapedTerm}%,` +
        `address.ilike.%${escapedTerm}%,` +
        `zip_code.ilike.%${escapedTerm}%,` +
        `property_type.ilike.%${escapedTerm}%`
      )
    }

    // Apply sorting
    queryBuilder = queryBuilder.order(sort_by, { ascending: sort_order === 'asc' })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    queryBuilder = queryBuilder.range(from, to)

    const { data, error, count } = await queryBuilder

    if (error) {
      logError('Error fetching all properties for admin', error, 'propertyQueries')
      return {
        data: [],
        total: 0,
        page,
        limit,
        total_pages: 0,
        has_next: false,
        has_prev: false
      }
    }

    // Sort images by display_order for each property
    data.forEach((property: any) => {
      if (property.images) {
        property.images.sort((a: any, b: any) => a.display_order - b.display_order)
      }
    })

    const total = count || 0
    const total_pages = Math.ceil(total / limit)

    return {
      data,
      total,
      page,
      limit,
      total_pages,
      has_next: page < total_pages,
      has_prev: page > 1
    }
  },

  // Get property statistics (admin)
  async getStats(): Promise<{
    total: number
    active: number
    inactive: number
    featured: number
  }> {
    const cacheKey = 'properties:stats'
    const cached = cache.get<{
      total: number
      active: number
      inactive: number
      featured: number
    }>(cacheKey)
    
    if (cached) {
      return cached
    }

    // Get total count
    const { count: totalCount, error: totalError } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      logError('Error fetching property stats', totalError, 'propertyQueries')
      return {
        total: 0,
        active: 0,
        inactive: 0,
        featured: 0
      }
    }

    // Get active count
    const { count: activeCount, error: activeError } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    if (activeError) {
      logError('Error fetching active property count', activeError, 'propertyQueries')
    }

    // Get inactive count
    const { count: inactiveCount, error: inactiveError } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'inactive')

    if (inactiveError) {
      logError('Error fetching inactive property count', inactiveError, 'propertyQueries')
    }

    // Get featured count
    const { count: featuredCount, error: featuredError } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('is_featured', true)
      .eq('status', 'active')

    if (featuredError) {
      logError('Error fetching featured property count', featuredError, 'propertyQueries')
    }

    const stats = {
      total: totalCount || 0,
      active: activeCount || 0,
      inactive: inactiveCount || 0,
      featured: featuredCount || 0
    }

    cache.set(cacheKey, stats, CACHE_TTL.MEDIUM)
    return stats
  }
}

// Property Images Queries

export const propertyImageQueries = {
  // Add image to property
  async add(input: CreatePropertyImageInput): Promise<PropertyImage | null> {
    const { data, error } = await supabase
      .from('property_images')
      .insert(input)
      .select()
      .single()

    if (error) {
      logError('Error adding property image', error, 'propertyQueries')
      
      // Provide more context for RLS errors
      if (error.code === '42501') {
        console.error('Image insert blocked by RLS policy. Make sure you have admin permissions and the policy includes WITH CHECK clause.')
      } else if (error.code === 'PGRST116') {
        console.error('Image insert returned no rows - likely RLS policy issue')
      }
      
      return null
    }

    // Clear property caches
    cache.delete(cacheKeys.property(input.property_id))
    cache.delete(`${cacheKeys.property(input.property_id)}:with-images`)
    cache.delete(cacheKeys.propertyImages(input.property_id))

    return data
  },

  // Update image
  async update(id: string, updates: Partial<CreatePropertyImageInput>): Promise<PropertyImage | null> {
    const { data, error } = await supabase
      .from('property_images')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logError('Error updating property image', error, 'propertyQueries')
      return null
    }

    // Clear property caches
    cache.delete(cacheKeys.property(data.property_id))
    cache.delete(`${cacheKeys.property(data.property_id)}:with-images`)
    cache.delete(cacheKeys.propertyImages(data.property_id))

    return data
  },

  // Delete image
  async delete(id: string): Promise<boolean> {
    // First get the property_id to clear caches
    const { data: image } = await supabase
      .from('property_images')
      .select('property_id')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('property_images')
      .delete()
      .eq('id', id)

    if (error) {
      logError('Error deleting property image', error, 'propertyQueries')
      return false
    }

    // Clear property caches
    if (image) {
      cache.delete(cacheKeys.property(image.property_id))
      cache.delete(`${cacheKeys.property(image.property_id)}:with-images`)
      cache.delete(cacheKeys.propertyImages(image.property_id))
    }

    return true
  }
}
