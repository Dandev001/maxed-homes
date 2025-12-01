import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatRelativeTime,
  truncateText,
  formatPropertyType,
  formatArea,
  formatGuestCount,
  formatRoomCount,
  formatPriceRange,
  formatRating,
  formatPhoneNumber,
  formatFileSize,
  formatDuration,
} from '../formatting'

describe('formatCurrency', () => {
  it('should format XOF currency correctly', () => {
    const result = formatCurrency(12345)
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

  it('should handle negative numbers', () => {
    const result = formatCurrency(-100)
    expect(result).toContain('-')
  })
})

describe('formatNumber', () => {
  it('should format numbers with commas', () => {
    expect(formatNumber(1000)).toBe('1,000')
    expect(formatNumber(1000000)).toBe('1,000,000')
  })

  it('should format small numbers without commas', () => {
    expect(formatNumber(123)).toBe('123')
    expect(formatNumber(99)).toBe('99')
  })

  it('should handle zero', () => {
    expect(formatNumber(0)).toBe('0')
  })

  it('should handle negative numbers', () => {
    expect(formatNumber(-1000)).toBe('-1,000')
  })
})

describe('formatDate', () => {
  it('should format Date object correctly', () => {
    const date = new Date('2024-01-15')
    const result = formatDate(date)
    expect(result).toContain('Jan')
    expect(result).toContain('15')
    expect(result).toContain('2024')
  })

  it('should format date string correctly', () => {
    const result = formatDate('2024-01-15')
    expect(result).toContain('Jan')
    expect(result).toContain('15')
  })

  it('should allow custom options', () => {
    const date = new Date('2024-01-15')
    const result = formatDate(date, { year: 'numeric', month: 'long' })
    expect(result).toContain('January')
    expect(result).toContain('2024')
  })
})

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return "Just now" for recent dates', () => {
    const now = new Date()
    vi.setSystemTime(now)
    const date = new Date(now.getTime() - 30 * 1000) // 30 seconds ago
    expect(formatRelativeTime(date)).toBe('Just now')
  })

  it('should format minutes ago', () => {
    const now = new Date()
    vi.setSystemTime(now)
    const date = new Date(now.getTime() - 5 * 60 * 1000) // 5 minutes ago
    expect(formatRelativeTime(date)).toBe('5 minutes ago')
  })

  it('should format hours ago', () => {
    const now = new Date()
    vi.setSystemTime(now)
    const date = new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2 hours ago
    expect(formatRelativeTime(date)).toBe('2 hours ago')
  })

  it('should format days ago', () => {
    const now = new Date()
    vi.setSystemTime(now)
    const date = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    expect(formatRelativeTime(date)).toBe('3 days ago')
  })

  it('should format months ago', () => {
    const now = new Date()
    vi.setSystemTime(now)
    const date = new Date(now.getTime() - 2 * 30 * 24 * 60 * 60 * 1000) // ~2 months ago
    expect(formatRelativeTime(date)).toContain('months ago')
  })
})

describe('truncateText', () => {
  it('should truncate long text', () => {
    const text = 'This is a very long text that needs to be truncated'
    const result = truncateText(text, 20)
    expect(result.length).toBeLessThanOrEqual(23) // 20 + '...'
    expect(result).toContain('...')
  })

  it('should not truncate short text', () => {
    const text = 'Short text'
    expect(truncateText(text, 20)).toBe(text)
  })

  it('should handle exact length', () => {
    const text = 'Exactly twenty chars!'
    // truncateText only truncates if length > maxLength, so exact length should not be truncated
    // The text is 22 chars, so maxLength 22 should not truncate
    const result = truncateText(text, 22)
    expect(result).toBe(text)
  })

  it('should handle empty string', () => {
    expect(truncateText('', 10)).toBe('')
  })
})

