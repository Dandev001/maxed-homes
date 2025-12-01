export type PropertyType = 'villa' | 'apartment' | 'house' | 'condo';

export interface PropertyHighlight {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

// Re-export PropertyFilters from database.ts
export { PropertyFilters } from './database';

// Re-export BookingPricing from pricing utility
export type { BookingPricing, BookingPricingInput } from '../lib/utils/pricing';

export interface Property {
  id: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  host: {
    id: string;
    name: string;
    type: string;
    joinDate: string;
    responseTime: string;
    responseRate: number;
    profileImage: string;
    languages: string[];
    verifications: string[];
  };
  propertyHighlights: PropertyHighlight[];
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  areaSqft?: number;
  pricePerNight: number;
  cleaningFee: number;
  securityDeposit: number;
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  amenities: Array<{
    id: string;
    name: string;
    category: string;
    icon?: string;
  }>;
  houseRules: string;
  cancellationPolicy?: string;
  safetyProperty?: string;
  checkInTime: string;
  checkOutTime: string;
  minimumNights: number;
  maximumNights: number;
  status: string;
  isFeatured: boolean;
  images: Array<{
    id: string;
    url: string;
    altText: string;
    caption: string;
    displayOrder: number;
    isPrimary: boolean;
    createdAt: Date;
  }>;
  rating: number;
  reviewCount: number;
  hostId: string;
  createdAt: Date;
  updatedAt: Date;
}