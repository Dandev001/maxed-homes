// Email templates for notifications
import type { BookingEmailData } from './types'

const APP_NAME = 'MAXED HOMES'
const APP_URL = import.meta.env.VITE_APP_URL || 'https://maxedhomes.com'

/**
 * Generate HTML email template
 */
function generateEmailHTML(title: string, body: string, ctaText?: string, ctaUrl?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px; text-align: center;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #1a1a1a; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: 2px;">${APP_NAME}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px; font-weight: 600;">${title}</h2>
              <div style="color: #333333; font-size: 16px; line-height: 1.6;">
                ${body}
              </div>
              ${ctaText && ctaUrl ? `
              <table role="presentation" style="margin: 30px 0; width: 100%;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${ctaUrl}" style="display: inline-block; padding: 14px 32px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">${ctaText}</a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #f9f9f9; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
              <p style="margin: 0; color: #999999; font-size: 12px;">This is an automated email. Please do not reply.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

/**
 * Format date
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Booking Request Created Email
 */
export function bookingRequestCreatedTemplate(data: BookingEmailData) {
  const subject = `Booking Request Received - ${data.propertyTitle}`
  const body = `
    <p>Hello ${data.guestName},</p>
    <p>Thank you for your booking request! We've received your reservation request for:</p>
    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 10px;"><strong>Property:</strong> ${data.propertyTitle}</p>
      <p style="margin: 0 0 10px;"><strong>Address:</strong> ${data.propertyAddress}</p>
      <p style="margin: 0 0 10px;"><strong>Check-in:</strong> ${formatDate(data.checkInDate)}</p>
      <p style="margin: 0 0 10px;"><strong>Check-out:</strong> ${formatDate(data.checkOutDate)}</p>
      <p style="margin: 0 0 10px;"><strong>Total Nights:</strong> ${data.totalNights}</p>
      <p style="margin: 0;"><strong>Total Amount:</strong> ${formatCurrency(data.totalAmount)}</p>
    </div>
    <p>Your booking request is now pending approval. We'll notify you via email once the host reviews your request.</p>
    ${data.specialRequests ? `<p><strong>Special Requests:</strong> ${data.specialRequests}</p>` : ''}
    <p>You can view your booking status at any time by visiting your dashboard.</p>
  `
  
  return {
    subject,
    html: generateEmailHTML(
      'Booking Request Received',
      body,
      'View Booking',
      `${APP_URL}/booking-confirmation/${data.bookingId}`
    ),
    text: `Hello ${data.guestName},\n\nThank you for your booking request! We've received your reservation request for ${data.propertyTitle}.\n\nCheck-in: ${formatDate(data.checkInDate)}\nCheck-out: ${formatDate(data.checkOutDate)}\nTotal Nights: ${data.totalNights}\nTotal Amount: ${formatCurrency(data.totalAmount)}\n\nYour booking request is now pending approval. We'll notify you via email once the host reviews your request.\n\nView your booking: ${APP_URL}/booking-confirmation/${data.bookingId}`
  }
}

/**
 * Booking Approved Email (Payment Required)
 */
export function bookingApprovedTemplate(data: BookingEmailData) {
  const subject = `Booking Approved - Payment Required - ${data.propertyTitle}`
  const deadline = data.paymentExpiresAt ? formatDate(data.paymentExpiresAt) : '2 hours'
  
  const body = `
    <p>Hello ${data.guestName},</p>
    <p>Great news! Your booking request has been approved for:</p>
    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 10px;"><strong>Property:</strong> ${data.propertyTitle}</p>
      <p style="margin: 0 0 10px;"><strong>Check-in:</strong> ${formatDate(data.checkInDate)}</p>
      <p style="margin: 0 0 10px;"><strong>Check-out:</strong> ${formatDate(data.checkOutDate)}</p>
      <p style="margin: 0;"><strong>Total Amount:</strong> ${formatCurrency(data.totalAmount)}</p>
    </div>
    <p style="color: #d97706; font-weight: 600;">⚠️ Payment Required</p>
    <p>To complete your booking, please make payment within <strong>${deadline}</strong>. After payment is received and verified, your booking will be confirmed.</p>
    <p>You can submit your payment and upload proof of payment through your booking confirmation page.</p>
  `
  
  return {
    subject,
    html: generateEmailHTML(
      'Booking Approved - Payment Required',
      body,
      'Complete Payment',
      `${APP_URL}/booking-confirmation/${data.bookingId}`
    ),
    text: `Hello ${data.guestName},\n\nGreat news! Your booking request has been approved for ${data.propertyTitle}.\n\nCheck-in: ${formatDate(data.checkInDate)}\nCheck-out: ${formatDate(data.checkOutDate)}\nTotal Amount: ${formatCurrency(data.totalAmount)}\n\n⚠️ Payment Required: To complete your booking, please make payment within ${deadline}.\n\nComplete payment: ${APP_URL}/booking-confirmation/${data.bookingId}`
  }
}

/**
 * Booking Rejected Email
 */
export function bookingRejectedTemplate(data: BookingEmailData) {
  const subject = `Booking Request Update - ${data.propertyTitle}`
  
  const reasonText = data.cancellationReason 
    ? `<p><strong>Reason:</strong> ${data.cancellationReason}</p>`
    : ''
  
  const body = `
    <p>Hello ${data.guestName},</p>
    <p>We're sorry to inform you that your booking request for <strong>${data.propertyTitle}</strong> has been declined.</p>
    ${reasonText}
    <p>We encourage you to explore other available properties on our platform.</p>
    <p>If you have any questions, please don't hesitate to contact our support team.</p>
  `
  
  const textReason = data.cancellationReason 
    ? `\n\nReason: ${data.cancellationReason}`
    : ''
  
  return {
    subject,
    html: generateEmailHTML(
      'Booking Request Declined',
      body,
      'Browse Properties',
      `${APP_URL}/properties`
    ),
    text: `Hello ${data.guestName},\n\nWe're sorry to inform you that your booking request for ${data.propertyTitle} has been declined.${textReason}\n\nWe encourage you to explore other available properties.\n\nBrowse properties: ${APP_URL}/properties`
  }
}

