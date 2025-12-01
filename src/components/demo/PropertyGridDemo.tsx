import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PropertyGrid } from '../ui/PropertyGrid';
import { PropertyFilters, Property } from '../../types';
import { 
  Search, 
  MapPin, 
  Home, 
  DollarSign, 
  Star, 
  Filter,
  SlidersHorizontal,
  X
} from 'lucide-react';

// Sample property data for demonstration
const sampleProperties: Property[] = [
  {
    id: '1',
    title: 'Modern Downtown Loft with City Views',
    description: 'Stunning modern loft in the heart of downtown with panoramic city views and luxury amenities.',
    propertyType: 'loft',
    bedrooms: 2,
    bathrooms: 2,
    maxGuests: 4,
    areaSqft: 1200,
    pricePerNight: 250,
    cleaningFee: 75,
    securityDeposit: 500,
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
    coordinates: {
      latitude: 40.7589,
      longitude: -73.9851,
    },
    amenities: [
      { id: '1', name: 'wifi', category: 'basic' },
      { id: '2', name: 'parking', category: 'parking' },
      { id: '3', name: 'coffee', category: 'kitchen' },
      { id: '4', name: 'gym', category: 'entertainment' },
    ],
    houseRules: 'No smoking, no pets',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    minimumNights: 2,
    maximumNights: 30,
    status: 'active',
    isFeatured: true,
    images: [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        altText: 'Modern downtown loft',
        caption: 'Living room with city views',
        displayOrder: 1,
        isPrimary: true,
        createdAt: new Date(),
      },
    ],
    rating: 4.8,
    reviewCount: 127,
    hostId: 'host1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: 'Cozy Beach House with Ocean Access',
    description: 'Beautiful beachfront property with direct ocean access and stunning sunset views.',
    propertyType: 'house',
    bedrooms: 3,
    bathrooms: 2,
    maxGuests: 6,
    areaSqft: 1800,
    pricePerNight: 350,
    cleaningFee: 100,
    securityDeposit: 750,
    address: '456 Ocean Drive',
    city: 'Miami',
    state: 'FL',
    zipCode: '33139',
    country: 'USA',
    coordinates: {
      latitude: 25.7907,
      longitude: -80.1300,
    },
    amenities: [
      { id: '1', name: 'wifi', category: 'basic' },
      { id: '2', name: 'pool', category: 'outdoor' },
      { id: '3', name: 'beach_access', category: 'outdoor' },
      { id: '4', name: 'parking', category: 'parking' },
    ],
    houseRules: 'No smoking, pets allowed with fee',
    checkInTime: '16:00',
    checkOutTime: '10:00',
    minimumNights: 3,
    maximumNights: 14,
    status: 'active',
    isFeatured: true,
    images: [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1520637836862-4d197d17c93a?w=800',
        altText: 'Beach house exterior',
        caption: 'Oceanfront beach house',
        displayOrder: 1,
        isPrimary: true,
        createdAt: new Date(),
      },
    ],
    rating: 4.9,
    reviewCount: 89,
    hostId: 'host2',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    title: 'Luxury Mountain Cabin Retreat',
    description: 'Secluded mountain cabin with hot tub, fireplace, and breathtaking mountain views.',
    propertyType: 'cabin',
    bedrooms: 2,
    bathrooms: 1,
    maxGuests: 4,
    areaSqft: 900,
    pricePerNight: 180,
    cleaningFee: 60,
    securityDeposit: 400,
    address: '789 Mountain View Road',
    city: 'Aspen',
    state: 'CO',
    zipCode: '81611',
    country: 'USA',
    coordinates: {
      latitude: 39.1911,
      longitude: -106.8175,
    },
    amenities: [
      { id: '1', name: 'wifi', category: 'basic' },
      { id: '2', name: 'hot_tub', category: 'outdoor' },
      { id: '3', name: 'fireplace', category: 'basic' },
      { id: '4', name: 'parking', category: 'parking' },
    ],
    houseRules: 'No smoking, no pets, quiet hours 10pm-7am',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    minimumNights: 2,
    maximumNights: 7,
    status: 'active',
    isFeatured: false,
    images: [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
        altText: 'Mountain cabin exterior',
        caption: 'Cozy mountain retreat',
        displayOrder: 1,
        isPrimary: true,
        createdAt: new Date(),
      },
    ],
    rating: 4.7,
    reviewCount: 156,
    hostId: 'host3',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    title: 'Urban Apartment in Historic District',
    description: 'Charming apartment in a historic building with modern amenities and city access.',
    propertyType: 'apartment',
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    areaSqft: 650,
    pricePerNight: 120,
    cleaningFee: 40,
    securityDeposit: 300,
    address: '321 Historic Lane',
    city: 'Boston',
    state: 'MA',
    zipCode: '02108',
    country: 'USA',
    coordinates: {
      latitude: 42.3601,
      longitude: -71.0589,
    },
    amenities: [
      { id: '1', name: 'wifi', category: 'basic' },
      { id: '2', name: 'parking', category: 'parking' },
      { id: '3', name: 'coffee', category: 'kitchen' },
    ],
    houseRules: 'No smoking, no pets, no parties',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    minimumNights: 1,
    maximumNights: 30,
    status: 'active',
    isFeatured: false,
    images: [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        altText: 'Urban apartment interior',
        caption: 'Modern apartment living',
        displayOrder: 1,
        isPrimary: true,
        createdAt: new Date(),
      },
    ],
    rating: 4.5,
    reviewCount: 73,
    hostId: 'host4',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '5',
    title: 'Spacious Family Villa with Pool',
    description: 'Large family-friendly villa with private pool, garden, and multiple bedrooms.',
    propertyType: 'villa',
    bedrooms: 4,
    bathrooms: 3,
    maxGuests: 8,
    areaSqft: 2500,
    pricePerNight: 450,
    cleaningFee: 125,
    securityDeposit: 1000,
    address: '555 Villa Way',
    city: 'Orlando',
    state: 'FL',
    zipCode: '32836',
    country: 'USA',
    coordinates: {
      latitude: 28.5383,
      longitude: -81.3792,
    },
    amenities: [
      { id: '1', name: 'wifi', category: 'basic' },
      { id: '2', name: 'pool', category: 'outdoor' },
      { id: '3', name: 'parking', category: 'parking' },
      { id: '4', name: 'garden', category: 'outdoor' },
      { id: '5', name: 'gym', category: 'entertainment' },
    ],
    houseRules: 'No smoking, pets allowed with fee',
    checkInTime: '16:00',
    checkOutTime: '10:00',
    minimumNights: 3,
    maximumNights: 21,
    status: 'active',
    isFeatured: true,
    images: [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
        altText: 'Family villa exterior',
        caption: 'Spacious family villa',
        displayOrder: 1,
        isPrimary: true,
        createdAt: new Date(),
      },
    ],
    rating: 4.9,
    reviewCount: 234,
    hostId: 'host5',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '6',
    title: 'Charming Studio in Arts District',
    description: 'Cozy studio apartment in the vibrant arts district with local galleries and cafes.',
    propertyType: 'studio',
    bedrooms: 0,
    bathrooms: 1,
    maxGuests: 2,
    areaSqft: 400,
    pricePerNight: 85,
    cleaningFee: 30,
    securityDeposit: 200,
    address: '888 Arts Street',
    city: 'Portland',
    state: 'OR',
    zipCode: '97205',
    country: 'USA',
    coordinates: {
      latitude: 45.5152,
      longitude: -122.6784,
    },
    amenities: [
      { id: '1', name: 'wifi', category: 'basic' },
      { id: '2', name: 'coffee', category: 'kitchen' },
    ],
    houseRules: 'No smoking, no pets, quiet building',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    minimumNights: 1,
    maximumNights: 14,
    status: 'active',
    isFeatured: false,
    images: [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        altText: 'Studio apartment interior',
        caption: 'Cozy arts district studio',
        displayOrder: 1,
        isPrimary: true,
        createdAt: new Date(),
      },
    ],
    rating: 4.3,
    reviewCount: 45,
    hostId: 'host6',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Filter panel component
