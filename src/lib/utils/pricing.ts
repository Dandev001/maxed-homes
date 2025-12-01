/**
 * Shared pricing calculation utilities for bookings
 * Ensures consistent pricing calculations across all booking flows
 */

export interface BookingPricingInput {
  pricePerNight: number
  nights: number
  cleaningFee: number
  securityDeposit?: number
  serviceFeeRate?: number // Default: 0.12 (12%)
  taxRate?: number // Default: 0.08 (8%)
}

export interface BookingPricing {
  basePrice: number
  cleaningFee: number
  securityDeposit: number
  serviceFee: number
  taxes: number
  totalAmount: number
  currency?: string
}

/**
 * Calculate booking pricing with consistent formula
 * 
 * Formula:
 * - Base Price = pricePerNight × nights
 * - Service Fee = basePrice × serviceFeeRate (default 12%)
 * - Subtotal = basePrice + cleaningFee + serviceFee
 * - Taxes = subtotal × taxRate (default 8%)
 * - Total = subtotal + taxes
 * 
 * Note: Security deposit is included in the pricing object but NOT in totalAmount
 * (security deposits are typically held separately and refunded after stay)
 * 
 * @param input Pricing input parameters
 * @returns Calculated pricing breakdown
 */
export function calculateBookingPricing(input: BookingPricingInput): BookingPricing {
  const {
    pricePerNight,
    nights,
    cleaningFee = 0,
    securityDeposit = 0,
    serviceFeeRate = 0.12, // 12% service fee
    taxRate = 0.08, // 8% tax
  } = input

  // Calculate base price
  const basePrice = pricePerNight * nights

  // Calculate service fee (12% of base price)
  const serviceFee = Math.round(basePrice * serviceFeeRate)

  // Calculate subtotal (base + cleaning + service fee)
  const subtotal = basePrice + cleaningFee + serviceFee

  // Calculate taxes (8% of subtotal)
  const taxes = Math.round(subtotal * taxRate)

  // Calculate total (subtotal + taxes)
  // Note: Security deposit is NOT included in total - it's held separately
  const totalAmount = subtotal + taxes

  return {
    basePrice,
    cleaningFee,
    securityDeposit,
    serviceFee,
    taxes,
    totalAmount,
    currency: 'XOF', // Default currency
  }
}

/**
 * Calculate pricing for display (simplified version without service fee)
 * Used for quick estimates or when service fee is not applicable
 * 
 * @param pricePerNight Price per night
 * @param nights Number of nights
 * @param cleaningFee Cleaning fee
 * @param taxRate Tax rate (default: 0.10 for 10%)
 * @returns Simplified pricing breakdown
 */
export function calculateSimplePricing(
  pricePerNight: number,
  nights: number,
  cleaningFee: number = 0,
  taxRate: number = 0.10 // 10% tax for simple calculation
): Omit<BookingPricing, 'serviceFee' | 'securityDeposit'> {
  const basePrice = pricePerNight * nights
  const subtotal = basePrice + cleaningFee
  const taxes = Math.round(subtotal * taxRate)
  const totalAmount = subtotal + taxes

  return {
    basePrice,
    cleaningFee,
    taxes,
    totalAmount,
    currency: 'XOF',
  }
}

/**
 * Format currency for display
 * 
 * @param amount Amount to format
 * @param currency Currency code (default: XOF)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'XOF'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

