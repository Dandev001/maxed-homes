import { describe, it, expect } from 'vitest'
import {
  sanitizeString,
  sanitizeHTML,
  sanitizeEmail,
  sanitizePhone,
  sanitizeURL,
  sanitizeNumber,
  sanitizeInteger,
  sanitizeDate,
  sanitizeObject,
  truncateString,
  removeSQLInjectionPatterns,
} from '../sanitize'

describe('sanitizeString', () => {
  it('should remove script tags', () => {
    const input = '<script>alert("xss")</script>Hello'
    expect(sanitizeString(input)).toBe('Hello')
  })

  it('should remove iframe tags', () => {
    const input = '<iframe src="evil.com"></iframe>Content'
    expect(sanitizeString(input)).toBe('Content')
  })

  it('should remove event handlers', () => {
    const input = '<div onclick="alert(1)">Click</div>'
    expect(sanitizeString(input)).not.toContain('onclick')
  })

  it('should remove javascript: protocol', () => {
    const input = 'javascript:alert(1)'
    expect(sanitizeString(input)).not.toContain('javascript:')
  })

  it('should handle null and undefined', () => {
    expect(sanitizeString(null)).toBe('')
    expect(sanitizeString(undefined)).toBe('')
  })

  it('should trim whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello')
  })

  it('should remove null bytes', () => {
    expect(sanitizeString('hello\0world')).toBe('helloworld')
  })
})

describe('sanitizeHTML', () => {
  it('should remove script tags but preserve safe HTML', () => {
    const input = '<p>Hello</p><script>alert(1)</script>'
    const result = sanitizeHTML(input)
    expect(result).toContain('<p>Hello</p>')
    expect(result).not.toContain('<script>')
  })

  it('should remove event handlers', () => {
    const input = '<div onclick="alert(1)">Content</div>'
    expect(sanitizeHTML(input)).not.toContain('onclick')
  })

  it('should handle null and undefined', () => {
    expect(sanitizeHTML(null)).toBe('')
    expect(sanitizeHTML(undefined)).toBe('')
  })
})