const FilterPanel: React.FC<{
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
  isOpen: boolean;
  onClose: () => void;
}> = ({ filters, onFiltersChange, isOpen, onClose }) => {
  const [localFilters, setLocalFilters] = useState<PropertyFilters>(filters);

  const handleFilterChange = (key: keyof PropertyFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleClearFilters = () => {
    const clearedFilters: PropertyFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -300 }}
      className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl z-50 overflow-y-auto"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <input
              type="text"
              placeholder="City, State"
              value={localFilters.city || ''}
              onChange={(e) => handleFilterChange('city', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Property Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Home className="w-4 h-4 inline mr-1" />
              Property Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['house', 'apartment', 'villa', 'cabin', 'loft', 'studio'].map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.propertyType?.includes(type as any) || false}
                    onChange={(e) => {
                      const currentTypes = localFilters.propertyType || [];
                      const newTypes = e.target.checked
                        ? [...currentTypes, type]
                        : currentTypes.filter(t => t !== type);
                      handleFilterChange('propertyType', newTypes.length > 0 ? newTypes : undefined);
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Price Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min price"
                value={localFilters.pricePerNight?.min || ''}
                onChange={(e) => {
                  const min = e.target.value ? Number(e.target.value) : undefined;
                  handleFilterChange('pricePerNight', {
                    ...localFilters.pricePerNight,
                    min,
                  });
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Max price"
                value={localFilters.pricePerNight?.max || ''}
                onChange={(e) => {
                  const max = e.target.value ? Number(e.target.value) : undefined;
                  handleFilterChange('pricePerNight', {
                    ...localFilters.pricePerNight,
                    max,
                  });
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Bedrooms Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bedrooms
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5].map((beds) => (
                <button
                  key={beds}
                  onClick={() => {
                    const currentMin = localFilters.bedrooms?.min;
                    const currentMax = localFilters.bedrooms?.max;
                    
                    if (currentMin === beds && currentMax === beds) {
                      // Deselect if already selected
                      handleFilterChange('bedrooms', undefined);
                    } else {
                      // Select this number of bedrooms
                      handleFilterChange('bedrooms', { min: beds, max: beds });
                    }
                  }}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    localFilters.bedrooms?.min === beds && localFilters.bedrooms?.max === beds
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {beds}+
                </button>
              ))}
            </div>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Star className="w-4 h-4 inline mr-1" />
              Minimum Rating
            </label>
            <select
              value={localFilters.minRating || ''}
              onChange={(e) => handleFilterChange('minRating', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Any rating</option>
              <option value="4">4+ stars</option>
              <option value="4.5">4.5+ stars</option>
              <option value="4.8">4.8+ stars</option>
            </select>
          </div>

          {/* Featured Filter */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localFilters.isFeatured || false}
                onChange={(e) => handleFilterChange('isFeatured', e.target.checked || undefined)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Featured properties only</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={handleClearFilters}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleApplyFilters}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const PropertyGridDemo: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Simulate loading
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setProperties(sampleProperties);
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Filter properties based on search query
  const filteredProperties = useMemo(() => {
    if (!searchQuery) return properties;
    
    return properties.filter(property =>
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [properties, searchQuery]);

  const handlePropertyClick = (propertyId: string) => {
    // Navigate to property details page
    // In a real app, use: navigate(`/properties/${propertyId}`)
  };

  const handlePropertyFavorite = (propertyId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(propertyId)) {
        newFavorites.delete(propertyId);
      } else {
        newFavorites.add(propertyId);
      }
      return newFavorites;
    });
  };

  const handleFiltersChange = (newFilters: PropertyFilters) => {
    setFilters(newFilters);
  };

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Property Grid Demo</h1>
              <p className="text-gray-600 mt-1">
                Explore our collection of {properties.length} properties with advanced filtering and search
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>
              
              {/* Filter Button */}
              <button
                onClick={() => setShowFilterPanel(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PropertyGrid
          properties={filteredProperties}
          loading={loading}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onPropertyClick={handlePropertyClick}
          onPropertyFavorite={handlePropertyFavorite}
          favorites={favorites}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          showFilters={true}
          showViewToggle={true}
          showPagination={true}
          itemsPerPage={8}
        />
      </div>

      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        onFiltersChange={handleFiltersChange}
        isOpen={showFilterPanel}
        onClose={() => setShowFilterPanel(false)}
      />

      {/* Overlay */}
      {showFilterPanel && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowFilterPanel(false)}
        />
      )}

      {/* Demo Information */}
      <div className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">PropertyGrid Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Filter className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Filtering</h3>
              <p className="text-gray-600">
                Filter properties by location, type, price, bedrooms, rating, and more with real-time updates.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Search</h3>
              <p className="text-gray-600">
                Search across property titles, descriptions, and locations with instant results.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Home className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Responsive Layout</h3>
              <p className="text-gray-600">
                Switch between grid and list views with responsive design that works on all devices.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading States</h3>
              <p className="text-gray-600">
                Beautiful loading skeletons and empty states provide smooth user experience.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pagination</h3>
              <p className="text-gray-600">
                Efficient pagination with customizable items per page and smooth navigation.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Interactive Features</h3>
              <p className="text-gray-600">
                Favorites, property details, and smooth animations enhance user engagement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyGridDemo;
