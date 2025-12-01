// Email service for sending notifications
import { logError, logDebug } from '../../utils/logger'
import type { EmailData, EmailResponse, BookingEmailData } from './types'
import {
  bookingRequestCreatedTemplate,
  bookingApprovedTemplate,
  bookingRejectedTemplate,
  paymentReceivedTemplate,
  bookingConfirmedTemplate,
  bookingCancelledTemplate,
  adminNewBookingTemplate,
  adminPaymentAwaitingTemplate,
} from './templates'

/**
 * Email service configuration
 */
interface EmailConfig {
  enabled: boolean
  apiEndpoint?: string
  provider?: 'supabase' | 'resend' | 'sendgrid' | 'custom'
}

const emailConfig: EmailConfig = {
  enabled: import.meta.env.VITE_EMAIL_ENABLED !== 'false',
  apiEndpoint: import.meta.env.VITE_EMAIL_API_ENDPOINT,
  provider: (import.meta.env.VITE_EMAIL_PROVIDER as EmailConfig['provider']) || 'supabase',
}

/**
 * Send email via API endpoint (Supabase Edge Function or custom API)
 */
async function sendEmailViaAPI(emailData: EmailData): Promise<EmailResponse> {
  if (!emailConfig.apiEndpoint) {
    throw new Error('Email API endpoint not configured. Set VITE_EMAIL_API_ENDPOINT environment variable.')
  }

  try {
    const response = await fetch(emailConfig.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Email API error: ${response.status} - ${error}`)
    }

    const result = await response.json()
    return {
      success: true,
      messageId: result.messageId || result.id,
    }
  } catch (error) {
    logError('Failed to send email via API', error, 'emailService')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send email notification
 */
export async function sendEmail(emailData: EmailData): Promise<EmailResponse> {
  if (!emailConfig.enabled) {
    logDebug('Email notifications are disabled', {}, 'emailService')
    return {
      success: true,
      messageId: 'disabled',
    }
  }

  // In development, log email instead of sending
  if (import.meta.env.DEV && !emailConfig.apiEndpoint) {
    logDebug('Email would be sent (dev mode)', {
      template: emailData.template,
      to: emailData.to,
      subject: emailData.subject,
    }, 'emailService')
    return {
      success: true,
      messageId: 'dev-mode',
    }
  }

  return sendEmailViaAPI(emailData)
}

/**
 * Send booking request created email to guest
 */
export async function sendBookingRequestCreatedEmail(data: BookingEmailData): Promise<EmailResponse> {
  const template = bookingRequestCreatedTemplate(data)
  
  return sendEmail({
    template: 'booking_request_created',
    to: {
      email: data.guestEmail,
      name: data.guestName,
    },
    subject: template.subject,
    data: {
      ...data,
      html: template.html,
      text: template.text,
    },
  })
}

/**
 * Send booking approved email to guest (payment required)
 */
export async function sendBookingApprovedEmail(data: BookingEmailData): Promise<EmailResponse> {
  const template = bookingApprovedTemplate(data)
  
  return sendEmail({
    template: 'booking_approved',
    to: {
      email: data.guestEmail,
      name: data.guestName,
    },
    subject: template.subject,
    data: {
      ...data,
      html: template.html,
      text: template.text,
    },
  })
}

/**
 * Send booking rejected email to guest
 */
export async function sendBookingRejectedEmail(data: BookingEmailData): Promise<EmailResponse> {
  const template = bookingRejectedTemplate(data)
  
  return sendEmail({
    template: 'booking_rejected',
    to: {
      email: data.guestEmail,
      name: data.guestName,
    },
    subject: template.subject,
    data: {
      ...data,
      html: template.html,
      text: template.text,
    },
  })
}

/**
 * Send payment received email to guest
 */
export async function sendPaymentReceivedEmail(data: BookingEmailData): Promise<EmailResponse> {
  const template = paymentReceivedTemplate(data)
  
  return sendEmail({
    template: 'payment_received',
    to: {
      email: data.guestEmail,
      name: data.guestName,
    },
    subject: template.subject,
    data: {
      ...data,
      html: template.html,
      text: template.text,
    },
  })
}

/**
 * Send booking confirmed email to guest
 */
export async function sendBookingConfirmedEmail(data: BookingEmailData): Promise<EmailResponse> {
  const template = bookingConfirmedTemplate(data)
  
  return sendEmail({
    template: 'booking_confirmed',
    to: {
      email: data.guestEmail,
      name: data.guestName,
    },
    subject: template.subject,
    data: {
      ...data,
      html: template.html,
      text: template.text,
    },
  })
}

/**
 * Send booking cancelled email to guest
 */
export async function sendBookingCancelledEmail(data: BookingEmailData): Promise<EmailResponse> {
  const template = bookingCancelledTemplate(data)
  
  return sendEmail({
    template: 'booking_cancelled',
    to: {
      email: data.guestEmail,
      name: data.guestName,
    },
    subject: template.subject,
    data: {
      ...data,
      html: template.html,
      text: template.text,
    },
  })
}

/**
 * Send new booking notification to admin
 */
export async function sendAdminNewBookingEmail(
  data: BookingEmailData,
  adminEmail: string
): Promise<EmailResponse> {
  const template = adminNewBookingTemplate(data)
  
  return sendEmail({
    template: 'booking_request_created',
    to: {
      email: adminEmail,
      name: 'Admin',
    },
    subject: template.subject,
    data: {
      ...data,
      html: template.html,
      text: template.text,
    },
  })
}

/**
 * Send payment awaiting verification notification to admin
 */
export async function sendAdminPaymentAwaitingEmail(
  data: BookingEmailData,
  adminEmail: string
): Promise<EmailResponse> {
  const template = adminPaymentAwaitingTemplate(data)
  
  return sendEmail({
    template: 'payment_received',
    to: {
      email: adminEmail,
      name: 'Admin',
    },
    subject: template.subject,
    data: {
      ...data,
      html: template.html,
      text: template.text,
    },
  })
}

