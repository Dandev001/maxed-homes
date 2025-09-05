// Common types used throughout the application
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  images: string[];
  featured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Component Props types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
} 