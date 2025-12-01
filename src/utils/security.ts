/**
 * Security Utilities
 * 
 * Provides security-related helper functions for the application
 */

/**
 * Validates that a UUID is in the correct format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates an email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a phone number (basic validation)
 */
export function isValidPhone(phone: string): boolean {
  // Allow international format: +1234567890 or local: (123) 456-7890 or 123-456-7890
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validates a URL
 */
export function isValidURL(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Checks if a string contains potentially dangerous content
 */
export function containsDangerousContent(input: string): boolean {
  if (!input) return false;
  
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /data:text\/html/i,
    /vbscript:/i,
  ];
  
  return dangerousPatterns.some(pattern => pattern.test(input));
}

/**
 * Generates a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Rate limiting helper (client-side check)
 * Note: Real rate limiting should be done server-side
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if a request is allowed
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(timestamp => now - timestamp < this.windowMs);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return true;
  }

  /**
   * Get time until next request is allowed (in milliseconds)
   */
  getTimeUntilNextAllowed(identifier: string): number {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    const recentRequests = requests.filter(timestamp => now - timestamp < this.windowMs);
    
    if (recentRequests.length < this.maxRequests) {
      return 0;
    }
    
    const oldestRequest = Math.min(...recentRequests);
    return this.windowMs - (now - oldestRequest);
  }

  /**
   * Clear rate limit for an identifier
   */
  clear(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.requests.clear();
  }
}

/**
 * Content Security Policy helper
 * Returns CSP header value
 */
export function getCSPHeader(): string {
  // In production, you might want to make this configurable
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for Vite in dev
    "style-src 'self' 'unsafe-inline'", // unsafe-inline needed for Tailwind
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ');

  return csp;
}

/**
 * Validates file type by extension
 */
export function isValidFileType(filename: string, allowedTypes: string[]): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (!extension) return false;
  return allowedTypes.includes(extension);
}

/**
 * Validates file size
 */
export function isValidFileSize(sizeInBytes: number, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return sizeInBytes <= maxSizeInBytes;
}

/**
 * Sanitizes a filename to prevent directory traversal
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars with underscore
    .replace(/\.\./g, '') // Remove directory traversal attempts
    .replace(/^\./, '') // Remove leading dot
    .substring(0, 255); // Limit length
}

