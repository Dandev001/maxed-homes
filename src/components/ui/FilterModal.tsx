import { useState, useEffect, useRef } from 'react';
import type { PropertyFilters } from '../../types/database';

// Filter Modal Component
interface FilterModalProps {
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
  isOpen: boolean;
  onClose: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  filters,
  onFiltersChange,
  isOpen,
  onClose,
}) => {
  const [localFilters, setLocalFilters] = useState<PropertyFilters>(filters);
  const [activeTab, setActiveTab] = useState<'price' | 'rooms' | 'type' | 'amenities' | 'booking'>('price');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Prevent body scroll when modal is open and handle escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      // Focus the modal when it opens
      if (modalRef.current) {
        modalRef.current.focus();
      }
      
      // Handle escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEscape);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, onClose]);

  const handleFilterChange = (key: keyof PropertyFilters, value: string | number | boolean | string[] | undefined) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleCancel = () => {
    // Reset local filters to match current filters when canceling
    setLocalFilters(filters);
    onClose();
  };

  const clearFilters = () => {
    const clearedFilters: PropertyFilters = {
      min_price: undefined,
      max_price: undefined,
      min_bedrooms: undefined,
      min_bathrooms: undefined,
      min_guests: undefined,
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(localFilters).some(value => 
    value !== undefined && value !== '' && (Array.isArray(value) ? value.length > 0 : true)
  );

  const getActiveFiltersCount = () => {
    return Object.values(localFilters).filter(value => 
      value !== undefined && value !== '' && (Array.isArray(value) ? value.length > 0 : true)
    ).length;
  };

  const tabs = [
    { id: 'price', label: 'Price', icon: '$' },
    { id: 'rooms', label: 'Rooms and beds', icon: '🛏️' },
  ] as const;

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Container with Backdrop */}
      <div 
        className="fixed inset-0 z-50 overflow-y-auto"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 transition-opacity" />
        
        {/* Modal Content Container */}
        <div className="flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-8">
          <div 
            ref={modalRef}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-hidden transform transition-all scale-100 opacity-100 outline-none"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-modal-title"
            tabIndex={-1}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <h2 id="filter-modal-title" className="text-lg sm:text-xl font-semibold text-gray-900">Filter</h2>
              </div>
              {hasActiveFilters && (
                <span className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                  {getActiveFiltersCount()} filter{getActiveFiltersCount() !== 1 ? 's' : ''} applied
                </span>
              )}
            </div>

            <div className="flex flex-col md:flex-row h-[60vh] sm:h-[70vh] md:h-[500px]">
              {/* Mobile Tab Navigation (Top) */}
              <div className="block md:hidden border-b border-gray-200 p-2 overflow-x-auto">
                <div className="flex space-x-1 min-w-max">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'bg-gray-100 text-gray-900 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-sm">{tab.icon}</span>
                      <span className="text-xs">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop Sidebar Navigation */}
              <div className="hidden md:block w-1/3 border-r border-gray-200 p-4">
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-gray-100 text-gray-900 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg">{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Content Area */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                {/* Price Tab */}
                {activeTab === 'price' && (
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-4">Price range</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">Nightly prices before fees and taxes</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Minimum</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                            <input
                              type="number"
                              inputMode="numeric"
                              placeholder="0"
                              value={localFilters.min_price || ''}
                              onChange={(e) => handleFilterChange('min_price', e.target.value ? Number(e.target.value) : undefined)}
                              className="w-full pl-8 pr-3 py-2 sm:py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Maximum</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                            <input
                              type="number"
                              inputMode="numeric"
                              placeholder="1000+"
                              value={localFilters.max_price || ''}
                              onChange={(e) => handleFilterChange('max_price', e.target.value ? Number(e.target.value) : undefined)}
                              className="w-full pl-8 pr-3 py-2 sm:py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rooms and Beds Tab */}
                {activeTab === 'rooms' && (
                  <div className="space-y-6 sm:space-y-8">
                    {/* Bedrooms */}
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Bedrooms</h3>
                      <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                        {['Any', '1', '2', '3', '4', '5', '6', '7', '8+'].map((num) => {
                          const value = num === 'Any' ? undefined : (num === '8+' ? 8 : Number(num));
                          const isSelected = num === 'Any' 
                            ? !localFilters.min_bedrooms
                            : localFilters.min_bedrooms === value;
                          return (
                            <button
                              key={num}
                              onClick={() => handleFilterChange('min_bedrooms', value)}
                              className={`px-3 sm:px-6 py-2 sm:py-3 text-base border rounded-lg transition-colors ${
                                isSelected
                                  ? 'border-black bg-black text-white'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bathrooms */}
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Bathrooms</h3>
                      <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                        {['Any', '1', '2', '3', '4', '5', '6', '7', '8+'].map((num) => {
                          const value = num === 'Any' ? undefined : (num === '8+' ? 8 : Number(num));
                          const isSelected = num === 'Any' 
                            ? !localFilters.min_bathrooms
                            : localFilters.min_bathrooms === value;
                          return (
                            <button
                              key={num}
                              onClick={() => handleFilterChange('min_bathrooms', value)}
                              className={`px-3 sm:px-6 py-2 sm:py-3 text-base border rounded-lg transition-colors ${
                                isSelected
                                  ? 'border-black bg-black text-white'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Guests */}
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Guests</h3>
                      <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                        {['Any', '1', '2', '4', '6', '8', '10', '12+'].map((num) => {
                          const value = num === 'Any' ? undefined : (num === '12+' ? 12 : Number(num));
                          const isSelected = num === 'Any' 
                            ? !localFilters.min_guests
                            : localFilters.min_guests === value;
                          return (
                            <button
                              key={num}
                              onClick={() => handleFilterChange('min_guests', value)}
                              className={`px-3 sm:px-6 py-2 sm:py-3 text-base border rounded-lg transition-colors ${
                                isSelected
                                  ? 'border-black bg-black text-white'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 border-t border-gray-200 bg-gray-50 space-y-3 sm:space-y-0">
              <button
                onClick={clearFilters}
                className="text-sm font-medium text-gray-600 hover:text-gray-800 underline transition-colors"
              >
                Clear all
              </button>
              <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                <button
                  onClick={handleCancel}
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={applyFilters}
                  className="flex-1 sm:flex-none px-6 sm:px-8 py-2 sm:py-3 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {hasActiveFilters ? `Show ${getActiveFiltersCount()} filter${getActiveFiltersCount() !== 1 ? 's' : ''}` : 'Show all properties'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterModal;
