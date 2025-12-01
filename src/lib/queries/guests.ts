import { supabase } from '../supabase'
import { cache, cacheKeys, CACHE_TTL } from '../cache'
import { logError } from '../../utils/logger'
import type {
  Guest,
  CreateGuestInput
} from '../../types/database'

export const guestQueries = {
  // Get guest by ID
  async getById(id: string): Promise<Guest | null> {
    const cacheKey = cacheKeys.guest(id)
    const cached = cache.get<Guest>(cacheKey)
    
    if (cached) {
      return cached
    }

    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      logError('Error fetching guest', error, 'guestQueries')
      return null
    }

    cache.set(cacheKey, data, CACHE_TTL.MEDIUM)
    return data
  },

  // Get guest by email
  async getByEmail(email: string): Promise<Guest | null> {
    const cacheKey = `guests:email:${email}`
    const cached = cache.get<Guest>(cacheKey)
    
    if (cached) {
      return cached
    }

    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      // Handle 406 and PGRST116 - both mean no rows returned (guest not found)
      // This is expected for new users who haven't created a guest record yet
      if (error.code === 'PGRST116' || error.status === 406 || error.message?.includes('406')) {
        return null
      }
      logError('Error fetching guest by email', error, 'guestQueries')
      return null
    }

    // If no data, return null (guest not found)
    if (!data) {
      return null
    }

    cache.set(cacheKey, data, CACHE_TTL.MEDIUM)
    return data
  },

  // Create new guest
  async create(input: CreateGuestInput): Promise<Guest | null> {
    const { data, error } = await supabase
      .from('guests')
      .insert(input)
      .select()
      .single()

    if (error) {
      logError('Error creating guest', error, 'guestQueries')
      return null
    }

    // Clear email cache
    cache.delete(`guests:email:${input.email}`)

    return data
  },

  // Update guest
  async update(id: string, updates: Partial<CreateGuestInput>): Promise<Guest | null> {
    // Get current guest data to clear email cache if needed
    const currentGuest = await this.getById(id)
    
    const { data, error } = await supabase
      .from('guests')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logError('Error updating guest', error, 'guestQueries')
      return null
    }

    // Clear caches
    cache.delete(cacheKeys.guest(id))
    if (currentGuest) {
      cache.delete(`guests:email:${currentGuest.email}`)
    }
    if (updates.email) {
      cache.delete(`guests:email:${updates.email}`)
    }
    // Clear stats and list caches if status changed
    if (updates.status) {
      cache.delete('guests:stats')
      cache.clearPattern('guests:all:')
    }

    return data
  },

  // Delete guest
  async delete(id: string): Promise<boolean> {
    // Get guest data to clear email cache
    const guest = await this.getById(id)
    
    const { error } = await supabase
      .from('guests')
      .delete()
      .eq('id', id)

    if (error) {
      logError('Error deleting guest', error, 'guestQueries')
      return false
    }

    // Clear caches
    cache.delete(cacheKeys.guest(id))
    if (guest) {
      cache.delete(`guests:email:${guest.email}`)
    }

    return true
  },

  // Get or create guest by email
  async getOrCreate(input: CreateGuestInput): Promise<Guest | null> {
    // Try to get existing guest
    let guest = await this.getByEmail(input.email)
    
    if (guest) {
      return guest
    }

    // Get the current authenticated user's ID
    const { data: { user } } = await supabase.auth.getUser()
    
    // Create new guest if not found
    // Use auth.uid() as the guest ID to match RLS policy requirements
    // This ensures the guest.id matches auth.uid() which is required by RLS
    const guestInput: CreateGuestInput & { id?: string } = user?.id 
      ? { ...input, id: user.id } 
      : input
    
    const { data, error } = await supabase
      .from('guests')
      .insert(guestInput)
      .select()
      .single()

    if (error) {
      logError('Error creating guest in getOrCreate', error, 'guestQueries')
      return null
    }

    // Clear email cache
    cache.delete(`guests:email:${input.email}`)

    return data
  },

  // Update guest preferences
  async updatePreferences(id: string, preferences: Record<string, any>): Promise<Guest | null> {
    return this.update(id, { preferences })
  },

  // Get all guests (for admin)
  async getAll(page: number = 1, limit: number = 50): Promise<{
    data: Guest[]
    total: number
    page: number
    limit: number
    total_pages: number
  }> {
    const cacheKey = `guests:all:${page}:${limit}`
    const cached = cache.get(cacheKey)
    
    if (cached) {
      return cached
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('guests')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      logError('Error fetching guest count', countError, 'guestQueries')
    }

    const total = count || 0
    const total_pages = Math.ceil(total / limit)
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Get paginated data
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      logError('Error fetching all guests', error, 'guestQueries')
      return {
        data: [],
        total: 0,
        page,
        limit,
        total_pages: 0
      }
    }

    const result = {
      data: data || [],
      total,
      page,
      limit,
      total_pages
    }

    cache.set(cacheKey, result, CACHE_TTL.SHORT)
    return result
  },

  // Get guest statistics
  async getStats(): Promise<{
    total: number
    active: number
    inactive: number
    blocked: number
  }> {
    const cacheKey = 'guests:stats'
    const cached = cache.get(cacheKey)
    
    if (cached) {
      return cached
    }

    const { data, error } = await supabase
      .from('guests')
      .select('status')

    if (error) {
      logError('Error fetching guest stats', error, 'guestQueries')
      return {
        total: 0,
        active: 0,
        inactive: 0,
        blocked: 0
      }
    }

    const stats = data.reduce((acc, guest) => {
      acc.total++
      acc[guest.status as keyof typeof acc]++
      return acc
    }, {
      total: 0,
      active: 0,
      inactive: 0,
      blocked: 0
    })

    cache.set(cacheKey, stats, CACHE_TTL.LONG)
    return stats
  }
}
