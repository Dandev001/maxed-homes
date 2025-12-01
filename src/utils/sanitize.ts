/**
 * Input Sanitization Utilities
 * 
 * Provides functions to sanitize user inputs to prevent XSS attacks,
 * SQL injection (though Supabase handles this), and other security issues.
 */

/**
 * Sanitizes a string by removing potentially dangerous HTML/script tags
 * and encoding special characters
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input) return '';
  
  // Convert to string if not already
  const str = String(input);
  
  // Remove null bytes
  let sanitized = str.replace(/\0/g, '');
  
  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove other potentially dangerous tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  sanitized = sanitized.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Sanitizes HTML content while preserving safe HTML tags
 * Use this for rich text content that needs to preserve formatting
 */
export function sanitizeHTML(input: string | null | undefined): string {
  if (!input) return '';
  
  const str = String(input);
  
  // Remove null bytes
  let sanitized = str.replace(/\0/g, '');
  
  // Remove script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  return sanitized;
}

/**
 * Sanitizes an email address
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return '';
  
  const sanitized = String(email)
    .toLowerCase()
    .trim()
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[<>]/g, ''); // Remove angle brackets
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  
  return sanitized;
}

/**
 * Sanitizes a phone number
 */
export function sanitizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  
  // Remove all non-digit characters except + at the start
  let sanitized = String(phone).trim();
  
  // Keep + at the start if present
  const hasPlus = sanitized.startsWith('+');
  sanitized = sanitized.replace(/\D/g, '');
  
  if (hasPlus) {
    sanitized = '+' + sanitized;
  }
  
  return sanitized;
}

/**
 * Sanitizes a URL
 */
export function sanitizeURL(url: string | null | undefined): string {
  if (!url) return '';
  
  const sanitized = String(url).trim().replace(/\0/g, '');
  
  // Only allow http, https, and mailto protocols
  const allowedProtocols = /^(https?|mailto):/i;
  if (!allowedProtocols.test(sanitized)) {
    throw new Error('Invalid URL protocol. Only http, https, and mailto are allowed.');
  }
  
  // Remove javascript: protocol attempts
  if (sanitized.toLowerCase().includes('javascript:')) {
    throw new Error('Invalid URL: javascript protocol not allowed');
  }
  
  return sanitized;
}

/**
 * Sanitizes a number input
 */
export function sanitizeNumber(
  input: string | number | null | undefined,
  min?: number,
  max?: number
): number {
  if (input === null || input === undefined || input === '') {
    throw new Error('Number is required');
  }
  
  const num = typeof input === 'number' ? input : parseFloat(String(input));
  
  if (isNaN(num)) {
    throw new Error('Invalid number format');
  }
  
  if (min !== undefined && num < min) {
    throw new Error(`Number must be at least ${min}`);
  }
  
  if (max !== undefined && num > max) {
    throw new Error(`Number must be at most ${max}`);
  }
  
  return num;
}

/**
 * Sanitizes an integer input
 */
export function sanitizeInteger(
  input: string | number | null | undefined,
  min?: number,
  max?: number
): number {
  const num = sanitizeNumber(input, min, max);
  
  if (!Number.isInteger(num)) {
    throw new Error('Value must be an integer');
  }
  
  return num;
}

/**
 * Sanitizes a date string
 */
export function sanitizeDate(date: string | null | undefined): string {
  if (!date) return '';
  
  const sanitized = String(date).trim().replace(/\0/g, '');
  
  // Validate ISO date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
  if (!dateRegex.test(sanitized)) {
    throw new Error('Invalid date format. Expected ISO 8601 format.');
  }
  
  // Validate that it's a valid date
  const dateObj = new Date(sanitized);
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date value');
  }
  
  return sanitized;
}

/**
 * Sanitizes an object by sanitizing all string values
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  fieldsToSanitize?: (keyof T)[]
): T {
  const sanitized = { ...obj };
  
  const fields = fieldsToSanitize || Object.keys(sanitized);
  
  for (const key of fields) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key]) as T[keyof T];
    }
  }
  
  return sanitized;
}

/**
 * Truncates a string to a maximum length
 */
export function truncateString(input: string, maxLength: number): string {
  if (!input || input.length <= maxLength) return input || '';
  return input.substring(0, maxLength - 3) + '...';
}

/**
 * Removes SQL injection patterns (defense in depth - Supabase already handles this)
 * Note: This is a basic client-side check. Supabase uses parameterized queries which
 * provide the real protection against SQL injection.
 */
export function removeSQLInjectionPatterns(input: string): string {
  if (!input) return '';
  
  // Use character class to match SQL injection characters
  // Escape special regex characters properly
  return String(input)
    .replace(/[';\\+\|&%$@!^()[\]{}>=<?*~`]/g, '')
    .replace(/--/g, '') // SQL comment
    .replace(/\/\*/g, '') // SQL comment start
    .replace(/\*\//g, ''); // SQL comment end
}

