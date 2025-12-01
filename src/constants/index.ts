import { env, isEnvConfigured } from '../lib/env'

// API Configuration
// Uses validated environment variable with fallback
// Lazy access to prevent errors during module load
export function getApiBaseUrl(): string {
  if (isEnvConfigured()) {
    return env.apiBaseUrl;
  }
  return 'http://localhost:3000/api'; // fallback
}

// For backward compatibility, but this will throw if env not configured
// Use getApiBaseUrl() instead if you need safe access
export const API_BASE_URL = (() => {
  try {
    return isEnvConfigured() ? env.apiBaseUrl : 'http://localhost:3000/api';
  } catch {
    return 'http://localhost:3000/api';
  }
})();

// Route paths
export const ROUTES = {
  HOME: '/',
  PROPERTIES: '/properties',
  PROPERTY_DETAIL: '/properties/:id',
  BOOKING: '/booking/:id',
  BOOKING_CONFIRMATION: '/booking-confirmation/:id',
  SEARCH: '/search',
  ABOUT: '/about',
  CONTACT: '/contact',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  FAVORITES: '/favorites',
  ADMIN_DASHBOARD: '/admin',
} as const;

// App Configuration
export const APP_CONFIG = {
  NAME: 'MAXED HOMES',
  DESCRIPTION: 'Find your perfect home',
  VERSION: '1.0.0',
} as const;

// UI Constants
export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px',
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 100;

// Property Types
export const PROPERTY_TYPES = [
  'House',
  'Apartment',
  'Condo',
  'Townhouse',
  'Villa',
  'Studio',
] as const;