// PropertyGrid specific types and interfaces

import { Property } from './index';
import type { PropertyFilters } from './database';

// PropertyGrid component props
export interface PropertyGridProps {
  properties: Property[];
  loading?: boolean;
  error?: string;
  filters?: PropertyFilters;
  onFiltersChange?: (filters: PropertyFilters) => void;
  onPropertyClick?: (propertyId: string) => void;
  onPropertyFavorite?: (propertyId: string) => void;
  favorites?: Set<string>;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  showFilters?: boolean;
  showViewToggle?: boolean;
  showPagination?: boolean;
  itemsPerPage?: number;
  className?: string;
}

// Pagination component props
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

// Filter summary component props
export interface FilterSummaryProps {
  filters: PropertyFilters;
  onClearFilters: () => void;
  resultCount: number;
}

// Empty state component props
export interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

// PropertyGrid state management
export interface PropertyGridState {
  currentPage: number;
  viewMode: 'grid' | 'list';
  isLoading: boolean;
  error: string | null;
  properties: Property[];
  filters: PropertyFilters;
  favorites: Set<string>;
}

// PropertyGrid actions
export interface PropertyGridActions {
  setCurrentPage: (page: number) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setProperties: (properties: Property[]) => void;
  setFilters: (filters: PropertyFilters) => void;
  toggleFavorite: (propertyId: string) => void;
  clearFilters: () => void;
}

// PropertyGrid hook return type
export interface UsePropertyGridReturn {
  state: PropertyGridState;
  actions: PropertyGridActions;
  paginatedProperties: Property[];
  totalPages: number;
  hasActiveFilters: boolean;
}

// PropertyGrid configuration
export interface PropertyGridConfig {
  defaultItemsPerPage: number;
  maxItemsPerPage: number;
  defaultViewMode: 'grid' | 'list';
  enableInfiniteScroll: boolean;
  enableVirtualization: boolean;
  animationDuration: number;
  skeletonCount: number;
}

// PropertyGrid events
export interface PropertyGridEvents {
  onPropertyClick?: (property: Property) => void;
  onPropertyFavorite?: (property: Property, isFavorite: boolean) => void;
  onFiltersChange?: (filters: PropertyFilters) => void;
  onPageChange?: (page: number) => void;
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  onLoadMore?: () => void;
  onError?: (error: Error) => void;
}

// PropertyGrid performance metrics
export interface PropertyGridMetrics {
  renderTime: number;
  propertyCount: number;
  filterCount: number;
  pageLoadTime: number;
  imageLoadTime: number;
}

// PropertyGrid accessibility props
export interface PropertyGridA11yProps {
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  role?: string;
  tabIndex?: number;
}

// PropertyGrid responsive breakpoints
export interface PropertyGridBreakpoints {
  sm: number; // 640px
  md: number; // 768px
  lg: number; // 1024px
  xl: number; // 1280px
  '2xl': number; // 1536px
}

// PropertyGrid grid configuration
export interface PropertyGridGridConfig {
  columns: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
  };
  gap: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  aspectRatio: string;
}

// PropertyGrid animation configuration
export interface PropertyGridAnimationConfig {
  staggerDelay: number;
  itemDelay: number;
  duration: number;
  easing: string;
  enableHover: boolean;
  enableClick: boolean;
  enableScroll: boolean;
}

// PropertyGrid theme configuration
export interface PropertyGridThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    shadow: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

// PropertyGrid export types
export type PropertyGridViewMode = 'grid' | 'list';
export type PropertyGridSortBy = 'price' | 'createdAt' | 'title' | 'rating' | 'distance';
export type PropertyGridSortOrder = 'asc' | 'desc';
export type PropertyGridLoadingState = 'idle' | 'loading' | 'success' | 'error';
export type PropertyGridFilterType = 'location' | 'property' | 'price' | 'amenities' | 'rating';

// PropertyGrid utility types
export type PropertyGridEventHandler<T = any> = (data: T) => void;
export type PropertyGridAsyncHandler<T = any> = (data: T) => Promise<void>;
export type PropertyGridValidator<T = any> = (data: T) => boolean;
export type PropertyGridTransformer<T = any, R = any> = (data: T) => R;