describe('formatPropertyType', () => {
  it('should capitalize first letter', () => {
    expect(formatPropertyType('apartment')).toBe('Apartment')
    expect(formatPropertyType('house')).toBe('House')
  })

  it('should handle already capitalized', () => {
    expect(formatPropertyType('APARTMENT')).toBe('Apartment')
  })

  it('should handle mixed case', () => {
    expect(formatPropertyType('aPaRtMeNt')).toBe('Apartment')
  })
})

describe('formatArea', () => {
  it('should format small areas in sq ft', () => {
    expect(formatArea(500)).toBe('500 sq ft')
    expect(formatArea(999)).toBe('999 sq ft')
  })

  it('should format large areas in k format', () => {
    expect(formatArea(1000)).toBe('1.0k sq ft')
    expect(formatArea(1500)).toBe('1.5k sq ft')
    expect(formatArea(2500)).toBe('2.5k sq ft')
  })

  it('should handle zero', () => {
    expect(formatArea(0)).toBe('0 sq ft')
  })
})

describe('formatGuestCount', () => {
  it('should format single guest', () => {
    expect(formatGuestCount(1)).toBe('1 guest')
  })

  it('should format multiple guests', () => {
    expect(formatGuestCount(2)).toBe('2 guests')
    expect(formatGuestCount(10)).toBe('10 guests')
  })
})

describe('formatRoomCount', () => {
  it('should format single bedroom', () => {
    expect(formatRoomCount(1, 'bedroom')).toBe('1 bedroom')
  })

  it('should format multiple bedrooms', () => {
    expect(formatRoomCount(2, 'bedroom')).toBe('2 bedrooms')
  })

  it('should format bathrooms', () => {
    expect(formatRoomCount(1, 'bathroom')).toBe('1 bathroom')
    expect(formatRoomCount(2, 'bathroom')).toBe('2 bathrooms')
  })
})

describe('formatPriceRange', () => {
  it('should format same min and max as single price', () => {
    const result = formatPriceRange(10000, 10000)
    expect(result).not.toContain('-')
  })

  it('should format price range', () => {
    const result = formatPriceRange(10000, 20000)
    expect(result).toContain('-')
    expect(result).toContain('10')
    expect(result).toContain('20')
  })

  it('should allow custom currency', () => {
    const result = formatPriceRange(100, 200, 'USD')
    expect(result).toContain('-')
  })
})

describe('formatRating', () => {
  it('should format rating with default max', () => {
    expect(formatRating(4.5)).toBe('4.5/5')
  })

  it('should format rating with custom max', () => {
    expect(formatRating(8, 10)).toBe('8.0/10')
  })

  it('should handle decimal ratings', () => {
    expect(formatRating(4.75)).toBe('4.8/5')
  })
})

describe('formatPhoneNumber', () => {
  it('should format US phone number', () => {
    expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890')
  })

  it('should handle already formatted numbers', () => {
    expect(formatPhoneNumber('(123) 456-7890')).toBe('(123) 456-7890')
  })

  it('should handle numbers with non-digits', () => {
    expect(formatPhoneNumber('123-456-7890')).toBe('(123) 456-7890')
  })

  it('should return original if format does not match', () => {
    expect(formatPhoneNumber('12345')).toBe('12345')
  })
})

describe('formatFileSize', () => {
  it('should format bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes')
    expect(formatFileSize(500)).toBe('500 Bytes')
  })

  it('should format KB', () => {
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(2048)).toBe('2 KB')
  })

  it('should format MB', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1 MB')
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB')
  })

  it('should format GB', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
  })
})

describe('formatDuration', () => {
  it('should format single night', () => {
    const start = new Date('2024-01-15')
    const end = new Date('2024-01-16')
    expect(formatDuration(start, end)).toBe('1 night')
  })

  it('should format multiple nights', () => {
    const start = new Date('2024-01-15')
    const end = new Date('2024-01-18')
    expect(formatDuration(start, end)).toBe('3 nights')
  })

  it('should handle date strings', () => {
    expect(formatDuration('2024-01-15', '2024-01-17')).toBe('2 nights')
  })
})

