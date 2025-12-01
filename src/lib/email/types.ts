// Email notification types

export type EmailTemplate = 
  | 'booking_request_created'
  | 'booking_approved'
  | 'booking_rejected'
  | 'booking_cancelled'
  | 'payment_required'
  | 'payment_received'
  | 'payment_confirmed'
  | 'booking_confirmed'

export interface EmailRecipient {
  email: string
  name?: string
}

export interface EmailData {
  template: EmailTemplate
  to: EmailRecipient | EmailRecipient[]
  subject?: string
  data: Record<string, any>
}

export interface EmailResponse {
  success: boolean
  messageId?: string
  error?: string
}

export interface BookingEmailData {
  bookingId: string
  guestName: string
  guestEmail: string
  propertyTitle: string
  propertyAddress: string
  checkInDate: string
  checkOutDate: string
  totalNights: number
  totalAmount: number
  bookingStatus: string
  paymentMethod?: string
  paymentReference?: string
  paymentExpiresAt?: string
  specialRequests?: string
  cancellationReason?: string
}

