import { describe, it, expect } from 'vitest'
import {
  calculateBookingPricing,
  calculateSimplePricing,
  formatCurrency,
  type BookingPricingInput,
} from '../pricing'

describe('calculateBookingPricing', () => {
  it('should calculate pricing correctly with default rates', () => {
    const input: BookingPricingInput = {
      pricePerNight: 10000,
      nights: 3,
      cleaningFee: 5000,
    }

    const result = calculateBookingPricing(input)

    // Base price = 10000 * 3 = 30000
    expect(result.basePrice).toBe(30000)
    
    // Service fee = 30000 * 0.12 = 3600
    expect(result.serviceFee).toBe(3600)
    
    // Subtotal = 30000 + 5000 + 3600 = 38600
    // Taxes = 38600 * 0.08 = 3088 (rounded)
    expect(result.taxes).toBe(3088)
    
    // Total = 38600 + 3088 = 41688
    expect(result.totalAmount).toBe(41688)
    
    expect(result.cleaningFee).toBe(5000)
    expect(result.securityDeposit).toBe(0)
    expect(result.currency).toBe('XOF')
  })

  it('should include security deposit in result but not in total', () => {
    const input: BookingPricingInput = {
      pricePerNight: 10000,
      nights: 2,
      cleaningFee: 3000,
      securityDeposit: 20000,
    }

    const result = calculateBookingPricing(input)

    expect(result.securityDeposit).toBe(20000)
    // Security deposit should NOT be included in total
    expect(result.totalAmount).toBeLessThan(30000) // Base + fees + taxes only
  })

  it('should allow custom service fee and tax rates', () => {
    const input: BookingPricingInput = {
      pricePerNight: 10000,
      nights: 2,
      cleaningFee: 2000,
      serviceFeeRate: 0.10, // 10%
      taxRate: 0.05, // 5%
    }

    const result = calculateBookingPricing(input)

    // Base = 20000
    // Service fee = 20000 * 0.10 = 2000
    expect(result.serviceFee).toBe(2000)
    
    // Subtotal = 20000 + 2000 + 2000 = 24000
    // Taxes = 24000 * 0.05 = 1200
    expect(result.taxes).toBe(1200)
    
    // Total = 24000 + 1200 = 25200
    expect(result.totalAmount).toBe(25200)
  })

  it('should handle zero cleaning fee', () => {
    const input: BookingPricingInput = {
      pricePerNight: 5000,
      nights: 1,
      cleaningFee: 0,
    }

    const result = calculateBookingPricing(input)

    expect(result.basePrice).toBe(5000)
    expect(result.cleaningFee).toBe(0)
    expect(result.serviceFee).toBe(600) // 5000 * 0.12
    expect(result.totalAmount).toBeGreaterThan(5000)
  })

  it('should round service fee and taxes correctly', () => {
    const input: BookingPricingInput = {
      pricePerNight: 3333,
      nights: 3,
      cleaningFee: 1111,
    }

    const result = calculateBookingPricing(input)

    // Base = 9999
    // Service fee = 9999 * 0.12 = 1199.88 -> rounded to 1200
    expect(result.serviceFee).toBe(1200)
    
    // Subtotal = 9999 + 1111 + 1200 = 12310
    // Taxes = 12310 * 0.08 = 984.8 -> rounded to 985
    expect(result.taxes).toBe(985)
  })

  it('should handle single night booking', () => {
    const input: BookingPricingInput = {
      pricePerNight: 15000,
      nights: 1,
      cleaningFee: 5000,
    }

    const result = calculateBookingPricing(input)

    expect(result.basePrice).toBe(15000)
    expect(result.nights).toBeUndefined() // nights is not in output
    expect(result.totalAmount).toBeGreaterThan(15000)
  })

  it('should handle large numbers correctly', () => {
    const input: BookingPricingInput = {
      pricePerNight: 100000,
      nights: 7,
      cleaningFee: 50000,
    }

    const result = calculateBookingPricing(input)

    expect(result.basePrice).toBe(700000)
    expect(result.serviceFee).toBe(84000) // 700000 * 0.12
    // Subtotal = 700000 + 50000 + 84000 = 834000
    // Taxes = 834000 * 0.08 = 66720
    // Total = 834000 + 66720 = 900720
    expect(result.totalAmount).toBe(900720)
  })
})

describe('calculateSimplePricing', () => {
  it('should calculate pricing without service fee', () => {
    const result = calculateSimplePricing(10000, 3, 5000)

    expect(result.basePrice).toBe(30000)
    expect(result.cleaningFee).toBe(5000)
    expect(result.serviceFee).toBeUndefined()
    
    // Subtotal = 30000 + 5000 = 35000
    // Taxes = 35000 * 0.10 = 3500
    expect(result.taxes).toBe(3500)
    
    // Total = 35000 + 3500 = 38500
    expect(result.totalAmount).toBe(38500)
  })

  it('should allow custom tax rate', () => {
    const result = calculateSimplePricing(10000, 2, 3000, 0.15) // 15% tax

    expect(result.basePrice).toBe(20000)
    // Taxes = 23000 * 0.15 = 3450
    expect(result.taxes).toBe(3450)
    expect(result.totalAmount).toBe(26450)
  })

  it('should handle zero cleaning fee', () => {
    const result = calculateSimplePricing(5000, 1, 0)

    expect(result.basePrice).toBe(5000)
    expect(result.cleaningFee).toBe(0)
    expect(result.taxes).toBe(500) // 5000 * 0.10
    expect(result.totalAmount).toBe(5500)
  })
})

describe('formatCurrency', () => {
  it('should format XOF currency correctly', () => {
    const result = formatCurrency(12345)
    // XOF format: "12 345 FCFA" or similar
    expect(result).toContain('12')
    expect(result).toContain('345')
  })

  it('should format large numbers correctly', () => {
    const result = formatCurrency(1000000)
    expect(result).toContain('1')
    expect(result).toContain('000')
  })

  it('should format zero correctly', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
  })

  it('should allow custom currency', () => {
    const result = formatCurrency(100, 'USD')
    expect(result).toContain('100')
  })
})