/**
 * Payment Received Email (Awaiting Confirmation)
 */
export function paymentReceivedTemplate(data: BookingEmailData) {
  const subject = `Payment Received - Awaiting Verification - ${data.propertyTitle}`
  
  const body = `
    <p>Hello ${data.guestName},</p>
    <p>We've received your payment for your booking at <strong>${data.propertyTitle}</strong>.</p>
    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 10px;"><strong>Payment Method:</strong> ${data.paymentMethod || 'N/A'}</p>
      <p style="margin: 0 0 10px;"><strong>Reference:</strong> ${data.paymentReference || 'N/A'}</p>
      <p style="margin: 0;"><strong>Amount:</strong> ${formatCurrency(data.totalAmount)}</p>
    </div>
    <p>Your payment is now being verified by our team. Once verified, you'll receive a confirmation email with check-in details.</p>
    <p>This process typically takes a few hours. We'll notify you as soon as your booking is confirmed.</p>
  `
  
  return {
    subject,
    html: generateEmailHTML(
      'Payment Received',
      body,
      'View Booking',
      `${APP_URL}/booking-confirmation/${data.bookingId}`
    ),
    text: `Hello ${data.guestName},\n\nWe've received your payment for your booking at ${data.propertyTitle}.\n\nPayment Method: ${data.paymentMethod || 'N/A'}\nReference: ${data.paymentReference || 'N/A'}\nAmount: ${formatCurrency(data.totalAmount)}\n\nYour payment is now being verified. Once verified, you'll receive a confirmation email with check-in details.\n\nView booking: ${APP_URL}/booking-confirmation/${data.bookingId}`
  }
}

/**
 * Booking Confirmed Email
 */
export function bookingConfirmedTemplate(data: BookingEmailData) {
  const subject = `Booking Confirmed! - ${data.propertyTitle}`
  
  const body = `
    <p>Hello ${data.guestName},</p>
    <p style="color: #059669; font-weight: 600; font-size: 18px;">🎉 Your booking is confirmed!</p>
    <p>Your reservation at <strong>${data.propertyTitle}</strong> has been confirmed. We're excited to host you!</p>
    <div style="background-color: #f0fdf4; border: 2px solid #059669; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 10px;"><strong>Property:</strong> ${data.propertyTitle}</p>
      <p style="margin: 0 0 10px;"><strong>Address:</strong> ${data.propertyAddress}</p>
      <p style="margin: 0 0 10px;"><strong>Check-in:</strong> ${formatDate(data.checkInDate)}</p>
      <p style="margin: 0 0 10px;"><strong>Check-out:</strong> ${formatDate(data.checkOutDate)}</p>
      <p style="margin: 0 0 10px;"><strong>Total Nights:</strong> ${data.totalNights}</p>
      <p style="margin: 0;"><strong>Total Amount:</strong> ${formatCurrency(data.totalAmount)}</p>
    </div>
    <p><strong>What's next?</strong></p>
    <ul style="margin: 10px 0; padding-left: 20px;">
      <li>You'll receive check-in instructions closer to your arrival date</li>
      <li>Save this confirmation email for your records</li>
      <li>Contact us if you have any questions or need to make changes</li>
    </ul>
    <p>We look forward to hosting you!</p>
  `
  
  return {
    subject,
    html: generateEmailHTML(
      'Booking Confirmed!',
      body,
      'View Booking Details',
      `${APP_URL}/booking-confirmation/${data.bookingId}`
    ),
    text: `Hello ${data.guestName},\n\n🎉 Your booking is confirmed!\n\nYour reservation at ${data.propertyTitle} has been confirmed.\n\nProperty: ${data.propertyTitle}\nAddress: ${data.propertyAddress}\nCheck-in: ${formatDate(data.checkInDate)}\nCheck-out: ${formatDate(data.checkOutDate)}\nTotal Nights: ${data.totalNights}\nTotal Amount: ${formatCurrency(data.totalAmount)}\n\nYou'll receive check-in instructions closer to your arrival date.\n\nView booking: ${APP_URL}/booking-confirmation/${data.bookingId}`
  }
}

