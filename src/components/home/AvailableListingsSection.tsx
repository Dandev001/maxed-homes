import { useNavigate } from 'react-router-dom';
import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import PropertyCard from '../ui/PropertyCard';
import { useFeaturedProperties } from '../../hooks/useProperties';
import type { PropertyWithImages } from '../../types/database';
import type { Property } from '../../types';
import { ROUTES } from '../../constants';

// Adapter function to convert PropertyWithImages to Property format
const adaptPropertyForCard = (propertyWithImages: PropertyWithImages): Property => {
  return {
    id: propertyWithImages.id,
    title: propertyWithImages.title,
    description: propertyWithImages.description || '',
    propertyType: (propertyWithImages.property_type === 'townhouse' ? 'house' : propertyWithImages.property_type) as 'house' | 'apartment' | 'condo' | 'villa',
    bedrooms: propertyWithImages.bedrooms,
    bathrooms: propertyWithImages.bathrooms,
    maxGuests: propertyWithImages.max_guests,
    areaSqft: propertyWithImages.area_sqft || 0,
    pricePerNight: propertyWithImages.price_per_night,
    cleaningFee: propertyWithImages.cleaning_fee,
    securityDeposit: propertyWithImages.security_deposit,
    address: propertyWithImages.address,
    city: propertyWithImages.city,
    state: propertyWithImages.state,
    zipCode: propertyWithImages.zip_code || '',
    country: propertyWithImages.country,
    coordinates: propertyWithImages.latitude && propertyWithImages.longitude ? {
      latitude: propertyWithImages.latitude,
      longitude: propertyWithImages.longitude,
    } : { latitude: 0, longitude: 0 },
    amenities: (propertyWithImages.amenities || []).map((name: string, index: number) => ({ 
      id: `amenity-${index}`, 
      name, 
      category: 'basic' as const,
      icon: 'home' 
    })),
    houseRules: propertyWithImages.house_rules || '',
    checkInTime: propertyWithImages.check_in_time,
    checkOutTime: propertyWithImages.check_out_time,
    minimumNights: propertyWithImages.minimum_nights,
    maximumNights: propertyWithImages.maximum_nights || 0,
    status: propertyWithImages.status,
    isFeatured: propertyWithImages.is_featured,
    images: (propertyWithImages.images || []).map((img) => ({
      id: img.id,
      url: img.image_url,
      altText: img.alt_text || '',
      caption: img.caption || '',
      displayOrder: img.display_order,
      isPrimary: img.is_primary,
      createdAt: new Date(img.created_at),
    })),
    rating: 0, // Will be calculated from reviews
    reviewCount: 0, // Will be calculated from reviews
    hostId: propertyWithImages.host_id || '',
    host: undefined, // Not needed for card display
    propertyHighlights: [],
    createdAt: new Date(propertyWithImages.created_at),
    updatedAt: new Date(propertyWithImages.updated_at),
  };
};

const AvailableListingsSection = () => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  
  // Fetch featured properties
  const { properties, loading, error } = useFeaturedProperties(6);
  
  // Adapt properties for display
  const adaptedProperties = properties.map(adaptPropertyForCard);

  // Entrance animations
  useEffect(() => {
    const section = sectionRef.current;
    const title = titleRef.current;
    const grid = gridRef.current;

    if (!section || !title || !grid) return;

    // Initial setup - set elements to invisible
    gsap.set([title, grid], { opacity: 0, y: 30 });

    // Create entrance timeline
    const entranceTl = gsap.timeline({ delay: 0.2 });
    
    entranceTl
      .to(title, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out"
      })
      .to(grid, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.1
      }, "-=0.4");
  }, [properties]);

  const handlePropertyClick = (propertyId: string) => {
    navigate(ROUTES.PROPERTY_DETAIL.replace(':id', propertyId));
  };

  return (
    <section ref={sectionRef} className="relative z-10 py-16 sm:py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div ref={titleRef} className="text-center mb-12 lg:mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl text-[#1a1a1a] font-light mb-4">
            Available Listings
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Discover our handpicked selection of premium properties, each offering a unique experience
          </p>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="bg-gray-200 rounded-2xl h-[400px] animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Error loading properties: {error}</p>
            <p className="text-gray-600">Please try again later.</p>
          </div>
        ) : adaptedProperties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No featured properties available at the moment.</p>
          </div>
        ) : (
          <div
            ref={gridRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8"
          >
            {adaptedProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onViewDetails={handlePropertyClick}
                className="h-full"
              />
            ))}
          </div>
        )}

        {/* View All Button */}
        {!loading && !error && adaptedProperties.length > 0 && (
          <div className="text-center mt-12">
            <button
              onClick={() => navigate(ROUTES.PROPERTIES)}
              className="px-8 py-3 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#1a1a1a]/90 transition-colors font-medium text-lg"
            >
              View All Properties
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default AvailableListingsSection;
