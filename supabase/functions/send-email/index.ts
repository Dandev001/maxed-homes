// Supabase Edge Function for sending emails via Resend
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "https://esm.sh/resend@2.0.0"

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
    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }

    const resend = new Resend(resendApiKey)

    // Get sender email from environment (default to noreply)
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Maxed Homes <noreply@maxedhomes.com>'
    const fromName = Deno.env.get('RESEND_FROM_NAME') || 'Maxed Homes'

    // Parse request body
    const { template, to, subject, data } = await req.json()

    // Validate required fields
    if (!to || !data) {
      throw new Error('Missing required fields: to and data are required')
    }

    // Extract email addresses and names
    const recipients = Array.isArray(to) ? to : [to]
    const toEmails = recipients.map(r => typeof r === 'string' ? r : r.email)
    const toNames = recipients.map(r => typeof r === 'string' ? undefined : r.name)

    // Use the HTML and text from data (already formatted by templates)
    const { html, text } = data

    if (!html && !text) {
      throw new Error('Email content (html or text) is required in data')
    }

    // Send email via Resend
    const result = await resend.emails.send({
      from: fromEmail,
      to: toEmails,
      subject: subject || 'Notification from Maxed Homes',
      html: html || undefined,
      text: text || undefined,
      reply_to: Deno.env.get('RESEND_REPLY_TO') || undefined,
    })

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.data?.id,
        to: toEmails,
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error sending email:', error)
    
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

