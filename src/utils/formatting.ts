/**
 * Utility functions for formatting data in the application
 */

// Currency formatting
export const formatCurrency = (amount: number, currency: string = 'XOF'): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Number formatting with commas
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

// Date formatting
export const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(dateObj);
};

// Relative time formatting (e.g., "2 days ago")
export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

// Format property type for display
export const formatPropertyType = (type: string): string => {
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

// Format area in square feet
export const formatArea = (sqft: number): string => {
  if (sqft >= 1000) {
    return `${(sqft / 1000).toFixed(1)}k sq ft`;
  }
  return `${sqft.toLocaleString()} sq ft`;
};

// Format guest count
export const formatGuestCount = (count: number): string => {
  if (count === 1) return '1 guest';
  return `${count} guests`;
};

// Format bedroom/bathroom count
export const formatRoomCount = (count: number, type: 'bedroom' | 'bathroom'): string => {
  if (count === 1) return `1 ${type}`;
  return `${count} ${type}s`;
};

// Format price range
export const formatPriceRange = (min: number, max: number, currency: string = 'XOF'): string => {
  if (min === max) return formatCurrency(min, currency);
  return `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)}`;
};

// Format rating with stars
export const formatRating = (rating: number, maxRating: number = 5): string => {
  return `${rating.toFixed(1)}/${maxRating}`;
};

// Format phone number
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format duration (for bookings, etc.)
export const formatDuration = (startDate: Date | string, endDate: Date | string): string => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 night';
  return `${diffDays} nights`;
};
