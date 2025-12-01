import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { 
  Star, 
  Heart,
  Bed,
  Bath,
  Users
} from 'lucide-react';
import type { Property, PropertyImage } from '../../types';
import LazyImage from './LazyImage';
import { usePropertyFavoriteCount } from '../../hooks/useFavorites';
import { usePropertyRating } from '../../hooks/useReviews';

interface PropertyCardProps {
  property: Property;
  className?: string;
  onFavorite?: (propertyId: string) => void;
  onViewDetails?: (propertyId: string) => void;
  isFavorite?: boolean;
}

// Utility function for currency formatting
const formatCurrency = (amount: number, currency: string = 'XOF'): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Utility function to get primary image
const getPrimaryImage = (images: PropertyImage[], index: number = 0): string | null => {
  if (images.length === 0) return null;
  const primaryImage = images.find(img => img.isPrimary);
  const imageUrl = primaryImage?.url || images[index]?.url;
  return imageUrl || null;
};


const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  className = '',
  onFavorite,
  onViewDetails,
  isFavorite = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const { count: favoriteCount } = usePropertyFavoriteCount(property.id);
  const { rating: ratingStats } = usePropertyRating(property.id);
  
  const currentImageUrl = getPrimaryImage(property.images, 0);
  const showGuestFavorite = favoriteCount > 5;
  const averageRating = ratingStats.averageRating;

  // Subtle hover animations
  useEffect(() => {
    const card = cardRef.current;
    const image = imageRef.current;
    
    if (!card || !image) return;

    const handleMouseEnter = () => {
      gsap.to(card, {
        y: -2,
        duration: 0.2,
        ease: "ease-out"
      });
      gsap.to(image, {
        scale: 1.02,
        duration: 0.3,
        ease: "ease-out"
      });
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        y: 0,
        duration: 0.2,
        ease: "ease-out"
      });
      gsap.to(image, {
        scale: 1,
        duration: 0.3,
        ease: "ease-out"
      });
    };

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <motion.div
      ref={cardRef}
      className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={() => onViewDetails?.(property.id)}
    >
      {/* Image Container */}
      <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden rounded-2xl sm:rounded-3xl">
        <div ref={imageRef} className="w-full h-full">
          <LazyImage
            src={currentImageUrl}
            alt={property.title}
            placeholder="property"
            className="w-full h-full object-cover rounded-2xl sm:rounded-3xl"
            optimize
            optimizationOptions={{ quality: 80, format: 'webp' }}
          />
        </div>

        {/* Guest Favourite Badge - Only show if favorited more than 5 times */}
        {showGuestFavorite && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 py-1 bg-white rounded-md text-[10px] sm:text-xs font-medium text-gray-800 shadow-sm">
            🏆 Guest favourite
          </div>
        )}

        {/* Heart button */}
        {onFavorite && (
          <button
            className="absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-sm flex items-center justify-center hover:bg-white transition-all duration-200 z-10"
            onClick={(e) => {
              e.stopPropagation();
              onFavorite(property.id);
            }}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart 
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors duration-200 ${
                isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
              }`} 
            />
          </button>
        )}

      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-2.5 bg-white">
        {/* Location and Rating */}
        <div className="flex items-center justify-between gap-2">
          <div className="font-semibold text-sm sm:text-base text-gray-900 truncate flex-1 min-w-0">
            {property.city}, {property.state}
          </div>
          {/* Show rating if property has reviews with rating */}
          {averageRating > 0 && (
            <div className="flex items-center space-x-1 flex-shrink-0">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                {averageRating.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Bedrooms, Bathrooms, and Max Guests */}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 text-xs sm:text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Bed className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="whitespace-nowrap">{property.bedrooms} {property.bedrooms === 1 ? 'bed' : 'beds'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Bath className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="whitespace-nowrap">{property.bathrooms} {property.bathrooms === 1 ? 'bath' : 'baths'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="whitespace-nowrap">{property.maxGuests} {property.maxGuests === 1 ? 'guest' : 'guests'}</span>
          </div>
        </div>

        {/* Price */}
        <div className="text-xs sm:text-sm font-semibold text-gray-900 pt-1">
          {formatCurrency(property.pricePerNight * 5)} <span className="text-gray-600 font-normal">for 5 nights</span>
        </div>
      </div>
    </motion.div>
  );
};

export default PropertyCard;
