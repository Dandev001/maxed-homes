import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// Framer Motion removed from main component for performance
import { Search, Filter, MapPin, ChevronRight, Home, Mountain, Waves, Bed, Snowflake, Castle, User, LogOut, Calendar, X, Settings, Heart } from 'lucide-react';
import PropertyCard from '../components/ui/PropertyCard';
import PropertyMap from '../components/ui/PropertyMap';
import FilterModal from '../components/ui/FilterModal';
import type { PropertyFilters, PropertyWithImages } from '../types/database';
import type { Property } from '../types';
import { ROUTES } from '../constants';
import { usePropertySearch } from '../hooks/useProperties';
import { useAuth } from '../contexts/AuthContext';
import { useGuestByEmail, useGetOrCreateGuest } from '../hooks/useGuests';
import { useFavoritePropertyIds, useToggleFavorite } from '../hooks/useFavorites';
import { useToast } from '../contexts/ToastContext';
import SEO from '../components/SEO';

// Adapter function to convert PropertyWithImages to Property format
const adaptPropertyForCard = (propertyWithImages: PropertyWithImages): Property => {
  // Ensure images array exists and filter out any images with null/undefined URLs
  const validImages = (propertyWithImages.images || [])
    .filter(img => img && img.image_url) // Filter out null/undefined images or URLs
    .map(img => ({
      id: img.id,
      url: img.image_url,
      altText: img.alt_text || propertyWithImages.title, // Use property title as fallback
      caption: img.caption || '', // Empty string instead of undefined
      displayOrder: img.display_order || 0,
      isPrimary: img.is_primary || false,
      createdAt: new Date(img.created_at),
    }))
    .sort((a, b) => {
      // Sort by isPrimary first, then by displayOrder
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return a.displayOrder - b.displayOrder;
    });

  // Map property_type to valid PropertyType (fallback to 'house' if not in allowed types)
  const propertyTypeMap: Record<string, 'villa' | 'apartment' | 'house' | 'condo'> = {
    'house': 'house',
    'apartment': 'apartment',
    'condo': 'condo',
    'villa': 'villa',
    'townhouse': 'house', // Map townhouse to house
    'studio': 'apartment', // Map studio to apartment
  };
  const propertyType = propertyTypeMap[propertyWithImages.property_type] || 'house';

  return {
    id: propertyWithImages.id,
    title: propertyWithImages.title,
    description: propertyWithImages.description || '',
    propertyType,
    host: {
      id: propertyWithImages.host?.id || '',
      name: propertyWithImages.host?.first_name && propertyWithImages.host?.last_name 
        ? `${propertyWithImages.host.first_name} ${propertyWithImages.host.last_name}`
        : propertyWithImages.host?.email?.split('@')[0] || 'Host',
      type: propertyWithImages.host?.company_name ? 'business' : 'individual',
      joinDate: propertyWithImages.host?.created_at || new Date().toISOString(),
      responseTime: 'Within an hour',
      responseRate: 100,
      profileImage: propertyWithImages.host?.profile_image_url || '',
      languages: ['English'],
      verifications: propertyWithImages.host?.is_verified ? ['Email'] : [],
    },
    propertyHighlights: [],
    bedrooms: propertyWithImages.bedrooms,
    bathrooms: propertyWithImages.bathrooms,
    maxGuests: propertyWithImages.max_guests,
    areaSqft: propertyWithImages.area_sqft || undefined,
    pricePerNight: propertyWithImages.price_per_night,
    cleaningFee: propertyWithImages.cleaning_fee,
    securityDeposit: propertyWithImages.security_deposit,
    address: propertyWithImages.address,
    city: propertyWithImages.city,
    state: propertyWithImages.state,
    zipCode: propertyWithImages.zip_code || undefined,
    country: propertyWithImages.country,
    coordinates: propertyWithImages.latitude && propertyWithImages.longitude ? {
      latitude: propertyWithImages.latitude,
      longitude: propertyWithImages.longitude,
    } : undefined,
    amenities: propertyWithImages.amenities.map((name, index) => ({ 
      id: `amenity-${index}`, 
      name, 
      category: 'basic' as const,
      icon: 'home' 
    })),
    houseRules: propertyWithImages.house_rules || '',
    cancellationPolicy: propertyWithImages.cancellation_policy || undefined,
    safetyProperty: propertyWithImages.safety_property || undefined,
    checkInTime: propertyWithImages.check_in_time,
    checkOutTime: propertyWithImages.check_out_time,
    minimumNights: propertyWithImages.minimum_nights || 1,
    maximumNights: propertyWithImages.maximum_nights || 365,
    status: propertyWithImages.status as 'active' | 'inactive' | 'maintenance' | 'sold',
    isFeatured: propertyWithImages.is_featured,
    images: validImages,
    rating: 0, // Default to 0 if not available
    reviewCount: 0, // Default to 0 if not available
    hostId: propertyWithImages.host?.id || propertyWithImages.host_id || '',
    createdAt: new Date(propertyWithImages.created_at),
    updatedAt: new Date(propertyWithImages.updated_at),
  };
};



