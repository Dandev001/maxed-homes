// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Route paths
export const ROUTES = {
  HOME: '/',
  PROPERTIES: '/properties',
  PROPERTY_DETAIL: '/properties/:id',
  SEARCH: '/search',
  ABOUT: '/about',
  CONTACT: '/contact',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
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