/**
 * Booking Cancelled Email
 */
export function bookingCancelledTemplate(data: BookingEmailData) {
  const subject = `Booking Cancelled - ${data.propertyTitle}`
  
  const body = `
    <p>Hello ${data.guestName},</p>
    <p>Your booking for <strong>${data.propertyTitle}</strong> has been cancelled.</p>
    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 10px;"><strong>Property:</strong> ${data.propertyTitle}</p>
      <p style="margin: 0 0 10px;"><strong>Check-in:</strong> ${formatDate(data.checkInDate)}</p>
      <p style="margin: 0;"><strong>Check-out:</strong> ${formatDate(data.checkOutDate)}</p>
    </div>
    <p>If you have any questions about this cancellation or would like to book another property, please don't hesitate to contact us.</p>
  `
  
  return {
    subject,
    html: generateEmailHTML(
      'Booking Cancelled',
      body,
      'Browse Properties',
      `${APP_URL}/properties`
    ),
    text: `Hello ${data.guestName},\n\nYour booking for ${data.propertyTitle} has been cancelled.\n\nProperty: ${data.propertyTitle}\nCheck-in: ${formatDate(data.checkInDate)}\nCheck-out: ${formatDate(data.checkOutDate)}\n\nIf you have any questions, please contact us.\n\nBrowse properties: ${APP_URL}/properties`
  }
}

/**
 * Admin Notification - New Booking Request
 */
export function adminNewBookingTemplate(data: BookingEmailData) {
  const subject = `New Booking Request - ${data.propertyTitle}`
  
  const body = `
    <p>A new booking request has been submitted:</p>
    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 10px;"><strong>Guest:</strong> ${data.guestName} (${data.guestEmail})</p>
      <p style="margin: 0 0 10px;"><strong>Property:</strong> ${data.propertyTitle}</p>
      <p style="margin: 0 0 10px;"><strong>Address:</strong> ${data.propertyAddress}</p>
      <p style="margin: 0 0 10px;"><strong>Check-in:</strong> ${formatDate(data.checkInDate)}</p>
      <p style="margin: 0 0 10px;"><strong>Check-out:</strong> ${formatDate(data.checkOutDate)}</p>
      <p style="margin: 0 0 10px;"><strong>Total Nights:</strong> ${data.totalNights}</p>
      <p style="margin: 0;"><strong>Total Amount:</strong> ${formatCurrency(data.totalAmount)}</p>
    </div>
    <p>Please review and approve or reject this booking request in the admin dashboard.</p>
  `
  
  return {
    subject,
    html: generateEmailHTML(
      'New Booking Request',
      body,
      'Review Booking',
      `${APP_URL}/admin/bookings?booking=${data.bookingId}`
    ),
    text: `A new booking request has been submitted:\n\nGuest: ${data.guestName} (${data.guestEmail})\nProperty: ${data.propertyTitle}\nCheck-in: ${formatDate(data.checkInDate)}\nCheck-out: ${formatDate(data.checkOutDate)}\nTotal Amount: ${formatCurrency(data.totalAmount)}\n\nReview booking: ${APP_URL}/admin/bookings?booking=${data.bookingId}`
  }
}

/**
 * Admin Notification - Payment Awaiting Verification
 */
export function adminPaymentAwaitingTemplate(data: BookingEmailData) {
  const subject = `Payment Awaiting Verification - ${data.propertyTitle}`
  
  const body = `
    <p>A guest has submitted payment for their booking:</p>
    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 10px;"><strong>Guest:</strong> ${data.guestName} (${data.guestEmail})</p>
      <p style="margin: 0 0 10px;"><strong>Property:</strong> ${data.propertyTitle}</p>
      <p style="margin: 0 0 10px;"><strong>Payment Method:</strong> ${data.paymentMethod || 'N/A'}</p>
      <p style="margin: 0 0 10px;"><strong>Reference:</strong> ${data.paymentReference || 'N/A'}</p>
      <p style="margin: 0;"><strong>Amount:</strong> ${formatCurrency(data.totalAmount)}</p>
    </div>
    <p>Please verify the payment and confirm the booking in the admin dashboard.</p>
  `
  
  return {
    subject,
    html: generateEmailHTML(
      'Payment Awaiting Verification',
      body,
      'Verify Payment',
      `${APP_URL}/admin/bookings?booking=${data.bookingId}`
    ),
    text: `A guest has submitted payment for their booking:\n\nGuest: ${data.guestName} (${data.guestEmail})\nProperty: ${data.propertyTitle}\nPayment Method: ${data.paymentMethod || 'N/A'}\nReference: ${data.paymentReference || 'N/A'}\nAmount: ${formatCurrency(data.totalAmount)}\n\nVerify payment: ${APP_URL}/admin/bookings?booking=${data.bookingId}`
  }
}

