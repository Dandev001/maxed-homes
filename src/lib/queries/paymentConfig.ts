import { supabase } from '../supabase'
import { cache, cacheKeys, CACHE_TTL } from '../cache'
import { logError } from '../../utils/logger'
import type { PaymentConfig, CreatePaymentConfigInput, UpdatePaymentConfigInput } from '../../types/database'

const CACHE_KEY = 'payment_config:active'

export const paymentConfigQueries = {
  /**
   * Get all active payment configs (for guests to see payment details)
   * This is cached since payment details don't change frequently
   */
  async getActive(): Promise<PaymentConfig[]> {
    // Check cache first
    const cached = cache.get<PaymentConfig[]>(CACHE_KEY)
    if (cached) {
      return cached
    }

    try {
      const { data, error } = await supabase
        .from('payment_config')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) {
        logError('Error fetching active payment configs', error, 'paymentConfigQueries')
        return []
      }

      // Cache for 5 minutes (payment details don't change often)
      cache.set(CACHE_KEY, data || [], CACHE_TTL.SHORT)

      return data || []
    } catch (err) {
      logError('Error fetching active payment configs', err, 'paymentConfigQueries')
      return []
    }
  },

  /**
   * Get all payment configs (admin only - includes inactive)
   */
  async getAll(): Promise<PaymentConfig[]> {
    try {
      const { data, error } = await supabase
        .from('payment_config')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) {
        logError('Error fetching all payment configs', error, 'paymentConfigQueries')
        return []
      }

      return data || []
    } catch (err) {
      logError('Error fetching all payment configs', err, 'paymentConfigQueries')
      return []
    }
  },

  /**
   * Get payment config by ID
   */
  async getById(id: string): Promise<PaymentConfig | null> {
    try {
      const { data, error } = await supabase
        .from('payment_config')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        logError('Error fetching payment config by ID', error, 'paymentConfigQueries')
        return null
      }

      return data
    } catch (err) {
      logError('Error fetching payment config by ID', err, 'paymentConfigQueries')
      return null
    }
  },

  /**
   * Create payment config (admin only)
   */
  async create(input: CreatePaymentConfigInput): Promise<PaymentConfig | null> {
    try {
      const { data, error } = await supabase
        .from('payment_config')
        .insert(input)
        .select()
        .single()

      if (error) {
        // Check for duplicate key error
        if (error.code === '23505') {
          const errorMessage = `A payment method with type "${input.payment_method}" already exists. Please edit the existing one instead.`
          logError('Error creating payment config - duplicate', { error, input }, 'paymentConfigQueries')
          throw new Error(errorMessage)
        }
        logError('Error creating payment config', error, 'paymentConfigQueries')
        throw new Error(error.message || 'Failed to create payment config')
      }

      // Clear cache
      cache.delete(CACHE_KEY)

      return data
    } catch (err) {
      // Re-throw if it's already an Error with a message
      if (err instanceof Error) {
        throw err
      }
      logError('Error creating payment config', err, 'paymentConfigQueries')
      throw new Error('Failed to create payment config')
    }
  },

  /**
   * Update payment config (admin only)
   */
  async update(id: string, input: UpdatePaymentConfigInput): Promise<PaymentConfig | null> {
    try {
      const { data, error } = await supabase
        .from('payment_config')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        logError('Error updating payment config', error, 'paymentConfigQueries')
        return null
      }

      // Clear cache
      cache.delete(CACHE_KEY)

      return data
    } catch (err) {
      logError('Error updating payment config', err, 'paymentConfigQueries')
      return null
    }
  },

  /**
   * Delete payment config (admin only)
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payment_config')
        .delete()
        .eq('id', id)

      if (error) {
        logError('Error deleting payment config', error, 'paymentConfigQueries')
        return false
      }

      // Clear cache
      cache.delete(CACHE_KEY)

      return true
    } catch (err) {
      logError('Error deleting payment config', err, 'paymentConfigQueries')
      return false
    }
  },
}

