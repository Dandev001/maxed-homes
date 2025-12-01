import { supabase } from '../supabase'
import { logError } from '../../utils/logger'
import type {
  ContactMessage,
  CreateContactMessageInput
} from '../../types/database'

export const contactMessageQueries = {
  // Check rate limit before creating (for better error messages)
  async checkRateLimit(email: string): Promise<{ allowed: boolean; message?: string }> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { count, error } = await supabase
      .from('contact_messages')
      .select('*', { count: 'exact', head: true })
      .eq('email', email)
      .gte('created_at', oneHourAgo)

    if (error) {
      logError('Error checking rate limit', error, 'contactMessageQueries')
      // If check fails, allow submission (fail open, but database trigger will catch it)
      return { allowed: true }
    }

    const RATE_LIMIT_PER_HOUR = 3
    const recentCount = count || 0

    if (recentCount >= RATE_LIMIT_PER_HOUR) {
      return {
        allowed: false,
        message: `Rate limit exceeded. You can only submit ${RATE_LIMIT_PER_HOUR} messages per hour. Please try again later.`
      }
    }

    return { allowed: true }
  },

  // Create a new contact message
  async create(input: CreateContactMessageInput): Promise<ContactMessage | null> {
    // Check rate limit first (for better UX - shows error before database trigger)
    const rateLimitCheck = await this.checkRateLimit(input.email)
    if (!rateLimitCheck.allowed) {
      throw new Error(rateLimitCheck.message || 'Rate limit exceeded')
    }

    const { data, error } = await supabase
      .from('contact_messages')
      .insert({
        full_name: input.full_name,
        email: input.email,
        phone: input.phone || null,
        subject: input.subject,
        message: input.message,
        status: 'new'
      })
      .select()
      .single()

    if (error) {
      logError('Error creating contact message', error, 'contactMessageQueries')
      
      // Handle rate limit error from database trigger
      if (error.message?.includes('Rate limit exceeded') || error.code === 'P0001') {
        throw new Error('Rate limit exceeded. You can only submit 3 messages per hour. Please try again later.')
      }
      
      throw new Error(error.message || 'Failed to create contact message')
    }

    return data
  },

  // Get contact message by ID
  async getById(id: string): Promise<ContactMessage | null> {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      logError('Error fetching contact message', error, 'contactMessageQueries')
      return null
    }

    return data
  },

  // Get all contact messages (for admin)
  async getAll(): Promise<ContactMessage[]> {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      logError('Error fetching contact messages', error, 'contactMessageQueries')
      return []
    }

    return data || []
  },

  // Update contact message status
  async updateStatus(id: string, status: ContactMessage['status']): Promise<ContactMessage | null> {
    const { data, error } = await supabase
      .from('contact_messages')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logError('Error updating contact message status', error, 'contactMessageQueries')
      return null
    }

    return data
  }
}

