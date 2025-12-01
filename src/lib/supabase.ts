import { createClient } from '@supabase/supabase-js'
import { env, isEnvConfigured } from './env'

// Initialize Supabase client only if environment is configured
// This prevents crashes when env vars are missing
let supabaseClient: ReturnType<typeof createClient>;

try {
  if (isEnvConfigured()) {
    // Only access env properties if configured (to avoid Proxy throwing)
    supabaseClient = createClient(env.supabaseUrl, env.supabaseAnonKey);
  } else {
    // Create a dummy client that throws helpful errors when used
    // This allows the app to load and show the error screen
    supabaseClient = createClient('https://placeholder.supabase.co', 'placeholder-key') as any;
  }
} catch (error) {
  // Fallback: create a dummy client if initialization fails
  // This will allow the app to load and show the error screen
  supabaseClient = createClient('https://placeholder.supabase.co', 'placeholder-key') as any;
}

export const supabase = supabaseClient;

// Import database types
import type {
  Property,
  PropertyImage,
  Guest,
  Booking,
  AvailabilityCalendar,
  Admin
} from '../types/database'

// Database type definition for Supabase
export type Database = {
  public: {
    Tables: {
      properties: {
        Row: Property
        Insert: Omit<Property, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Property, 'id' | 'created_at' | 'updated_at'>>
      }
      property_images: {
        Row: PropertyImage
        Insert: Omit<PropertyImage, 'id' | 'created_at'>
        Update: Partial<Omit<PropertyImage, 'id' | 'created_at'>>
      }
      guests: {
        Row: Guest
        Insert: Omit<Guest, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Guest, 'id' | 'created_at' | 'updated_at'>>
      }
      bookings: {
        Row: Booking
        Insert: Omit<Booking, 'id' | 'created_at' | 'updated_at' | 'total_nights'>
        Update: Partial<Omit<Booking, 'id' | 'created_at' | 'updated_at' | 'total_nights'>>
      }
      availability_calendar: {
        Row: AvailabilityCalendar
        Insert: Omit<AvailabilityCalendar, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AvailabilityCalendar, 'id' | 'created_at' | 'updated_at'>>
      }
      admins: {
        Row: Admin
        Insert: Omit<Admin, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Admin, 'id' | 'created_at' | 'updated_at'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      property_status: 'active' | 'inactive' | 'maintenance' | 'sold'
      booking_status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
      guest_status: 'active' | 'inactive' | 'blocked'
      admin_role: 'admin' | 'super_admin' | 'moderator'
      admin_status: 'active' | 'inactive' | 'suspended'
    }
  }
}
