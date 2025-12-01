import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Users, CreditCard, Lock, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { ROUTES } from '../constants';
import type { Property, BookingPricing } from '../types';
import { usePropertyWithImages } from '../hooks/useProperties';
import { useCreateBooking, useAvailabilityCheck } from '../hooks/useBookings';
import { useGetOrCreateGuest } from '../hooks/useGuests';
import { sanitizeString, sanitizeEmail, sanitizePhone } from '../utils/sanitize';
import { formatCurrency } from '../utils/formatting';
import { calculateBookingPricing } from '../lib/utils/pricing';
import PropertyLoader from '../components/ui/PropertyLoader';

// Adapter function to convert PropertyWithImages to Property format
const adaptPropertyForBooking = (propertyWithImages: {
  id: string;
  title: string;
  description: string | null;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  area_sqft: number | null;
  price_per_night: number;
  cleaning_fee: number;
  security_deposit: number;
  address: string;
  city: string;
  state: string;
  zip_code: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  amenities: string[];
  house_rules: string | null;
  check_in_time: string;
  check_out_time: string;
  minimum_nights: number;
  maximum_nights: number | null;
  status: string;
  is_featured: boolean;
  host_id: string;
  images?: Array<{
    id: string;
    image_url: string;
    alt_text: string | null;
    caption: string | null;
    display_order: number;
    is_primary: boolean;
    created_at: string;
  }>;
}): Property => {
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
    maximumNights: propertyWithImages.maximum_nights || 365,
    status: propertyWithImages.status as 'active' | 'inactive' | 'maintenance' | 'sold',
    isFeatured: propertyWithImages.is_featured,
    images: (propertyWithImages.images || []).map(img => ({
      id: img.id,
      url: img.image_url,
      altText: img.alt_text || '',
      caption: img.caption || '',
      displayOrder: img.display_order,
      isPrimary: img.is_primary,
      createdAt: new Date(img.created_at)
    })),
    rating: 0,
    reviewCount: 0,
    hostId: propertyWithImages.host_id,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

// Minimal Input Component
interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

const Input: React.FC<InputProps> = ({ 
  label, 
  value, 
  onChange, 
  type = 'text', 
  placeholder, 
  error, 
  required,
  className = ''
}) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-900 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 bg-white border transition-colors rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent ${
          error ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 hover:border-gray-300'
        }`}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// Booking Summary Component
interface BookingSummaryProps {
  property: Property;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  pricing: BookingPricing;
  onDateChange?: () => void;
}

const BookingSummary: React.FC<BookingSummaryProps> = ({ 
  property, 
  checkInDate, 
  checkOutDate, 
  guests, 
  pricing,
  onDateChange
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    // Ensure proper date parsing - handle both YYYY-MM-DD format and other formats
    const date = new Date(dateString + 'T00:00:00');
    if (isNaN(date.getTime())) {
      // Fallback parsing
      return new Date(dateString).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate nights correctly - ensure dates are parsed properly
  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const checkIn = new Date(checkInDate + 'T00:00:00');
    const checkOut = new Date(checkOutDate + 'T00:00:00');
    
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      // Fallback parsing
      const checkInFallback = new Date(checkInDate);
      const checkOutFallback = new Date(checkOutDate);
      const diffTime = checkOutFallback.getTime() - checkInFallback.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    const diffTime = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8">
      {/* Property Preview */}
      <div className="mb-6">
        <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4 bg-gray-100">
          {property.images?.[0]?.url ? (
            <img
              src={property.images[0].url}
              alt={property.images[0].altText || property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-sm">No image</span>
            </div>
          )}
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1.5 line-clamp-2">{property.title}</h3>
        <div className="flex items-center text-sm text-gray-500">
          <MapPin className="w-3.5 h-3.5 mr-1" />
          <span>{property.city}, {property.state}</span>
        </div>
      </div>

      {/* Booking Details */}
      <div className="space-y-3 pb-6 border-b border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Check-in</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">{formatDate(checkInDate)}</span>
            {onDateChange && (
              <button
                onClick={onDateChange}
                className="text-xs text-[#1a1a1a] underline hover:no-underline font-medium"
              >
                Change
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Check-out</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">{formatDate(checkOutDate)}</span>
            {onDateChange && (
              <button
                onClick={onDateChange}
                className="text-xs text-[#1a1a1a] underline hover:no-underline font-medium"
              >
                Change
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-600">
            <Users className="w-4 h-4 mr-2" />
            <span>Guests</span>
          </div>
          <span className="font-medium text-gray-900">{guests} {guests === 1 ? 'guest' : 'guests'}</span>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="pt-6 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            {formatCurrency(property.pricePerNight)} × {nights} {nights === 1 ? 'night' : 'nights'}
          </span>
          <span className="text-gray-900 font-medium">{formatCurrency(pricing.basePrice)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Cleaning fee</span>
          <span className="text-gray-900 font-medium">{formatCurrency(pricing.cleaningFee)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Service fee</span>
          <span className="text-gray-900 font-medium">{formatCurrency(pricing.serviceFee)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Taxes</span>
          <span className="text-gray-900 font-medium">{formatCurrency(pricing.taxes)}</span>
        </div>
        <div className="flex justify-between pt-4 border-t border-gray-200">
          <span className="text-base font-semibold text-gray-900">Total</span>
          <span className="text-xl font-bold text-gray-900">{formatCurrency(pricing.totalAmount)}</span>
        </div>
      </div>
    </div>
  );
};

// Calendar Component for Date Selection
interface BookingCalendarProps {
  checkInDate: string;
  checkOutDate: string;
  onCheckInChange: (date: string) => void;
  onCheckOutChange: (date: string) => void;
  onClose: () => void;
  property: Property;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({
  checkInDate,
  checkOutDate,
  onCheckInChange,
  onCheckOutChange,
  onClose,
  property
}) => {
  const getInitialMonth = () => {
    if (checkInDate) {
      const checkIn = new Date(checkInDate + 'T00:00:00');
      if (!isNaN(checkIn.getTime())) {
        return new Date(checkIn.getFullYear(), checkIn.getMonth(), 1);
      }
    }
    return new Date();
  };

  const [currentMonth, setCurrentMonth] = useState(getInitialMonth());
  const [selectedDates, setSelectedDates] = useState<{checkIn?: Date, checkOut?: Date}>({
    checkIn: checkInDate ? new Date(checkInDate + 'T00:00:00') : undefined,
    checkOut: checkOutDate ? new Date(checkOutDate + 'T00:00:00') : undefined
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    const checkIn = checkInDate ? new Date(checkInDate + 'T00:00:00') : undefined;
    const checkOut = checkOutDate ? new Date(checkOutDate + 'T00:00:00') : undefined;
    setSelectedDates({
      checkIn: checkIn && !isNaN(checkIn.getTime()) ? checkIn : undefined,
      checkOut: checkOut && !isNaN(checkOut.getTime()) ? checkOut : undefined
    });
    if (checkIn && !isNaN(checkIn.getTime())) {
      setCurrentMonth(new Date(checkIn.getFullYear(), checkIn.getMonth(), 1));
    }
  }, [checkInDate, checkOutDate]);

  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      dayDate.setHours(0, 0, 0, 0);
      days.push(dayDate);
    }
    return days;
  };

  const normalizeDate = (date: Date): Date => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  const handleDateClick = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const dateNormalized = normalizeDate(date);
    
    if (!selectedDates.checkIn || (selectedDates.checkIn && selectedDates.checkOut)) {
      setSelectedDates({ checkIn: date, checkOut: undefined });
      onCheckInChange(dateString);
      onCheckOutChange('');
    } else if (selectedDates.checkIn && !selectedDates.checkOut) {
      const checkInNormalized = normalizeDate(selectedDates.checkIn);
      
      if (dateNormalized > checkInNormalized) {
        setSelectedDates(prev => ({ ...prev, checkOut: date }));
        onCheckOutChange(dateString);
        setTimeout(() => onClose(), 500);
      } else if (dateNormalized < checkInNormalized) {
        setSelectedDates({ checkIn: date, checkOut: undefined });
        onCheckInChange(dateString);
        onCheckOutChange('');
      }
    }
  };

  const isDateInRange = (date: Date) => {
    if (!selectedDates.checkIn || !selectedDates.checkOut) return false;
    const checkIn = normalizeDate(selectedDates.checkIn);
    const checkOut = normalizeDate(selectedDates.checkOut);
    const dateNormalized = normalizeDate(date);
    return dateNormalized > checkIn && dateNormalized < checkOut;
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDates.checkIn) return false;
    const checkIn = normalizeDate(selectedDates.checkIn);
    const dateNormalized = normalizeDate(date);
    
    if (selectedDates.checkOut) {
      const checkOut = normalizeDate(selectedDates.checkOut);
      return dateNormalized.getTime() === checkIn.getTime() || 
             dateNormalized.getTime() === checkOut.getTime();
    }
    return dateNormalized.getTime() === checkIn.getTime();
  };

  const isDateDisabled = (date: Date) => {
    const dateNormalized = normalizeDate(date);
    const todayNormalized = normalizeDate(today);
    return dateNormalized < todayNormalized;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const calculateNights = () => {
    if (checkInDate && checkOutDate) {
      const checkIn = new Date(checkInDate + 'T00:00:00');
      const checkOut = new Date(checkOutDate + 'T00:00:00');
      if (!isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime())) {
        const diffTime = checkOut.getTime() - checkIn.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }
    return 0;
  };

  const nights = calculateNights();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const nextMonth = new Date(currentMonth);
  nextMonth.setMonth(currentMonth.getMonth() + 1);

  const firstMonthDays = generateCalendarDays(currentMonth);
  const secondMonthDays = generateCalendarDays(nextMonth);

  return (
    <div 
      className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl max-w-full overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-4 md:p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-2 md:mb-4">
          <div className="flex-1">
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">
              {nights > 0 ? `${nights} ${nights === 1 ? 'Night' : 'Nights'} in ${property.city}` : `Select dates for ${property.city}`}
            </h3>
            {checkInDate && checkOutDate && (
              <p className="text-xs md:text-sm text-gray-500">
                {new Date(checkInDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} to {new Date(checkOutDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-2 -mt-2 -mr-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
          {[currentMonth, nextMonth].map((month, monthIndex) => {
            const calendarDays = monthIndex === 0 ? firstMonthDays : secondMonthDays;
            
            return (
              <div key={monthIndex} className="space-y-3 md:space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm md:text-base font-semibold text-gray-900">
                    {monthNames[month.getMonth()]} {month.getFullYear()}
                  </h4>
                  {monthIndex === 0 && (
                    <button
                      onClick={() => navigateMonth('prev')}
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                  {monthIndex === 1 && (
                    <button
                      onClick={() => navigateMonth('next')}
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Next month"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-7 gap-0.5 md:gap-1 mb-2">
                  {dayNames.map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-0.5 md:gap-1">
                  {calendarDays.map((date, index) => {
                    if (!date) {
                      return <div key={`empty-${monthIndex}-${index}`} className="h-8 md:h-10" />;
                    }
                    
                    const isDisabled = isDateDisabled(date);
                    const isSelected = isDateSelected(date);
                    const isInRange = isDateInRange(date);
                    
                    return (
                      <button
                        key={`${monthIndex}-${date.getTime()}`}
                        onClick={() => !isDisabled && handleDateClick(date)}
                        disabled={isDisabled}
                        className={`
                          h-8 md:h-10 w-8 md:w-10 text-xs md:text-sm rounded-lg flex items-center justify-center transition-all duration-200
                          ${isDisabled 
                            ? 'text-gray-300 cursor-not-allowed' 
                            : 'hover:bg-gray-100 cursor-pointer text-gray-700'
                          }
                          ${isSelected 
                            ? 'bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90 font-medium' 
                            : isInRange 
                              ? 'bg-gray-100 text-gray-800' 
                              : ''
                          }
                        `}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between items-center p-4 md:p-6 border-t border-gray-100 bg-gray-50">
        <button
          onClick={onClose}
          className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-[#1a1a1a] text-white rounded-lg hover:bg-[#1a1a1a]/90 transition-colors font-medium"
        >
          Done
        </button>
      </div>
    </div>
  );
};

// Main Booking Component
const Booking: React.FC = () => {
  const navigate = useNavigate();
  const { id: propertyId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  
  // Get booking details from URL params
  const checkInDate = searchParams.get('checkIn') || '';
  const checkOutDate = searchParams.get('checkOut') || '';
  const guests = parseInt(searchParams.get('guests') || '1');

  // Fetch property from API
  const { property: propertyData, loading: propertyLoading, error: propertyError } = usePropertyWithImages(propertyId || '');
  
  // Hooks for booking operations
  const { createBooking, loading: bookingLoading, error: bookingError } = useCreateBooking();
  const { checkAvailability, loading: availabilityLoading } = useAvailabilityCheck();
  const { getOrCreateGuest, loading: guestLoading } = useGetOrCreateGuest();

  // State management
  const [guestInfo, setGuestInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [specialRequests, setSpecialRequests] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availabilityChecked, setAvailabilityChecked] = useState(false);

  // Convert API data to Property format
  const property: Property | null = propertyData 
    ? adaptPropertyForBooking({ ...propertyData, host_id: propertyData.host?.id || '' })
    : null;

  // Calculate nights correctly - ensure dates are parsed properly
  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    // Ensure proper date parsing - handle YYYY-MM-DD format
    const checkIn = new Date(checkInDate + 'T00:00:00');
    const checkOut = new Date(checkOutDate + 'T00:00:00');
    
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      // Fallback parsing
      const checkInFallback = new Date(checkInDate);
      const checkOutFallback = new Date(checkOutDate);
      const diffTime = checkOutFallback.getTime() - checkInFallback.getTime();
      return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }
    
    const diffTime = checkOut.getTime() - checkIn.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const nights = calculateNights();
  
  // State for calendar modal
  const [showCalendar, setShowCalendar] = useState(false);
  const [localCheckInDate, setLocalCheckInDate] = useState(checkInDate);
  const [localCheckOutDate, setLocalCheckOutDate] = useState(checkOutDate);

  // Sync local dates with URL params
  useEffect(() => {
    setLocalCheckInDate(checkInDate);
    setLocalCheckOutDate(checkOutDate);
  }, [checkInDate, checkOutDate]);

  // Update dates and URL params
  const handleDateChange = (newCheckIn: string, newCheckOut: string) => {
    setLocalCheckInDate(newCheckIn);
    setLocalCheckOutDate(newCheckOut);
    
    // Update URL params
    const params = new URLSearchParams(searchParams);
    params.set('checkIn', newCheckIn);
    params.set('checkOut', newCheckOut);
    navigate(`${ROUTES.BOOKING.replace(':id', propertyId || '')}?${params.toString()}`, { replace: true });
  };

  // Lock body scroll when calendar is open
  useEffect(() => {
    if (showCalendar) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showCalendar]);

  // Calculate pricing using shared utility function
  const pricing: BookingPricing = property ? calculateBookingPricing({
    pricePerNight: property.pricePerNight,
    nights,
    cleaningFee: property.cleaningFee,
    securityDeposit: property.securityDeposit,
  }) : {
    basePrice: 0,
    cleaningFee: 0,
    securityDeposit: 0,
    serviceFee: 0,
    taxes: 0,
    totalAmount: 0,
    currency: 'XOF'
  };

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Guest info validation
    if (!guestInfo.firstName.trim()) newErrors.firstName = 'Required';
    if (!guestInfo.lastName.trim()) newErrors.lastName = 'Required';
    if (!guestInfo.email.trim()) newErrors.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(guestInfo.email)) newErrors.email = 'Invalid email';
    if (!guestInfo.phone.trim()) newErrors.phone = 'Required';

    // Payment info validation
    if (!paymentInfo.cardholderName.trim()) newErrors.cardholderName = 'Required';
    if (!paymentInfo.cardNumber.replace(/\s/g, '')) newErrors.cardNumber = 'Required';
    else if (paymentInfo.cardNumber.replace(/\s/g, '').length < 13) newErrors.cardNumber = 'Invalid';
    if (!paymentInfo.expiryDate) newErrors.expiryDate = 'Required';
    if (!paymentInfo.cvv) newErrors.cvv = 'Required';
    else if (paymentInfo.cvv.length < 3) newErrors.cvv = 'Invalid';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check availability on mount and when dates change
  useEffect(() => {
    if (!propertyId || !checkInDate || !checkOutDate) return;

    let isMounted = true;

    const checkAvailabilityForDates = async () => {
      try {
        const result = await checkAvailability(propertyId, checkInDate, checkOutDate);
        if (!isMounted) return;
        
        if (!result.available) {
          setErrors({ 
            general: 'This property is not available for the selected dates. Please choose different dates.' 
          });
          setAvailabilityChecked(false);
        } else {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.general;
            return newErrors;
          });
          setAvailabilityChecked(true);
        }
      } catch (error) {
        if (!isMounted) return;
        setErrors({ 
          general: 'Failed to check availability. Please try again.' 
        });
        setAvailabilityChecked(false);
      }
    };

    setAvailabilityChecked(false);
    checkAvailabilityForDates();

    return () => {
      isMounted = false;
    };
  }, [propertyId, checkInDate, checkOutDate]); // Removed property and checkAvailability from deps

  // Handle booking submission
  const handleBookingSubmit = async () => {
    if (!validateForm() || !property) return;

    if (!availabilityChecked) {
      setErrors({ general: 'Please wait while we check availability...' });
      return;
    }

    try {
      // Sanitize all inputs before sending
      const sanitizedEmail = sanitizeEmail(guestInfo.email.trim());
      const sanitizedPhone = guestInfo.phone ? sanitizePhone(guestInfo.phone.trim()) : null;
      
      // Step 1: Get or create guest
      const guest = await getOrCreateGuest({
        email: sanitizedEmail,
        first_name: sanitizeString(guestInfo.firstName.trim()),
        last_name: sanitizeString(guestInfo.lastName.trim()),
        phone: sanitizedPhone,
      });

      if (!guest) {
        setErrors({ general: 'Failed to create guest profile. Please try again.' });
        return;
      }

      // Step 2: Create booking
      // Note: Database constraint requires total_amount = base_price + cleaning_fee + taxes
      // So we combine serviceFee + taxes into the taxes field for database storage
      const taxesForDatabase = pricing.serviceFee + pricing.taxes;
      const booking = await createBooking({
        property_id: property.id,
        guest_id: guest.id,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        guests_count: guests,
        base_price: pricing.basePrice,
        cleaning_fee: pricing.cleaningFee,
        security_deposit: pricing.securityDeposit,
        taxes: taxesForDatabase, // Includes service fee + taxes
        total_amount: pricing.totalAmount, // This matches: basePrice + cleaningFee + serviceFee + taxes
        special_requests: specialRequests.trim() ? sanitizeString(specialRequests.trim()) : undefined,
      });

      if (!booking) {
        setErrors({ general: 'Failed to create booking. Please try again.' });
        return;
      }

      // Navigate to confirmation page
      navigate(`/booking-confirmation/${booking.id}`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Booking failed. Please try again.';
      setErrors({ general: errorMessage });
    }
  };

  // Format card number
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    }
    return v;
  };

  // Format expiry date
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Redirect if no booking details
  useEffect(() => {
    if (!checkInDate || !checkOutDate) {
      navigate(ROUTES.PROPERTY_DETAIL.replace(':id', propertyId || ''));
    }
  }, [checkInDate, checkOutDate, navigate, propertyId]);

  // Show loading state while fetching property
  if (propertyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <PropertyLoader />
          <p className="text-gray-500 mt-6 text-sm">Loading property details...</p>
        </div>
      </div>
    );
  }

  // Show error state if property fetch failed
  if (propertyError || !propertyData || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <AlertCircle className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading property</h3>
          <p className="text-sm text-gray-500 mb-6">{propertyError || 'Property not found'}</p>
          <button
            onClick={() => navigate(ROUTES.PROPERTIES)}
            className="px-6 py-3 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#1a1a1a]/90 transition-colors text-sm font-medium"
          >
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  if (!checkInDate || !checkOutDate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-[#1a1a1a] mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Redirecting...</p>
        </div>
      </div>
    );
  }

  const isLoading = bookingLoading || guestLoading || availabilityLoading || !availabilityChecked;

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const goBack = () => {
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else if (propertyId) {
                    navigate(`/properties/${propertyId}`);
                  } else {
                    navigate(ROUTES.PROPERTIES);
                  }
                };
                goBack();
              }}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium cursor-pointer relative z-10"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Lock className="w-3.5 h-3.5" />
              <span>Secure</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12">
          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Page Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-light text-gray-900 mb-2">Complete your booking</h1>
              <p className="text-sm text-gray-500">Review your details and confirm your reservation</p>
            </div>

            {/* Contact Information */}
            <section className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900">Contact information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First name"
                  value={guestInfo.firstName}
                  onChange={(value) => setGuestInfo({ ...guestInfo, firstName: value })}
                  placeholder="John"
                  error={errors.firstName}
                  required
                />
                <Input
                  label="Last name"
                  value={guestInfo.lastName}
                  onChange={(value) => setGuestInfo({ ...guestInfo, lastName: value })}
                  placeholder="Doe"
                  error={errors.lastName}
                  required
                />
              </div>
              <Input
                label="Email"
                type="email"
                value={guestInfo.email}
                onChange={(value) => setGuestInfo({ ...guestInfo, email: value })}
                placeholder="john@example.com"
                error={errors.email}
                required
              />
              <Input
                label="Phone"
                type="tel"
                value={guestInfo.phone}
                onChange={(value) => setGuestInfo({ ...guestInfo, phone: value })}
                placeholder="+1 (555) 000-0000"
                error={errors.phone}
                required
              />
            </section>

            {/* Payment Information */}
            <section className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900">Payment</h2>
              <Input
                label="Cardholder name"
                value={paymentInfo.cardholderName}
                onChange={(value) => setPaymentInfo({ ...paymentInfo, cardholderName: value })}
                placeholder="John Doe"
                error={errors.cardholderName}
                required
              />
              <Input
                label="Card number"
                value={paymentInfo.cardNumber}
                onChange={(value) => setPaymentInfo({ ...paymentInfo, cardNumber: formatCardNumber(value) })}
                placeholder="1234 5678 9012 3456"
                error={errors.cardNumber}
                required
                className="max-w-md"
              />
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <Input
                  label="Expiry"
                  value={paymentInfo.expiryDate}
                  onChange={(value) => setPaymentInfo({ ...paymentInfo, expiryDate: formatExpiryDate(value) })}
                  placeholder="MM/YY"
                  error={errors.expiryDate}
                  required
                />
                <Input
                  label="CVV"
                  value={paymentInfo.cvv}
                  onChange={(value) => setPaymentInfo({ ...paymentInfo, cvv: value.replace(/\D/g, '') })}
                  placeholder="123"
                  error={errors.cvv}
                  required
                />
              </div>
            </section>

            {/* Special Requests */}
            <section className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900">Special requests <span className="text-gray-400 font-normal text-sm">(optional)</span></h2>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-colors resize-none"
                placeholder="Any special requests or notes for your stay..."
              />
            </section>

            {/* Error Message */}
            {(errors.general || bookingError) && (
              <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{errors.general || bookingError}</p>
              </div>
            )}

            {/* Security Notice */}
            <div className="flex items-start space-x-3 p-4 bg-gray-50 border border-gray-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900 mb-1">Secure payment</p>
                <p>Your payment information is encrypted and secure. You won't be charged until your booking is confirmed.</p>
              </div>
            </div>
          </div>

          {/* Booking Summary - Sticky on desktop, fixed bottom on mobile */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <BookingSummary 
                property={property}
                checkInDate={checkInDate}
                checkOutDate={checkOutDate}
                guests={guests}
                pricing={pricing}
                onDateChange={() => setShowCalendar(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Modal (Desktop) */}
      {showCalendar && !window.matchMedia('(max-width: 768px)').matches && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCalendar(false)}
          />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-auto">
            <BookingCalendar 
              checkInDate={localCheckInDate}
              checkOutDate={localCheckOutDate}
              onCheckInChange={(date) => handleDateChange(date, localCheckOutDate)}
              onCheckOutChange={(date) => handleDateChange(localCheckInDate, date)}
              onClose={() => setShowCalendar(false)}
              property={property}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Calendar Drawer (Mobile) */}
      {showCalendar && window.matchMedia('(max-width: 768px)').matches && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999]">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCalendar(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto transform transition-transform duration-300 ease-out z-10">
            <BookingCalendar 
              checkInDate={localCheckInDate}
              checkOutDate={localCheckOutDate}
              onCheckInChange={(date) => handleDateChange(date, localCheckOutDate)}
              onCheckOutChange={(date) => handleDateChange(localCheckInDate, date)}
              onClose={() => setShowCalendar(false)}
              property={property}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Mobile Fixed Bottom Button */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-lg z-50">
        <button
          onClick={handleBookingSubmit}
          disabled={isLoading}
          className="w-full bg-[#1a1a1a] text-white py-4 rounded-lg font-medium hover:bg-[#1a1a1a]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              <span>Complete booking - {formatCurrency(pricing.totalAmount)}</span>
            </>
          )}
        </button>
      </div>

      {/* Desktop Submit Button */}
      <div className="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="lg:col-span-2">
          <button
            onClick={handleBookingSubmit}
            disabled={isLoading}
            className="w-full max-w-2xl bg-[#1a1a1a] text-white py-4 rounded-lg font-medium hover:bg-[#1a1a1a]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Processing booking...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Complete booking - {formatCurrency(pricing.totalAmount)}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Spacer for mobile button */}
      <div className="lg:hidden h-24"></div>
    </div>
  );
};

export default Booking;
