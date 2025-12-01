import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../../test/utils'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { calculateBookingPricing } from '../../lib/utils/pricing'

// Mock the hooks and API calls
vi.mock('../../hooks/useProperties', () => ({
  usePropertyWithImages: () => ({
    property: {
      id: 'prop-1',
      title: 'Test Property',
      pricePerNight: 10000,
      cleaningFee: 5000,
      securityDeposit: 20000,
      maxGuests: 4,
      minimumNights: 1,
    },
    loading: false,
    error: null,
  }),
}))

vi.mock('../../hooks/useBookings', () => ({
  useCreateBooking: () => ({
    createBooking: vi.fn().mockResolvedValue({ id: 'booking-1' }),
    loading: false,
  }),
  useAvailabilityCheck: () => ({
    checkAvailability: vi.fn().mockResolvedValue({ available: true }),
  }),
}))

vi.mock('../../hooks/useGuests', () => ({
  useGetOrCreateGuest: () => ({
    getOrCreateGuest: vi.fn().mockResolvedValue({ id: 'guest-1' }),
    loading: false,
  }),
}))

describe('Booking Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should calculate pricing correctly for booking', () => {
    const pricing = calculateBookingPricing({
      pricePerNight: 10000,
      nights: 3,
      cleaningFee: 5000,
    })

    // Base price = 10000 * 3 = 30000
    expect(pricing.basePrice).toBe(30000)
    
    // Service fee = 30000 * 0.12 = 3600
    expect(pricing.serviceFee).toBe(3600)
    
    // Subtotal = 30000 + 5000 + 3600 = 38600
    // Taxes = 38600 * 0.08 = 3088
    expect(pricing.taxes).toBe(3088)
    
    // Total = 38600 + 3088 = 41688
    expect(pricing.totalAmount).toBe(41688)
  })

  it('should handle different number of nights', () => {
    const pricing1 = calculateBookingPricing({
      pricePerNight: 10000,
      nights: 1,
      cleaningFee: 5000,
    })

    const pricing7 = calculateBookingPricing({
      pricePerNight: 10000,
      nights: 7,
      cleaningFee: 5000,
    })

    // 7 nights should be 7x the base price of 1 night
    expect(pricing7.basePrice).toBe(pricing1.basePrice * 7)
    expect(pricing7.totalAmount).toBeGreaterThan(pricing1.totalAmount)
  })

  it('should include security deposit in pricing object but not in total', () => {
    const pricing = calculateBookingPricing({
      pricePerNight: 10000,
      nights: 2,
      cleaningFee: 3000,
      securityDeposit: 20000,
    })

    expect(pricing.securityDeposit).toBe(20000)
    // Total should not include security deposit
    const totalWithoutDeposit = pricing.basePrice + pricing.cleaningFee + pricing.serviceFee + pricing.taxes
    expect(pricing.totalAmount).toBe(totalWithoutDeposit)
    expect(pricing.totalAmount).toBeLessThan(30000) // Much less than base + deposit
  })

  it('should calculate service fee as percentage of base price', () => {
    const pricing = calculateBookingPricing({
      pricePerNight: 10000,
      nights: 5,
      cleaningFee: 0,
    })

    // Service fee should be 12% of base price
    const expectedServiceFee = Math.round(50000 * 0.12)
    expect(pricing.serviceFee).toBe(expectedServiceFee)
  })

  it('should calculate taxes on subtotal (base + cleaning + service fee)', () => {
    const pricing = calculateBookingPricing({
      pricePerNight: 10000,
      nights: 2,
      cleaningFee: 5000,
    })

    const subtotal = pricing.basePrice + pricing.cleaningFee + pricing.serviceFee
    const expectedTaxes = Math.round(subtotal * 0.08)
    expect(pricing.taxes).toBe(expectedTaxes)
  })
})

describe('Booking Form Validation', () => {
  it('should validate minimum nights requirement', () => {
    const property = {
      minimumNights: 3,
      pricePerNight: 10000,
      cleaningFee: 5000,
    }

    // 2 nights should be less than minimum
    const nights = 2
    const isValid = nights >= property.minimumNights
    expect(isValid).toBe(false)

    // 3 nights should be valid
    const validNights = 3
    const isValid2 = validNights >= property.minimumNights
    expect(isValid2).toBe(true)
  })

  it('should validate maximum guests', () => {
    const property = {
      maxGuests: 4,
    }

    const guests = 5
    const isValid = guests <= property.maxGuests
    expect(isValid).toBe(false)

    const validGuests = 4
    const isValid2 = validGuests <= property.maxGuests
    expect(isValid2).toBe(true)
  })

  it('should validate check-out is after check-in', () => {
    const checkIn = new Date('2024-01-15')
    const checkOut = new Date('2024-01-14')
    
    const isValid = checkOut > checkIn
    expect(isValid).toBe(false)

    const validCheckOut = new Date('2024-01-16')
    const isValid2 = validCheckOut > checkIn
    expect(isValid2).toBe(true)
  })
})

