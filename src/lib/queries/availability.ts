import { supabase } from '../supabase'
import { cache, cacheKeys, CACHE_TTL } from '../cache'
import { logError } from '../../utils/logger'
import type {
  AvailabilityCalendar,
  CreateAvailabilityInput,
  AvailabilityFilters
} from '../../types/database'

export const availabilityQueries = {
  // Get availability for a property in a date range
  async getByPropertyAndDateRange(
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<AvailabilityCalendar[]> {
    const cacheKey = cacheKeys.availability(propertyId, `${startDate}:${endDate}`)
    const cached = cache.get<AvailabilityCalendar[]>(cacheKey)
    
    if (cached) {
      return cached
    }

    const { data, error } = await supabase
      .from('availability_calendar')
      .select('*')
      .eq('property_id', propertyId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) {
      logError('Error fetching availability', error, 'availabilityQueries')
      return []
    }

    cache.set(cacheKey, data, CACHE_TTL.SHORT)
    return data
  },

  // Get all available dates for a property
  async getAvailableDates(propertyId: string, startDate: string, endDate: string): Promise<string[]> {
    const availability = await this.getByPropertyAndDateRange(propertyId, startDate, endDate)
    return availability
      .filter(av => av.is_available)
      .map(av => av.date)
  },

  // Get unavailable dates for a property
  async getUnavailableDates(propertyId: string, startDate: string, endDate: string): Promise<string[]> {
    const availability = await this.getByPropertyAndDateRange(propertyId, startDate, endDate)
    return availability
      .filter(av => !av.is_available)
      .map(av => av.date)
  },

  // Check if specific dates are available
  async checkDatesAvailable(propertyId: string, dates: string[]): Promise<{ [date: string]: boolean }> {
    const startDate = dates[0]
    const endDate = dates[dates.length - 1]
    
    const availability = await this.getByPropertyAndDateRange(propertyId, startDate, endDate)
    
    const result: { [date: string]: boolean } = {}
    
    dates.forEach(date => {
      const av = availability.find(a => a.date === date)
      result[date] = av ? av.is_available : true // Default to available if no record exists
    })
    
    return result
  },

  // Bulk update availability
  async bulkUpdate(updates: CreateAvailabilityInput[]): Promise<AvailabilityCalendar[]> {
    const { data, error } = await supabase
      .from('availability_calendar')
      .upsert(updates, { onConflict: 'property_id,date' })
      .select()

    if (error) {
      logError('Error bulk updating availability', error, 'availabilityQueries')
      return []
    }

    // Clear related caches
    const propertyIds = [...new Set(updates.map(u => u.property_id))]
    propertyIds.forEach(propertyId => {
      cache.clearPattern(`availability:${propertyId}:`)
    })

    return data
  },

  // Set property as unavailable for specific dates
  async setUnavailable(
    propertyId: string,
    dates: string[],
    reason?: string
  ): Promise<AvailabilityCalendar[]> {
    const updates: CreateAvailabilityInput[] = dates.map(date => ({
      property_id: propertyId,
      date,
      is_available: false,
      notes: reason
    }))

    return this.bulkUpdate(updates)
  },

  // Set property as available for specific dates
  async setAvailable(
    propertyId: string,
    dates: string[],
    priceOverride?: number,
    minimumNightsOverride?: number
  ): Promise<AvailabilityCalendar[]> {
    const updates: CreateAvailabilityInput[] = dates.map(date => ({
      property_id: propertyId,
      date,
      is_available: true,
      price_override: priceOverride,
      minimum_nights_override: minimumNightsOverride
    }))

    return this.bulkUpdate(updates)
  },

  // Set price override for specific dates
  async setPriceOverride(
    propertyId: string,
    dates: string[],
    price: number
  ): Promise<AvailabilityCalendar[]> {
    const updates: CreateAvailabilityInput[] = dates.map(date => ({
      property_id: propertyId,
      date,
      is_available: true,
      price_override: price
    }))

    return this.bulkUpdate(updates)
  },

  // Get availability calendar for a month
  async getMonthlyCalendar(propertyId: string, year: number, month: number): Promise<AvailabilityCalendar[]> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0] // Last day of month
    
    return this.getByPropertyAndDateRange(propertyId, startDate, endDate)
  },

  // Generate availability for a date range (useful for initial setup)
  async generateAvailability(
    propertyId: string,
    startDate: string,
    endDate: string,
    defaultAvailable: boolean = true,
    defaultPrice?: number
  ): Promise<AvailabilityCalendar[]> {
    const dates: string[] = []
    const currentDate = new Date(startDate)
    const end = new Date(endDate)

    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split('T')[0])
      currentDate.setDate(currentDate.getDate() + 1)
    }

    const updates: CreateAvailabilityInput[] = dates.map(date => ({
      property_id: propertyId,
      date,
      is_available: defaultAvailable,
      price_override: defaultPrice
    }))

    return this.bulkUpdate(updates)
  },

  // Get availability statistics
  async getStats(propertyId: string, startDate: string, endDate: string): Promise<{
    totalDays: number
    availableDays: number
    unavailableDays: number
    occupancyRate: number
  }> {
    const availability = await this.getByPropertyAndDateRange(propertyId, startDate, endDate)
    
    const totalDays = availability.length
    const availableDays = availability.filter(av => av.is_available).length
    const unavailableDays = totalDays - availableDays
    const occupancyRate = totalDays > 0 ? (unavailableDays / totalDays) * 100 : 0

    return {
      totalDays,
      availableDays,
      unavailableDays,
      occupancyRate
    }
  },

  // Search availability with filters
  async search(filters: AvailabilityFilters): Promise<AvailabilityCalendar[]> {
    const cacheKey = `availability:search:${JSON.stringify(filters)}`
    const cached = cache.get<AvailabilityCalendar[]>(cacheKey)
    
    if (cached) {
      return cached
    }

    let queryBuilder = supabase
      .from('availability_calendar')
      .select('*')

    if (filters.property_id) {
      queryBuilder = queryBuilder.eq('property_id', filters.property_id)
    }
    if (filters.date_from) {
      queryBuilder = queryBuilder.gte('date', filters.date_from)
    }
    if (filters.date_to) {
      queryBuilder = queryBuilder.lte('date', filters.date_to)
    }
    if (filters.is_available !== undefined) {
      queryBuilder = queryBuilder.eq('is_available', filters.is_available)
    }

    queryBuilder = queryBuilder.order('date', { ascending: true })

    const { data, error } = await queryBuilder

    if (error) {
      logError('Error searching availability', error, 'availabilityQueries')
      return []
    }

    cache.set(cacheKey, data, CACHE_TTL.SHORT)
    return data
  }
}
