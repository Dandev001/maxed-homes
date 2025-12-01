import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropertyCard from './PropertyCard';
import type { PropertyFilters } from '../../types/database';
import { ChevronLeft, ChevronRight, Grid, List, Filter, X } from 'lucide-react';

// Loading skeleton component
const PropertyCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
    <div className="aspect-[4/3] bg-gray-200"></div>
    <div className="p-6">
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="flex items-center gap-4 mb-4">
        <div className="h-3 bg-gray-200 rounded w-16"></div>
        <div className="h-3 bg-gray-200 rounded w-16"></div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>
      <div className="flex justify-between items-center">
        <div className="h-6 bg-gray-200 rounded w-20"></div>
        <div className="h-8 bg-gray-200 rounded w-8"></div>
      </div>
    </div>
  </div>
);

// Empty state component
const EmptyState: React.FC<{ 
  title: string; 
  description: string; 
  action?: React.ReactNode;
}> = ({ title, description, action }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-16"
  >
    <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
    {action}
  </motion.div>
);

// Pagination component
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}> = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
      <div className="text-sm text-gray-600">
        Showing {startItem}-{endItem} of {totalItems} properties
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...'}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                page === currentPage
                  ? 'bg-blue-600 text-white'
                  : page === '...'
                  ? 'text-gray-400 cursor-default'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Filter summary component
const FilterSummary: React.FC<{
  filters: PropertyFilters;
  onClearFilters: () => void;
  resultCount: number;
}> = ({ filters, onClearFilters, resultCount }) => {
  const activeFilters = useMemo(() => {
    const active: string[] = [];
    
    if (filters.city) active.push(`City: ${filters.city}`);
    if (filters.state) active.push(`State: ${filters.state}`);
    if (filters.propertyType?.length) active.push(`Type: ${filters.propertyType.join(', ')}`);
    if (filters.bedrooms?.min || filters.bedrooms?.max) {
      const range = `${filters.bedrooms.min || 0}+ to ${filters.bedrooms.max || '∞'} bedrooms`;
      active.push(range);
    }
    if (filters.pricePerNight?.min || filters.pricePerNight?.max) {
      const range = `$${filters.pricePerNight.min || 0} - $${filters.pricePerNight.max || '∞'}`;
      active.push(range);
    }
    if (filters.amenities?.length) active.push(`${filters.amenities.length} amenities`);
    if (filters.isFeatured) active.push('Featured only');
    if (filters.minRating) active.push(`${filters.minRating}+ stars`);
    
    return active;
  }, [filters]);

  if (activeFilters.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">
            {resultCount} properties found with {activeFilters.length} filter{activeFilters.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          <X className="w-3 h-3" />
          Clear all
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {activeFilters.map((filter, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
          >
            {filter}
          </span>
        ))}
      </div>
    </motion.div>
  );
};

// Main PropertyGrid component props
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

export const PropertyGrid: React.FC<PropertyGridProps> = ({
  properties = [],
  loading = false,
  error,
  filters = {},
  onFiltersChange,
  onPropertyClick,
  onPropertyFavorite,
  favorites = new Set(),
  viewMode = 'grid',
  onViewModeChange,
  showFilters = true,
  showViewToggle = true,
  showPagination = true,
  itemsPerPage = 12,
  className = '',
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [localViewMode, setLocalViewMode] = useState<'grid' | 'list'>(viewMode);

  // Handle view mode changes
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setLocalViewMode(mode);
    onViewModeChange?.(mode);
  };

  // Handle filter clearing
  const handleClearFilters = () => {
    onFiltersChange?.({});
  };

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of grid when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Calculate pagination
  const totalItems = properties.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProperties = properties.slice(startIndex, endIndex);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  // Render loading state
  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {showFilters && (
          <div className="flex items-center justify-between">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            {showViewToggle && (
              <div className="flex gap-2">
                <div className="h-10 bg-gray-200 rounded w-10 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-10 animate-pulse"></div>
              </div>
            )}
          </div>
        )}
        
        <div className={`grid gap-6 ${
          localViewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {Array.from({ length: itemsPerPage }).map((_, index) => (
            <PropertyCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={className}>
        <EmptyState
          title="Something went wrong"
          description="We couldn't load the properties. Please try again later."
          action={
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          }
        />
      </div>
    );
  }

  // Render empty state
  if (properties.length === 0) {
    const hasActiveFilters = Object.keys(filters).length > 0;
    
    return (
      <div className={className}>
        <EmptyState
          title={hasActiveFilters ? "No properties found" : "No properties available"}
          description={
            hasActiveFilters
              ? "Try adjusting your filters to see more properties."
              : "Check back later for new property listings."
          }
          action={
            hasActiveFilters ? (
              <button
                onClick={handleClearFilters}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with filters and view toggle */}
      {(showFilters || showViewToggle) && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showFilters && (
              <FilterSummary
                filters={filters}
                onClearFilters={handleClearFilters}
                resultCount={totalItems}
              />
            )}
          </div>
          
          {showViewToggle && (
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`p-2 rounded-md transition-colors ${
                  localViewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`p-2 rounded-md transition-colors ${
                  localViewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Properties Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`grid gap-6 ${
          localViewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}
      >
        <AnimatePresence mode="wait">
          {currentProperties.map((property) => (
            <motion.div
              key={property.id}
              variants={itemVariants}
              layout
              className={localViewMode === 'list' ? 'max-w-none' : ''}
            >
              <PropertyCard
                property={property}
                onFavorite={onPropertyFavorite}
                onViewDetails={onPropertyClick}
                isFavorite={favorites.has(property.id)}
                showAvailability={true}
                className={localViewMode === 'list' ? 'flex flex-row h-48' : 'h-full'}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
};

export default PropertyGrid;
