// Supabase Edge Function to expire unpaid bookings
// This function should be called periodically (e.g., every 15-30 minutes) via cron job
// or Supabase scheduled functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Supabase credentials from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required')
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Call the database function to expire unpaid bookings
    const { data: expiredCount, error } = await supabase.rpc('expire_unpaid_bookings')

    if (error) {
      console.error('Error expiring unpaid bookings:', error)
      
      // Fallback: Try direct update if RPC fails
      const now = new Date().toISOString()
      const { data: bookingsToExpire, error: fetchError } = await supabase
        .from('bookings')
        .select('id')
        .eq('status', 'awaiting_payment')
        .not('payment_expires_at', 'is', null)
        .lt('payment_expires_at', now)

      if (fetchError) {
        throw new Error(`Failed to fetch bookings: ${fetchError.message}`)
      }

      if (!bookingsToExpire || bookingsToExpire.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            expired: 0,
            message: 'No bookings to expire'
          }),
          { 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        )
      }

      // Update bookings directly
      const { data: updatedBookings, error: updateError } = await supabase
        .from('bookings')
        .update({ 
          status: 'expired',
          cancelled_at: now,
          updated_at: now
        })
        .eq('status', 'awaiting_payment')
        .not('payment_expires_at', 'is', null)
        .lt('payment_expires_at', now)
        .select('id')

      if (updateError) {
        throw new Error(`Failed to update bookings: ${updateError.message}`)
      }

      const expired = updatedBookings?.length || 0

      return new Response(
        JSON.stringify({ 
          success: true, 
          expired,
          message: `Expired ${expired} booking(s)`,
          method: 'direct_update'
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        expired: expiredCount || 0,
        message: `Expired ${expiredCount || 0} booking(s)`,
        method: 'rpc_function'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error in expire-bookings function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

