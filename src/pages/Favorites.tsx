import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, User, LogOut, Calendar, Settings, Plus, ArrowLeft, Home, Search, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useGuestByEmail, useGetOrCreateGuest } from '../hooks/useGuests';
import { useGuestFavorites, useToggleFavorite } from '../hooks/useFavorites';
import PropertyCard from '../components/ui/PropertyCard';
import { ROUTES } from '../constants';
import type { PropertyWithImages } from '../types/database';
import type { Property } from '../types';

// Adapter function to convert PropertyWithImages to Property format
const adaptPropertyForCard = (propertyWithImages: PropertyWithImages): Property => {
  return {
    id: propertyWithImages.id,
    title: propertyWithImages.title,
    description: propertyWithImages.description || '',
    propertyType: propertyWithImages.property_type as 'house' | 'apartment' | 'condo' | 'townhouse' | 'villa' | 'studio',
    host: propertyWithImages.host ? {
      id: propertyWithImages.host.id,
      name: `${propertyWithImages.host.first_name} ${propertyWithImages.host.last_name}`,
      type: 'individual',
      joinDate: propertyWithImages.host.created_at,
      responseTime: 'within an hour',
      responseRate: 100,
      profileImage: propertyWithImages.host.profile_image_url || '',
      languages: ['English'],
      verifications: propertyWithImages.host.is_verified ? ['Email', 'Phone'] : ['Email'],
    } : {
      id: '',
      name: 'Host',
      type: 'individual',
      joinDate: new Date().toISOString(),
      responseTime: 'within an hour',
      responseRate: 100,
      profileImage: '',
      languages: ['English'],
      verifications: ['Email'],
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
    minimumNights: propertyWithImages.minimum_nights,
    maximumNights: propertyWithImages.maximum_nights || 30,
    status: propertyWithImages.status as 'active' | 'inactive' | 'maintenance' | 'sold',
    isFeatured: propertyWithImages.is_featured,
    images: (propertyWithImages.images || []).map(img => ({
      id: img.id,
      url: img.image_url,
      altText: img.alt_text || propertyWithImages.title,
      caption: img.caption || '',
      displayOrder: img.display_order,
      isPrimary: img.is_primary,
      createdAt: new Date(img.created_at),
    })),
    rating: 4.5,
    reviewCount: 0,
    hostId: propertyWithImages.host?.id || '',
    createdAt: new Date(propertyWithImages.created_at),
    updatedAt: new Date(propertyWithImages.updated_at),
  };
};

const Favorites = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { guest, loading: guestLoading, refetch: refetchGuest } = useGuestByEmail(user?.email || '');
  const { getOrCreateGuest, loading: guestCreateLoading } = useGetOrCreateGuest();
  const { favorites, loading: favoritesLoading, refetch: refetchFavorites } = useGuestFavorites(guest?.id || null);
  const { toggleFavorite, loading: toggleLoading } = useToggleFavorite();
  const { success: showSuccess, error: showError } = useToast();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileDropdownRef = useRef<HTMLDivElement>(null);

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

  const handleSignOut = async () => {
    await signOut();
    setIsProfileDropdownOpen(false);
    navigate(ROUTES.HOME);
  };

  const handleFavoriteToggle = async (propertyId: string) => {
    if (!user) {
      showError('Please log in to manage favorites');
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
    } catch (error) {
      showError('Failed to update favorite. Please try again.');
    }
  };

  const handlePropertyClick = (propertyId: string) => {
    navigate(ROUTES.PROPERTY_DETAIL.replace(':id', propertyId));
  };

  // Show loading while auth is loading
  if (authLoading || guestLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If not logged in, show message
  if (!user || !guest) {
    const handleBackClick = () => {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(ROUTES.PROPERTIES);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Button Navbar */}
        <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-100/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <button
                  onClick={handleBackClick}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  <span className="hidden sm:inline">Back</span>
                </button>
                <div className="h-6 w-px bg-gray-200"></div>
                <Link
                  to={ROUTES.HOME}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Home</span>
                </Link>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigate(ROUTES.LOGIN)}
                  className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100/50 rounded-lg transition-all"
                >
                  Log In
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 sm:p-16 text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2 tracking-tight">Your Favorites</h1>
            <p className="text-sm sm:text-base text-gray-500 mb-6 font-normal max-w-md mx-auto">
              Please log in to view and manage your favorite properties.
            </p>
            <button
              onClick={() => navigate(ROUTES.LOGIN)}
              className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all text-sm sm:text-base font-medium shadow-sm hover:shadow-md"
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isLoading = favoritesLoading || toggleLoading;

  const handleBackClick = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(ROUTES.PROPERTIES);
    }
  };

  // Filter favorites based on search
  const filteredFavorites = favorites.filter((favorite) => {
    if (!searchQuery) return true;
    const property = favorite.property as PropertyWithImages;
    const query = searchQuery.toLowerCase();
    return (
      property.title.toLowerCase().includes(query) ||
      property.city.toLowerCase().includes(query) ||
      property.state.toLowerCase().includes(query) ||
      property.address.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Button Navbar */}
      <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={handleBackClick}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="h-6 w-px bg-gray-200"></div>
              <Link
                to={ROUTES.HOME}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link
                to={ROUTES.PROPERTIES}
                className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100/50 rounded-lg transition-all"
              >
                <span className="hidden sm:inline">Properties</span>
                <span className="sm:hidden">Browse</span>
              </Link>
              <Link
                to={ROUTES.PROFILE}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100/50 rounded-lg transition-all"
                aria-label="Profile"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 pb-20 md:pb-10">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 fill-red-500" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 tracking-tight">My Favorites</h1>
          </div>
          <p className="text-sm sm:text-base text-gray-500 font-normal">
            {favorites.length === 0
              ? 'Properties you save will appear here'
              : `${favorites.length} ${favorites.length === 1 ? 'property' : 'properties'} saved`}
          </p>
        </div>

        {/* Search Bar - Only show if there are favorites */}
        {!isLoading && favorites.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 mb-6 sm:mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search your favorites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm sm:text-base placeholder:text-gray-400"
              />
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && favorites.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
                <div className="h-48 sm:h-64 bg-gray-200"></div>
                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && favorites.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 sm:p-16 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No favorites yet</h2>
            <p className="text-sm sm:text-base text-gray-500 mb-6 font-normal max-w-md mx-auto">
              Start exploring properties and save your favorites to view them here.
            </p>
            <button
              onClick={() => navigate(ROUTES.PROPERTIES)}
              className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all text-sm sm:text-base font-medium shadow-sm hover:shadow-md"
            >
              Browse Properties
            </button>
          </div>
        )}

        {/* No Search Results */}
        {!isLoading && favorites.length > 0 && filteredFavorites.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 sm:p-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No results found</h2>
            <p className="text-sm sm:text-base text-gray-500 mb-6 font-normal max-w-md mx-auto">
              Try adjusting your search to find what you're looking for.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all text-sm sm:text-base font-medium shadow-sm hover:shadow-md"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Favorites Grid */}
        {!isLoading && filteredFavorites.length > 0 && (
          <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredFavorites.map((favorite) => {
              const property = favorite.property as PropertyWithImages;
              return (
                <div key={favorite.id}>
                  <PropertyCard
                    property={adaptPropertyForCard(property)}
                    onViewDetails={handlePropertyClick}
                    onFavorite={handleFavoriteToggle}
                    isFavorite={true}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
