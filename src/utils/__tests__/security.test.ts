import { describe, it, expect, beforeEach } from 'vitest'
import {
  isValidUUID,
  isValidEmail,
  isValidPhone,
  isValidURL,
  containsDangerousContent,
  generateSecureToken,
  validatePasswordStrength,
  RateLimiter,
  isValidFileType,
  isValidFileSize,
  sanitizeFilename,
} from '../security'

describe('isValidUUID', () => {
  it('should validate correct UUIDs', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true)
  })

  it('should reject invalid UUIDs', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false)
    expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false)
    expect(isValidUUID('')).toBe(false)
  })
})

describe('isValidEmail', () => {
  it('should validate correct emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('user.name@example.co.uk')).toBe(true)
  })

  it('should reject invalid emails', () => {
    expect(isValidEmail('not-an-email')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
    expect(isValidEmail('test@')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })
})

describe('isValidPhone', () => {
  it('should validate correct phone numbers', () => {
    expect(isValidPhone('+1234567890')).toBe(true)
    expect(isValidPhone('(123) 456-7890')).toBe(true)
    expect(isValidPhone('123-456-7890')).toBe(true)
    expect(isValidPhone('1234567890')).toBe(true)
  })

  it('should reject invalid phone numbers', () => {
    expect(isValidPhone('abc')).toBe(false)
    // Note: '123' might be valid according to the regex, so we test with clearly invalid ones
    expect(isValidPhone('')).toBe(false)
    expect(isValidPhone('a')).toBe(false)
    expect(isValidPhone('12')).toBe(false) // Too short
  })
})

describe('isValidURL', () => {
  it('should validate http URLs', () => {
    expect(isValidURL('http://example.com')).toBe(true)
  })

  it('should validate https URLs', () => {
    expect(isValidURL('https://example.com')).toBe(true)
  })

  it('should reject invalid protocols', () => {
    expect(isValidURL('ftp://example.com')).toBe(false)
    expect(isValidURL('javascript:alert(1)')).toBe(false)
  })

  it('should reject invalid URLs', () => {
    expect(isValidURL('not-a-url')).toBe(false)
    expect(isValidURL('')).toBe(false)
  })
})

describe('containsDangerousContent', () => {
  it('should detect script tags', () => {
    expect(containsDangerousContent('<script>alert(1)</script>')).toBe(true)
  })

  it('should detect javascript: protocol', () => {
    expect(containsDangerousContent('javascript:alert(1)')).toBe(true)
  })

  it('should detect event handlers', () => {
    expect(containsDangerousContent('<div onclick="alert(1)">')).toBe(true)
  })

  it('should detect iframe tags', () => {
    expect(containsDangerousContent('<iframe src="evil.com">')).toBe(true)
  })

  it('should return false for safe content', () => {
    expect(containsDangerousContent('Hello World')).toBe(false)
    expect(containsDangerousContent('<p>Safe HTML</p>')).toBe(false)
  })

  it('should handle null and undefined', () => {
    expect(containsDangerousContent(null as any)).toBe(false)
    expect(containsDangerousContent(undefined as any)).toBe(false)
  })
})

describe('generateSecureToken', () => {
  it('should generate tokens of correct length', () => {
    expect(generateSecureToken(16).length).toBe(32) // 16 bytes = 32 hex chars
    expect(generateSecureToken(32).length).toBe(64) // 32 bytes = 64 hex chars
  })

  it('should generate different tokens each time', () => {
    const token1 = generateSecureToken()
    const token2 = generateSecureToken()
    expect(token1).not.toBe(token2)
  })

  it('should generate hex string', () => {
    const token = generateSecureToken(8)
    expect(token).toMatch(/^[0-9a-f]+$/)
  })
})

describe('validatePasswordStrength', () => {
  it('should validate strong passwords', () => {
    const result = validatePasswordStrength('StrongPass123!')
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject short passwords', () => {
    const result = validatePasswordStrength('Short1!')
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('8 characters'))).toBe(true)
  })

  it('should require lowercase letters', () => {
    const result = validatePasswordStrength('UPPERCASE123!')
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('lowercase'))).toBe(true)
  })

  it('should require uppercase letters', () => {
    const result = validatePasswordStrength('lowercase123!')
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('uppercase'))).toBe(true)
  })

  it('should require numbers', () => {
    const result = validatePasswordStrength('NoNumbers!')
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('number'))).toBe(true)
  })

  it('should require special characters', () => {
    const result = validatePasswordStrength('NoSpecial123')
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('special'))).toBe(true)
  })
})