// Categories Component
interface CategoriesProps {
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
}

const Categories: React.FC<CategoriesProps> = ({ selectedCategory, onCategorySelect }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const categories = [
    { id: 'farms', label: 'Farms', icon: Home, filter: { property_type: 'house', amenities: ['farm', 'rural'] } },
    { id: 'icons', label: 'Icons', icon: Home, filter: { is_featured: true } },
    { id: 'amazing-views', label: 'Amazing views', icon: Mountain, filter: { amenities: ['mountain', 'view', 'scenic'] } },
    { id: 'rooms', label: 'Rooms', icon: Bed, filter: { property_type: 'apartment' } },
    { id: 'amazing-pools', label: 'Amazing pools', icon: Waves, filter: { amenities: ['pool', 'swimming'] } },
    { id: 'arctic', label: 'Arctic', icon: Snowflake, filter: { amenities: ['arctic', 'cold', 'winter'] } },
    { id: 'cabins', label: 'Cabins', icon: Home, filter: { property_type: 'house', amenities: ['cabin', 'wood'] } },
    { id: 'beachfront', label: 'Beachfront', icon: Waves, filter: { amenities: ['beach', 'ocean', 'waterfront'] } },
    { id: 'historical-homes', label: 'Historical homes', icon: Castle, filter: { amenities: ['historical', 'heritage', 'vintage'] } },
    { id: 'desert', label: 'Desert', icon: Home, filter: { amenities: ['desert', 'arid', 'hot'] } },
  ];

  const checkScrollability = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  const scrollRight = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    checkScrollability();
    const container = scrollContainerRef.current;
    if (container) {
      // Throttle scroll events for better performance
      let timeoutId: NodeJS.Timeout;
      const throttledCheck = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(checkScrollability, 100);
      };
      
      container.addEventListener('scroll', throttledCheck, { passive: true });
      return () => {
        clearTimeout(timeoutId);
        container.removeEventListener('scroll', throttledCheck);
      };
    }
  }, [checkScrollability]);

  return (
    <div className="relative">
      <div 
        ref={scrollContainerRef}
        className="flex space-x-8 overflow-x-auto pb-2"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none'
        }}
      >
        {categories.map((category) => {
          const IconComponent = category.icon;
          const isSelected = selectedCategory === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => onCategorySelect(isSelected ? null : category.id)}
              className={`flex items-center space-x-2 min-w-fit px-3 py-2 rounded-2xl transition-colors ${
                isSelected ? 'bg-black text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <IconComponent className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium whitespace-nowrap ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                {category.label}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Scroll Arrow - Desktop only */}
      {canScrollRight && (
        <button
          onClick={scrollRight}
          className="hidden md:flex absolute right-0 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      )}
    </div>
  );
};

// Main Properties Page Component
const Properties: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { guest, refetch: refetchGuest } = useGuestByEmail(user?.email || '');
  const { getOrCreateGuest } = useGetOrCreateGuest();
  const { propertyIds: favoritePropertyIds, refetch: refetchFavorites } = useFavoritePropertyIds(guest?.id || null);
  const { toggleFavorite } = useToggleFavorite();
  const { success: showSuccess, error: showError } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithImages | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategories, setShowCategories] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search query to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to first page when search changes
    }, 500); // 500ms debounce delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Use real API call with search hook
  // Only fetch properties after auth has finished loading to avoid race conditions
  const searchParams = useMemo(() => ({
    query: debouncedSearchQuery.trim() || undefined,
    filters,
    page: currentPage,
    limit: 12,
    sort_by: 'created_at' as const,
    sort_order: 'desc' as const,
  }), [debouncedSearchQuery, filters, currentPage]);

  // Only enable search after auth is ready
  const { results, loading, error } = usePropertySearch(searchParams, !authLoading);

  // Debug: Log property images in development (remove after debugging)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && results?.data) {
      results.data.forEach((property) => {
        if (property.images && property.images.length > 0) {
          console.log(`Property ${property.id} (${property.title}) has ${property.images.length} images:`, property.images);
        } else {
          console.warn(`Property ${property.id} (${property.title}) has no images`);
        }
      });
    }
  }, [results?.data]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  const handleSignOut = async () => {
    await signOut();
    setIsProfileDropdownOpen(false);
    navigate(ROUTES.HOME);
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Handle scroll for categories visibility (mobile only)
  useEffect(() => {
    const handleScroll = () => {
      // Only apply on mobile (screens smaller than 768px)
      if (window.innerWidth >= 768) {
        setShowCategories(true);
        return;
      }
      
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setShowCategories(false);
      } else {
        // Scrolling up
        setShowCategories(true);
      }
      setLastScrollY(currentScrollY);
    };

    const handleResize = () => {
      // Always show categories on desktop
      if (window.innerWidth >= 768) {
        setShowCategories(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Initial check
    handleResize();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [lastScrollY]);
  
  // Get paginated results from API
  const paginatedResults = results;

  // Handle property click
  const handlePropertyClick = (propertyId: string) => {
    // Navigate to property detail page
    navigate(ROUTES.PROPERTY_DETAIL.replace(':id', propertyId));
  };

  // Handle favorite toggle
  const handleFavoriteToggle = async (propertyId: string) => {
    if (!user) {
      showError('Please log in to save favorites');
      navigate(ROUTES.LOGIN);
      return;
    }

    try {
      // Ensure guest record exists
      let currentGuest = guest;
      if (!currentGuest && user.email) {
        // Extract name from user metadata or email
        const fullName = user.user_metadata?.full_name || user.email.split('@')[0];
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || '';

        currentGuest = await getOrCreateGuest({
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          status: 'active',
        });

        // Refresh guest data
        if (currentGuest) {
          await refetchGuest();
        }
      }

      if (!currentGuest?.id) {
        showError('Unable to create guest profile. Please try again.');
        return;
      }

      const result = await toggleFavorite(currentGuest.id, propertyId);
      await refetchFavorites();
      // Use the return value from toggleFavorite to determine the message
      if (result.isFavorited) {
        showSuccess('Added to favorites');
      } else {
        showSuccess('Removed from favorites');
      }
    } catch {
      showError('Failed to update favorite. Please try again.');
    }
  };

  // Handle property selection for map
  const handlePropertySelect = (property: PropertyWithImages) => {
    setSelectedProperty(property);
  };


  // Handle filters change
  const handleFiltersChange = (newFilters: PropertyFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle search input change
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setCurrentPage(1);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Handle category selection
  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1); // Reset to first page when category changes
    
    if (categoryId) {
      // Apply category-specific filters
      // Note: Some categories use amenities which need to match database values
      const categoryFilters: Record<string, Partial<PropertyFilters>> = {
        'farms': { property_type: 'house' },
        'icons': { is_featured: true },
        'amazing-views': { amenities: ['mountain', 'view', 'scenic'] },
        'rooms': { property_type: 'apartment' },
        'amazing-pools': { amenities: ['pool', 'swimming'] },
        'arctic': { amenities: ['arctic', 'cold', 'winter'] },
        'cabins': { property_type: 'house' },
        'beachfront': { amenities: ['beach', 'ocean', 'waterfront'] },
        'historical-homes': { amenities: ['historical', 'heritage', 'vintage'] },
        'desert': { amenities: ['desert', 'arid', 'hot'] },
      };
      
      const categoryFilter = categoryFilters[categoryId];
      if (categoryFilter) {
        setFilters(prev => ({ ...prev, ...categoryFilter }));
      }
    } else {
      // Clear category-specific filters
      setFilters(prev => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { property_type, is_featured, amenities, ...rest } = prev;
        return rest;
      });
    }
  };

  return (
    <>
      <SEO
        title="Browse Properties"
        description="Explore our curated collection of premium vacation rentals in Côte d'Ivoire. Find the perfect property for your stay - from luxury villas to cozy apartments."
        keywords="properties, vacation rentals, Côte d'Ivoire, Abidjan, browse listings, search properties, book accommodation"
        url="/properties"
      />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Section - Search and Controls */}
          <div className="py-6">
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
                    loading && debouncedSearchQuery ? 'text-blue-500' : 'text-gray-400'
                  }`} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search properties by location, type, amenities, or address..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        handleClearSearch();
                      }
                    }}
                    className={`w-full pl-10 pr-10 py-3 border rounded-2xl focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all ${
                      searchQuery && !debouncedSearchQuery ? 'border-[#1a1a1a]' : 'border-gray-300'
                    }`}
                  />
                  {loading && debouncedSearchQuery && (
                    <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
                      aria-label="Clear search"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-2">
               

                {/* Profile Icon - Only show if authenticated */}
                {authLoading ? (
                  <div className="w-10 h-10 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-[#1a1a1a]/80 rounded-full animate-spin"></div>
                  </div>
                ) : user ? (
                  <div className="relative" ref={profileDropdownRef}>
                    <button
                      onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                      className="flex items-center justify-center w-10 h-10 border border-gray-300 rounded-2xl hover:bg-gray-50 transition-colors"
                      title="Profile"
                    >
                      <div className="w-8 h-8 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white text-xs font-medium">
                        {getUserInitials()}
                      </div>
                    </button>

                    {/* Profile Dropdown */}
                    {isProfileDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
                        <div className="px-4 py-2 border-b border-gray-200">
                          <p className="text-sm font-medium text-gray-900">{getUserDisplayName()}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <Link
                          to={ROUTES.PROFILE}
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <User className="w-4 h-4 mr-2" />
                          My Profile
                        </Link>
                        <Link
                          to={ROUTES.DASHBOARD}
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Dashboard
                        </Link>
                        <Link
                          to={ROUTES.FAVORITES}
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Heart className="w-4 h-4 mr-2" />
                          Favorites
                        </Link>
                        <Link
                          to={ROUTES.SETTINGS}
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </Link>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Filter Button */}
                <button
                  onClick={() => setShowFilters(true)}
                  className="relative flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-2xl hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {Object.values(filters).some(value => 
                    value !== undefined && value !== '' && (Array.isArray(value) ? value.length > 0 : true)
                  ) && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                      {Object.values(filters).filter(value => 
                        value !== undefined && value !== '' && (Array.isArray(value) ? value.length > 0 : true)
                      ).length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Categories Section */}
          <div className={`transition-all duration-300 overflow-hidden ${showCategories ? 'pb-4 max-h-96 opacity-100' : 'pb-0 max-h-0 opacity-0 md:pb-4 md:max-h-96 md:opacity-100'}`}>
            <Categories
              selectedCategory={selectedCategory}
              onCategorySelect={handleCategorySelect}
            />
          </div>

          {/* Active Filters Summary */}
          {Object.values(filters).some(value => 
            value !== undefined && value !== '' && (Array.isArray(value) ? value.length > 0 : true)
          ) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              {filters.min_price && (
                <span className="px-2 py-1 bg-[#1a1a1a]/10 text-[#1a1a1a] text-xs rounded-full">
                  Min ${filters.min_price}
                </span>
              )}
              {filters.max_price && (
                <span className="px-2 py-1 bg-[#1a1a1a]/10 text-[#1a1a1a] text-xs rounded-full">
                  Max ${filters.max_price}
                </span>
              )}
              {filters.min_bedrooms && (
                <span className="px-2 py-1 bg-[#1a1a1a]/10 text-[#1a1a1a] text-xs rounded-full">
                  {filters.min_bedrooms}+ beds
                </span>
              )}
              {filters.min_bathrooms && (
                <span className="px-2 py-1 bg-[#1a1a1a]/10 text-[#1a1a1a] text-xs rounded-full">
                  {filters.min_bathrooms}+ baths
                </span>
              )}
              {filters.min_guests && (
                <span className="px-2 py-1 bg-[#1a1a1a]/10 text-[#1a1a1a] text-xs rounded-full">
                  {filters.min_guests}+ guests
                </span>
              )}
              <button
                onClick={() => {
                  setFilters({});
                  setSelectedCategory(null);
                }}
                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Error State */}
        {error && !paginatedResults && (
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading properties</h3>
            <p className="text-gray-600">{error}</p>
          </div>
        )}


        {/* Loading State - Only show skeleton if no previous results or auth is loading */}
        {(loading || authLoading) && !paginatedResults && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                <div className="h-64 bg-gray-200"></div>
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Properties Grid - Show previous results while loading, or new results when done */}
        {paginatedResults && (
          <>
            {paginatedResults.data && paginatedResults.data.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <MapPin className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
                <p className="text-gray-600 mb-4">
                  {debouncedSearchQuery 
                    ? `No properties match "${debouncedSearchQuery}". Try adjusting your search or filters.`
                    : 'Try adjusting your search criteria or filters to find more properties.'}
                </p>
                {(debouncedSearchQuery || Object.keys(filters).length > 0) && (
                  <button
                    onClick={() => {
                      handleClearSearch();
                      setFilters({});
                      setSelectedCategory(null);
                    }}
                    className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#1a1a1a]/80 transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="relative">
                {/* Loading overlay when loading with existing results */}
                {loading && paginatedResults && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <div className="w-5 h-5 border-2 border-[#1a1a1a]/80 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm">Updating results...</span>
                    </div>
                  </div>
                )}
                <div
                  className={`grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${loading && paginatedResults ? 'opacity-60' : ''}`}
                >
                    {paginatedResults.data && paginatedResults.data.map((property) => (
                    <div key={property.id}>
                        <PropertyCard
                          property={adaptPropertyForCard(property)}
                          onViewDetails={handlePropertyClick}
                          onFavorite={handleFavoriteToggle}
                          isFavorite={favoritePropertyIds.includes(property.id)}
                          className={selectedProperty?.id === property.id ? 'ring-2 ring-blue-500' : ''}
                        />
                    </div>
                    ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            {paginatedResults && paginatedResults.total_pages > 1 && (
              <div className="flex items-center justify-center mt-12 space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-2xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, paginatedResults.total_pages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-2xl transition-colors ${
                        currentPage === page
                          ? 'bg-[#1a1a1a] text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(paginatedResults.total_pages, prev + 1))}
                  disabled={currentPage === paginatedResults.total_pages}
                  className="px-4 py-2 border border-gray-300 rounded-2xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Map Button */}
      <button
        onClick={() => setShowMap(!showMap)}
        className={`fixed bottom-24 md:bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 z-50 ${
          showMap
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        <MapPin className="w-6 h-6" />
      </button>

      {/* Map Overlay */}
      {showMap && paginatedResults && paginatedResults.data && paginatedResults.data.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[70vh] relative">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Property Map</h3>
              <button
                onClick={() => setShowMap(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="h-full p-4">
              <PropertyMap
                properties={paginatedResults.data}
                selectedProperty={selectedProperty}
                onPropertySelect={handlePropertySelect}
                showToggle={false}
                height="100%"
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      <FilterModal
        filters={filters}
        onFiltersChange={handleFiltersChange}
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
      />
      </div>
    </>
  );
};

export default Properties;
