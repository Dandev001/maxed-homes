import { supabase } from '../supabase'
import { cache, CACHE_TTL } from '../cache'
import { logError } from '../../utils/logger'
import type { Host } from '../../types/database'

export const hostQueries = {
  // Get host by ID
  async getById(id: string): Promise<Host | null> {
    const cacheKey = `hosts:${id}`
    const cached = cache.get<Host>(cacheKey)
    
    if (cached) {
      return cached
    }

    const { data, error } = await supabase
      .from('hosts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      logError('Error fetching host', error, 'hostQueries')
      return null
    }

    cache.set(cacheKey, data, CACHE_TTL.MEDIUM)
    return data
  },

  // Get host by email
  async getByEmail(email: string): Promise<Host | null> {
    const cacheKey = `hosts:email:${email}`
    const cached = cache.get<Host>(cacheKey)
    
    if (cached) {
      return cached
    }

    const { data, error } = await supabase
      .from('hosts')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116' || error.status === 406) {
        return null
      }
      logError('Error fetching host by email', error, 'hostQueries')
      return null
    }

    if (!data) {
      return null
    }

    cache.set(cacheKey, data, CACHE_TTL.MEDIUM)
    return data
  },

  // Get all hosts (for admin)
  async getAll(page: number = 1, limit: number = 50): Promise<{
    data: Host[]
    total: number
    page: number
    limit: number
    total_pages: number
  }> {
    const cacheKey = `hosts:all:${page}:${limit}`
    const cached = cache.get(cacheKey)
    
    if (cached) {
      return cached
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('hosts')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      logError('Error fetching host count', countError, 'hostQueries')
    }

    const total = count || 0
    const total_pages = Math.ceil(total / limit)
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Get paginated data
    const { data, error } = await supabase
      .from('hosts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      logError('Error fetching all hosts', error, 'hostQueries')
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

  // Get host statistics
  async getStats(): Promise<{
    total: number
    active: number
    inactive: number
    suspended: number
    pending_verification: number
  }> {
    const cacheKey = 'hosts:stats'
    const cached = cache.get(cacheKey)
    
    if (cached) {
      return cached
    }

    const { data, error } = await supabase
      .from('hosts')
      .select('status')

    if (error) {
      logError('Error fetching host stats', error, 'hostQueries')
      return {
        total: 0,
        active: 0,
        inactive: 0,
        suspended: 0,
        pending_verification: 0
      }
    }

    const stats = data.reduce((acc, host) => {
      acc.total++
      const status = host.status as keyof typeof acc
      if (status in acc) {
        acc[status]++
      }
      return acc
    }, {
      total: 0,
      active: 0,
      inactive: 0,
      suspended: 0,
      pending_verification: 0
    })

    cache.set(cacheKey, stats, CACHE_TTL.LONG)
    return stats
  },

  // Update host
  async update(id: string, updates: Partial<{
    email: string
    first_name: string
    last_name: string
    phone: string | null
    company_name: string | null
    profile_image_url: string | null
    bio: string | null
    status: string
    is_verified: boolean
  }>): Promise<Host | null> {
    // Get current host data to clear email cache if needed
    const currentHost = await this.getById(id)
    
    const { data, error } = await supabase
      .from('hosts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logError('Error updating host', error, 'hostQueries')
      return null
    }

    // Clear caches
    cache.delete(`hosts:${id}`)
    if (currentHost) {
      cache.delete(`hosts:email:${currentHost.email}`)
    }
    if (updates.email) {
      cache.delete(`hosts:email:${updates.email}`)
    }
    // Clear stats and list caches if status changed
    if (updates.status || updates.is_verified) {
      cache.delete('hosts:stats')
      cache.clearPattern('hosts:all:')
    }
    // Clear property count cache if status changed
    if (updates.status) {
      cache.delete(`hosts:${id}:property_count`)
    }

    return data
  },

  // Get property count for a host
  async getPropertyCount(hostId: string): Promise<number> {
    const cacheKey = `hosts:${hostId}:property_count`
    const cached = cache.get<number>(cacheKey)
    
    if (cached !== undefined) {
      return cached
    }

    const { count, error } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('host_id', hostId)

    if (error) {
      logError('Error fetching host property count', error, 'hostQueries')
      return 0
    }

    const propertyCount = count || 0
    cache.set(cacheKey, propertyCount, CACHE_TTL.MEDIUM)
    return propertyCount
  }
}