describe('RateLimiter', () => {
  let limiter: RateLimiter

  beforeEach(() => {
    limiter = new RateLimiter(5, 1000) // 5 requests per 1000ms
  })

  it('should allow requests within limit', () => {
    expect(limiter.isAllowed('user1')).toBe(true)
    expect(limiter.isAllowed('user1')).toBe(true)
    expect(limiter.isAllowed('user1')).toBe(true)
    expect(limiter.isAllowed('user1')).toBe(true)
    expect(limiter.isAllowed('user1')).toBe(true)
  })

  it('should block requests over limit', () => {
    // Make 5 requests
    for (let i = 0; i < 5; i++) {
      limiter.isAllowed('user1')
    }
    // 6th request should be blocked
    expect(limiter.isAllowed('user1')).toBe(false)
  })

  it('should track different identifiers separately', () => {
    // User1 makes 5 requests
    for (let i = 0; i < 5; i++) {
      limiter.isAllowed('user1')
    }
    // User2 should still be allowed
    expect(limiter.isAllowed('user2')).toBe(true)
  })

  it('should return time until next allowed', () => {
    // Make 5 requests
    for (let i = 0; i < 5; i++) {
      limiter.isAllowed('user1')
    }
    const timeUntil = limiter.getTimeUntilNextAllowed('user1')
    expect(timeUntil).toBeGreaterThan(0)
    expect(timeUntil).toBeLessThanOrEqual(1000)
  })

  it('should clear rate limit for identifier', () => {
    // Make 5 requests
    for (let i = 0; i < 5; i++) {
      limiter.isAllowed('user1')
    }
    limiter.clear('user1')
    expect(limiter.isAllowed('user1')).toBe(true)
  })

  it('should clear all rate limits', () => {
    limiter.isAllowed('user1')
    limiter.isAllowed('user2')
    limiter.clearAll()
    expect(limiter.isAllowed('user1')).toBe(true)
    expect(limiter.isAllowed('user2')).toBe(true)
  })
})

describe('isValidFileType', () => {
  it('should validate allowed file types', () => {
    expect(isValidFileType('image.jpg', ['jpg', 'png'])).toBe(true)
    expect(isValidFileType('document.pdf', ['pdf', 'doc'])).toBe(true)
  })

  it('should reject disallowed file types', () => {
    expect(isValidFileType('script.exe', ['jpg', 'png'])).toBe(false)
    expect(isValidFileType('image.jpg', ['png', 'gif'])).toBe(false)
  })

  it('should handle case insensitive', () => {
    expect(isValidFileType('IMAGE.JPG', ['jpg'])).toBe(true)
  })

  it('should handle files without extension', () => {
    expect(isValidFileType('file', ['jpg'])).toBe(false)
  })
})

describe('isValidFileSize', () => {
  it('should validate file sizes within limit', () => {
    expect(isValidFileSize(1024 * 1024, 5)).toBe(true) // 1MB < 5MB
    expect(isValidFileSize(5 * 1024 * 1024, 5)).toBe(true) // 5MB = 5MB
  })

  it('should reject files over limit', () => {
    expect(isValidFileSize(6 * 1024 * 1024, 5)).toBe(false) // 6MB > 5MB
  })
})

describe('sanitizeFilename', () => {
  it('should remove invalid characters', () => {
    expect(sanitizeFilename('file<>name.txt')).toBe('file__name.txt')
  })

  it('should remove directory traversal attempts', () => {
    expect(sanitizeFilename('../../../etc/passwd')).not.toContain('..')
  })

  it('should remove leading dot', () => {
    expect(sanitizeFilename('.hidden')).not.toMatch(/^\./)
  })

  it('should limit length', () => {
    const longName = 'a'.repeat(300)
    expect(sanitizeFilename(longName).length).toBeLessThanOrEqual(255)
  })
})