describe('sanitizeEmail', () => {
  it('should sanitize valid email', () => {
    expect(sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com')
  })

  it('should remove angle brackets', () => {
    expect(sanitizeEmail('test<>@example.com')).toBe('test@example.com')
  })

  it('should throw on invalid email', () => {
    expect(() => sanitizeEmail('invalid-email')).toThrow('Invalid email format')
  })

  it('should handle null and undefined', () => {
    expect(sanitizeEmail(null)).toBe('')
    expect(sanitizeEmail(undefined)).toBe('')
  })
})

describe('sanitizePhone', () => {
  it('should keep + at start', () => {
    expect(sanitizePhone('+1234567890')).toBe('+1234567890')
  })

  it('should remove non-digit characters', () => {
    expect(sanitizePhone('(123) 456-7890')).toBe('1234567890')
  })

  it('should handle null and undefined', () => {
    expect(sanitizePhone(null)).toBe('')
    expect(sanitizePhone(undefined)).toBe('')
  })

  it('should trim whitespace', () => {
    expect(sanitizePhone('  1234567890  ')).toBe('1234567890')
  })
})

describe('sanitizeURL', () => {
  it('should allow http URLs', () => {
    expect(sanitizeURL('http://example.com')).toBe('http://example.com')
  })

  it('should allow https URLs', () => {
    expect(sanitizeURL('https://example.com')).toBe('https://example.com')
  })

  it('should allow mailto URLs', () => {
    expect(sanitizeURL('mailto:test@example.com')).toBe('mailto:test@example.com')
  })

  it('should throw on invalid protocol', () => {
    expect(() => sanitizeURL('javascript:alert(1)')).toThrow()
    expect(() => sanitizeURL('ftp://example.com')).toThrow()
  })

  it('should handle null and undefined', () => {
    expect(sanitizeURL(null)).toBe('')
    expect(sanitizeURL(undefined)).toBe('')
  })
})

describe('sanitizeNumber', () => {
  it('should parse string numbers', () => {
    expect(sanitizeNumber('123')).toBe(123)
    expect(sanitizeNumber('123.45')).toBe(123.45)
  })

  it('should handle number input', () => {
    expect(sanitizeNumber(123)).toBe(123)
  })

  it('should validate min', () => {
    expect(() => sanitizeNumber('5', 10)).toThrow('at least 10')
  })

  it('should validate max', () => {
    expect(() => sanitizeNumber('100', undefined, 50)).toThrow('at most 50')
  })

  it('should throw on invalid number', () => {
    expect(() => sanitizeNumber('abc')).toThrow('Invalid number format')
    expect(() => sanitizeNumber(null)).toThrow('Number is required')
  })
})

describe('sanitizeInteger', () => {
  it('should parse integers', () => {
    expect(sanitizeInteger('123')).toBe(123)
    expect(sanitizeInteger(456)).toBe(456)
  })

  it('should throw on decimals', () => {
    expect(() => sanitizeInteger('123.45')).toThrow('must be an integer')
  })

  it('should validate min and max', () => {
    expect(sanitizeInteger('50', 0, 100)).toBe(50)
    expect(() => sanitizeInteger('150', 0, 100)).toThrow()
  })
})

describe('sanitizeDate', () => {
  it('should validate ISO date format', () => {
    expect(sanitizeDate('2024-01-15')).toBe('2024-01-15')
    expect(sanitizeDate('2024-01-15T10:30:00Z')).toBe('2024-01-15T10:30:00Z')
  })

  it('should throw on invalid format', () => {
    expect(() => sanitizeDate('01/15/2024')).toThrow('Invalid date format')
  })

  it('should throw on invalid date', () => {
    expect(() => sanitizeDate('2024-13-45')).toThrow('Invalid date value')
  })

  it('should handle null and undefined', () => {
    expect(sanitizeDate(null)).toBe('')
    expect(sanitizeDate(undefined)).toBe('')
  })
})

describe('sanitizeObject', () => {
  it('should sanitize all string fields', () => {
    const obj = {
      name: '<script>alert(1)</script>John',
      age: 30,
      email: 'test@example.com',
    }
    const result = sanitizeObject(obj)
    expect(result.name).toBe('John')
    expect(result.age).toBe(30)
    expect(result.email).toBe('test@example.com')
  })

  it('should sanitize only specified fields', () => {
    const obj = {
      name: '<script>alert(1)</script>John',
      description: '<p>Safe</p>',
    }
    const result = sanitizeObject(obj, ['name'])
    expect(result.name).toBe('John')
    expect(result.description).toBe('<p>Safe</p>')
  })
})

describe('truncateString', () => {
  it('should truncate long strings', () => {
    expect(truncateString('Hello World', 5)).toBe('He...')
  })

  it('should not truncate short strings', () => {
    expect(truncateString('Hi', 10)).toBe('Hi')
  })

  it('should handle null and undefined', () => {
    expect(truncateString(null, 10)).toBe('')
    expect(truncateString(undefined, 10)).toBe('')
  })
})

describe('removeSQLInjectionPatterns', () => {
  it('should remove SQL comment patterns', () => {
    expect(removeSQLInjectionPatterns("test--comment")).not.toContain('--')
    expect(removeSQLInjectionPatterns("test/*comment*/")).not.toContain('/*')
  })

  it('should remove special characters', () => {
    expect(removeSQLInjectionPatterns("test'; DROP TABLE--")).not.toContain("'")
    expect(removeSQLInjectionPatterns("test'; DROP TABLE--")).not.toContain(';')
  })

  it('should handle null and undefined', () => {
    expect(removeSQLInjectionPatterns(null)).toBe('')
    expect(removeSQLInjectionPatterns(undefined)).toBe('')
  })
})

