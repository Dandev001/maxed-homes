import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Home, Wifi, Car, Coffee, Utensils, Dumbbell, Waves, Mountain, Shield, Heart, Share, ChevronDown, Minus, Plus, ChevronLeft, ChevronRight, Calendar, Tv, AirVent, Flame, TreePine, Bike, Gamepad2, Music, BookOpen, Baby, Lock, Key, Camera, Monitor, Printer, Sofa, Armchair, Bed, Bath, Microwave, Refrigerator, Fan, Phone, Laptop, Tv2, Smartphone, Clock, AlarmClock, Timer, CheckCircle, X } from 'lucide-react';
import Footer from '../components/layout/Footer';
import { GiBarbecue, GiGolfFlag, GiMeditation, GiHiking, GiBoatFishing, GiFireplace, GiWashingMachine, GiDesk, GiTennisRacket, GiBasketballBall, GiSoccerBall } from "react-icons/gi";
import { LiaHotTubSolid, LiaSwimmingPoolSolid, LiaUmbrellaBeachSolid } from "react-icons/lia";
import { MdOutlineSpa, MdBalcony, MdElevator, MdLocalLaundryService, MdPets, MdSmokingRooms, MdFreeBreakfast, MdBeachAccess, MdFitnessCenter, MdBusinessCenter, MdChildCare } from "react-icons/md";
import { ROUTES } from '../constants';
import { GoPeople } from 'react-icons/go';
import { IoBedOutline, IoKeyOutline, IoShieldOutline, IoTimerOutline, IoRestaurantOutline, IoLibraryOutline } from "react-icons/io5";
import { PiBathtubLight, PiHairDryerLight, PiFirstAidKitLight } from "react-icons/pi";
import { AmenitiesModal, AmenitiesDrawer } from '../components/amenities';
import { RequestBookingModal } from '../components/booking';
import type { Property } from '../types';
import { usePropertyWithImages } from '../hooks/useProperties';
import { LocationSection, ReviewsSection, ThingsToKnowSection, MobileCarousel, DesktopCarousel } from '../components/property';
import HostSection from '../components/property/HostSection';
import PropertyLoader from '../components/ui/PropertyLoader';
import SEO, { generatePropertyStructuredData } from '../components/SEO';
import { usePropertyRating } from '../hooks/useReviews';
import { useAuth } from '../contexts/AuthContext';
import { useGuestByEmail, useGetOrCreateGuest } from '../hooks/useGuests';
import { useFavoritePropertyIds, useToggleFavorite } from '../hooks/useFavorites';
import { useToast } from '../contexts/ToastContext';

// Adapter function to convert PropertyWithImages to Property format
const adaptPropertyForDetail = (propertyWithImages: {
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
  cancellation_policy: string | null;
  safety_property: string | null;
  check_in_time: string;
  check_out_time: string;
  minimum_nights: number;
  maximum_nights: number | null;
  status: string;
  is_featured: boolean;
  host_id: string;
  created_at: string;
  updated_at: string;
  images?: Array<{
    id: string;
    image_url: string;
    alt_text: string | null;
    caption: string | null;
    display_order: number;
    is_primary: boolean;
    created_at: string;
  }>;
  host?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_image_url: string | null;
    is_verified: boolean;
    created_at: string;
  };
}): Property => {
  const host = propertyWithImages.host;
  
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
    cancellationPolicy: propertyWithImages.cancellation_policy || undefined,
    safetyProperty: propertyWithImages.safety_property || undefined,
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
    // Map host data from database format to Property type format
    host: host ? {
      id: host.id,
      name: `${host.first_name} ${host.last_name}`,
      type: host.is_verified ? 'Verified Host' : 'Host',
      joinDate: new Date(host.created_at).getFullYear().toString(),
      responseTime: 'within an hour', // Default, can be enhanced later
      responseRate: 99, // Default, can be calculated from reviews later
      profileImage: host.profile_image_url || '',
      languages: ['English'], // Default, can be added to hosts table later
      verifications: host.is_verified ? ['ID', 'Email'] : ['Email'],
    } : {
      id: '',
      name: 'Unknown Host',
      type: 'Host',
      joinDate: new Date().getFullYear().toString(),
      responseTime: 'within an hour',
      responseRate: 99,
      profileImage: '',
      languages: ['English'],
      verifications: ['Email'],
    },
    propertyHighlights: [
      { id: '1', title: 'Dedicated workspace', description: 'A private room with fiber internet', icon: IoTimerOutline },
      { id: '2', title: 'Self check-in', description: 'Check yourself in with the lockbox', icon: IoKeyOutline },
      { id: '3', title: 'Free cancellation', description: 'Free cancellation before check-in', icon: IoShieldOutline }
    ],
    createdAt: new Date(propertyWithImages.created_at),
    updatedAt: new Date(propertyWithImages.updated_at),
  };
};


// Booking Card Component
interface BookingCardProps {
  property: Property;
  isMobile?: boolean;
  checkInDate: string;
  checkOutDate: string;
  onCheckInChange: (date: string) => void;
  onCheckOutChange: (date: string) => void;
  onBookingSuccess?: (bookingId: string) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ 
  property, 
  isMobile = false,
  checkInDate,
  checkOutDate,
  onCheckInChange,
  onCheckOutChange,
  onBookingSuccess
}) => {
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [showGuestDropdown, setShowGuestDropdown] = useState<boolean>(false);
  const [showRequestModal, setShowRequestModal] = useState<boolean>(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  
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
  
  // Enhanced guest state management
  const [guestCounts, setGuestCounts] = useState({
    adults: 2,
    children: 0,
    infants: 0,
    pets: 0
  });

  // Calculate total guests
  const totalGuests = guestCounts.adults + guestCounts.children + guestCounts.infants;

  // Handle booking request success - use callback from parent
  const handleBookingSuccess = (bookingId: string) => {
    if (onBookingSuccess) {
      onBookingSuccess(bookingId);
    } else {
      // Fallback: show success message if no callback provided
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
    }
  };

  // Handle guest count changes
  const handleGuestCountChange = (type: keyof typeof guestCounts, change: number) => {
    setGuestCounts(prev => {
      const newCounts = { ...prev };
      
      // Calculate the new value for the specific type
      const newValue = newCounts[type] + change;
      
      // Apply type-specific limits
      if (type === 'adults') {
        newCounts.adults = Math.max(1, Math.min(newValue, property.maxGuests));
      } else if (type === 'children') {
        newCounts.children = Math.max(0, Math.min(newValue, property.maxGuests - newCounts.adults));
      } else if (type === 'infants') {
        newCounts.infants = Math.max(0, Math.min(newValue, 5));
      } else if (type === 'pets') {
        newCounts.pets = Math.max(0, Math.min(newValue, 2));
      }
      
      // Ensure total guests (adults + children + infants) doesn't exceed property max
      const newTotal = newCounts.adults + newCounts.children + newCounts.infants;
      if (newTotal > property.maxGuests) {
        // If we're adding to children or infants and it would exceed the limit,
        // don't allow the change
        if (type === 'children' || type === 'infants') {
          return prev; // Revert the change
        }
        // If we're adding to adults, adjust children and infants if needed
        if (type === 'adults') {
          const excess = newTotal - property.maxGuests;
          if (newCounts.children >= excess) {
            newCounts.children -= excess;
          } else {
            const remainingExcess = excess - newCounts.children;
            newCounts.children = 0;
            newCounts.infants = Math.max(0, newCounts.infants - remainingExcess);
          }
        }
      }
      
      return newCounts;
    });
  };


  // Sleek Calendar Component
  const SleekCalendar = ({
    checkInDate,
    checkOutDate,
    onCheckInChange,
    onCheckOutChange,
    onClose
  }: {
    checkInDate: string;
    checkOutDate: string;
    onCheckInChange: (date: string) => void;
    onCheckOutChange: (date: string) => void;
    onClose: () => void;
  }) => {
    // Initialize currentMonth to show check-in month if available, otherwise current month
    const getInitialMonth = () => {
      if (checkInDate) {
        const checkIn = new Date(checkInDate);
        return new Date(checkIn.getFullYear(), checkIn.getMonth(), 1);
      }
      return new Date();
    };

    const [currentMonth, setCurrentMonth] = useState(getInitialMonth());
    const [selectedDates, setSelectedDates] = useState<{checkIn?: Date, checkOut?: Date}>({
      checkIn: checkInDate ? new Date(checkInDate) : undefined,
      checkOut: checkOutDate ? new Date(checkOutDate) : undefined
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    
    // Update selectedDates when parent state changes
    useEffect(() => {
      setSelectedDates({
        checkIn: checkInDate ? new Date(checkInDate) : undefined,
        checkOut: checkOutDate ? new Date(checkOutDate) : undefined
      });
      // Update currentMonth to show check-in month when it changes
      if (checkInDate) {
        const checkIn = new Date(checkInDate);
        setCurrentMonth(new Date(checkIn.getFullYear(), checkIn.getMonth(), 1));
      }
    }, [checkInDate, checkOutDate]);

    // Generate calendar days for a given month
    const generateCalendarDays = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      const days = [];
      
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
      }
      
      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(year, month, day);
        dayDate.setHours(0, 0, 0, 0);
        days.push(dayDate);
      }
      
      return days;
    };

    // Helper to normalize date to start of day for comparison
    const normalizeDate = (date: Date): Date => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };

    const handleDateClick = (date: Date) => {
      const dateString = date.toISOString().split('T')[0];
      const dateNormalized = normalizeDate(date);
      
      if (!selectedDates.checkIn || (selectedDates.checkIn && selectedDates.checkOut)) {
        // Start new selection
        setSelectedDates({ checkIn: date, checkOut: undefined });
        onCheckInChange(dateString);
        onCheckOutChange('');
      } else if (selectedDates.checkIn && !selectedDates.checkOut) {
        // Complete selection
        const checkInNormalized = normalizeDate(selectedDates.checkIn);
        
        if (dateNormalized > checkInNormalized) {
          setSelectedDates(prev => ({ ...prev, checkOut: date }));
          onCheckOutChange(dateString);
          // Auto-close calendar after selection
          setTimeout(() => onClose(), 500);
        } else if (dateNormalized < checkInNormalized) {
          // If clicked date is before check-in, make it the new check-in
          setSelectedDates({ checkIn: date, checkOut: undefined });
          onCheckInChange(dateString);
          onCheckOutChange('');
        } else {
          // Same date clicked, clear selection
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

    const clearDates = () => {
      setSelectedDates({});
      onCheckInChange('');
      onCheckOutChange('');
    };

    // Calculate nights
    const calculateNights = () => {
      if (checkInDate && checkOutDate) {
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const diffTime = checkOut.getTime() - checkIn.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
      }
      return 0;
    };

    const nights = calculateNights();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Get next month
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(currentMonth.getMonth() + 1);

    const firstMonthDays = generateCalendarDays(currentMonth);
    const secondMonthDays = generateCalendarDays(nextMonth);

    return (
      <div 
        className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl max-w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with nights and date range */}
        <div className="p-4 md:p-6 border-b border-gray-100">
          <div className="flex items-start justify-between mb-2 md:mb-4">
            <div className="flex-1">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">
                {nights > 0 ? `${nights} ${nights === 1 ? 'Night' : 'Nights'} in ${property.city}` : `Select dates for ${property.city}`}
              </h3>
              {checkInDate && checkOutDate && (
                <p className="text-xs md:text-sm text-gray-500">
                  {new Date(checkInDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} to {new Date(checkOutDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
            {/* Close button for mobile drawer */}
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

        {/* Two Month Calendar Grid */}
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
            {/* First Month */}
            {[currentMonth, nextMonth].map((month, monthIndex) => {
              const calendarDays = monthIndex === 0 ? firstMonthDays : secondMonthDays;
              
              return (
                <div key={monthIndex} className="space-y-3 md:space-y-4">
                  {/* Month Header */}
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

                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-0.5 md:gap-1 mb-2">
                    {dayNames.map((day) => (
                      <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar days */}
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

        {/* Footer */}
        <div className="flex justify-between items-center p-4 md:p-6 border-t border-gray-100 bg-gray-50">
          <button
            onClick={clearDates}
            className="text-xs md:text-sm text-gray-600 hover:text-gray-800 transition-colors font-medium"
          >
            Clear dates
          </button>
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

  const baseClasses = isMobile 
    ? "bg-white border border-gray-200 rounded-2xl shadow-lg"
    : "bg-white border border-gray-200 rounded-2xl shadow-lg";

  // Unified version for both mobile and desktop
  return (
    <div className={`${baseClasses} ${isMobile ? 'p-4' : 'p-6'} relative`}>
      {/* Price Header - Side by side on mobile, stacked on desktop */}
      <div className="flex md:block items-center justify-between md:justify-start mb-0 md:mb-6 gap-3 md:gap-0">
        <div className="text-xl md:text-2xl font-bold text-[#1a1a1a]">
          {new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(property.pricePerNight)}
          <span className="text-sm md:text-base font-normal text-[#1a1a1a]/90"> for 1 night</span>
        </div>
        
        {/* Button on mobile - inline with price */}
        <div className="md:hidden flex-shrink-0">
          {checkInDate && checkOutDate ? (
            <button 
              onClick={() => setShowRequestModal(true)}
              className="bg-[#1a1a1a] text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 hover:bg-[#1a1a1a]/90 active:scale-[0.98] whitespace-nowrap"
            >
              Request Booking
            </button>
          ) : (
            <button 
              onClick={() => setShowCalendar(true)}
              className="bg-[#1a1a1a] text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 hover:bg-[#1a1a1a]/90 active:scale-[0.98] whitespace-nowrap"
            >
              Check availability
            </button>
          )}
        </div>
      </div>

      {/* Date Selection - Hidden on mobile */}
      <div className="hidden md:block space-y-3 md:space-y-4 mb-4 md:mb-6">
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          {/* Check-in */}
          <div className="relative">
            <label className="block text-[10px] md:text-xs font-medium text-[#1a1a1a]/70 mb-1 uppercase tracking-wide">CHECK-IN</label>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCalendar(!showCalendar);
              }}
              className="w-full p-2.5 md:p-3 text-left border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/20 focus:border-[#1a1a1a] transition-all bg-white"
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm md:text-base ${checkInDate ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                  {checkInDate ? new Date(checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Add date'}
                </span>
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            </button>
          </div>

          {/* Check-out */}
          <div className="relative">
            <label className="block text-[10px] md:text-xs font-medium text-[#1a1a1a]/70 mb-1 uppercase tracking-wide">CHECKOUT</label>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCalendar(!showCalendar);
              }}
              className="w-full p-2.5 md:p-3 text-left border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/20 focus:border-[#1a1a1a] transition-all bg-white"
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm md:text-base ${checkOutDate ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                  {checkOutDate ? new Date(checkOutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Add date'}
                </span>
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            </button>
          </div>
        </div>

        {/* Guest Selection */}
        <div className="relative">
          <label className="block text-[10px] md:text-xs font-medium text-[#1a1a1a]/70 mb-1 uppercase tracking-wide">GUESTS</label>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowGuestDropdown(!showGuestDropdown);
            }}
            className="w-full p-2.5 md:p-3 text-left border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/20 focus:border-[#1a1a1a] transition-all bg-white"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm md:text-base text-gray-900 font-medium">
                {totalGuests} {totalGuests === 1 ? 'guest' : 'guests'}
                {guestCounts.pets > 0 && `, ${guestCounts.pets} ${guestCounts.pets === 1 ? 'pet' : 'pets'}`}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </div>
          </button>

          {/* Enhanced Guest Dropdown */}
          {showGuestDropdown && (
            <div 
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[200] max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 space-y-4">
                {/* Adults */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-[#1a1a1a]/90">Adults</span>
                    <p className="text-xs text-gray-500">Ages 13 or above</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGuestCountChange('adults', -1);
                      }}
                      disabled={guestCounts.adults <= 1}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{guestCounts.adults}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGuestCountChange('adults', 1);
                      }}
                      disabled={totalGuests >= property.maxGuests}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Children */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-[#1a1a1a]/90">Children</span>
                    <p className="text-xs text-gray-500">Ages 2-12</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGuestCountChange('children', -1);
                      }}
                      disabled={guestCounts.children <= 0}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{guestCounts.children}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGuestCountChange('children', 1);
                      }}
                      disabled={totalGuests >= property.maxGuests}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Infants */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-[#1a1a1a]/90">Infants</span>
                    <p className="text-xs text-gray-500">Under 2</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGuestCountChange('infants', -1);
                      }}
                      disabled={guestCounts.infants <= 0}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{guestCounts.infants}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGuestCountChange('infants', 1);
                      }}
                      disabled={guestCounts.infants >= 5}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Pets */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-[#1a1a1a]/90">Pets</span>
                    <p className="text-xs text-gray-500">Bringing a service animal?</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGuestCountChange('pets', -1);
                      }}
                      disabled={guestCounts.pets <= 0}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{guestCounts.pets}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGuestCountChange('pets', 1);
                      }}
                      disabled={guestCounts.pets >= 2}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                  Maximum {property.maxGuests} guests (adults + children + infants)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Request Booking/Check Availability Button - Desktop only */}
      <div className="hidden md:block">
        {checkInDate && checkOutDate ? (
          <button 
            onClick={() => setShowRequestModal(true)}
            className="w-full bg-[#1a1a1a] text-white py-3 md:py-4 rounded-lg md:rounded-xl font-semibold text-sm md:text-base transition-all duration-200 hover:bg-[#1a1a1a]/90 active:scale-[0.98]"
          >
            Request Booking
          </button>
        ) : (
          <button 
            onClick={() => setShowCalendar(true)}
            className="w-full bg-[#1a1a1a] text-white py-3 md:py-4 rounded-lg md:rounded-xl font-semibold text-sm md:text-base transition-all duration-200 hover:bg-[#1a1a1a]/90 active:scale-[0.98]"
          >
            Check availability
          </button>
        )}
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">Booking request submitted!</p>
            <p className="text-sm text-green-700 mt-1">The host will review your request and get back to you soon.</p>
          </div>
          <button
            onClick={() => setShowSuccessMessage(false)}
            className="text-green-600 hover:text-green-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Request Booking Modal */}
      <RequestBookingModal
        property={property}
        checkInDate={checkInDate}
        checkOutDate={checkOutDate}
        guestCounts={guestCounts}
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSuccess={handleBookingSuccess}
      />

      {/* Calendar Modal (Desktop) - Using Portal */}
      {showCalendar && !isMobile && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCalendar(false)}
          />
          {/* Modal Content */}
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-auto">
            <SleekCalendar 
              checkInDate={checkInDate}
              checkOutDate={checkOutDate}
              onCheckInChange={onCheckInChange}
              onCheckOutChange={onCheckOutChange}
              onClose={() => setShowCalendar(false)}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Calendar Drawer (Mobile) - Using Portal */}
      {showCalendar && isMobile && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999]">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCalendar(false)}
          />
          {/* Drawer */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto transform transition-transform duration-300 ease-out z-10">
            <SleekCalendar 
              checkInDate={checkInDate}
              checkOutDate={checkOutDate}
              onCheckInChange={onCheckInChange}
              onCheckOutChange={onCheckOutChange}
              onClose={() => setShowCalendar(false)}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Click outside to close guest dropdown */}
      {showGuestDropdown && (
        <div 
          className="fixed inset-0 z-20" 
          onClick={() => {
            setShowGuestDropdown(false);
          }}
        />
      )}
    </div>
  );
};

// Sticky Tab Bar Component
interface StickyTabBarProps {
  onBackClick: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
  onFavoriteClick?: () => void;
  onShareClick?: () => void;
  isFavorite?: boolean;
}

const StickyTabBar: React.FC<StickyTabBarProps> = ({ onBackClick, activeSection, onSectionChange, onFavoriteClick, onShareClick, isFavorite = false }) => {
  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'amenities', label: 'Amenities' },
    { id: 'availability', label: 'Availability' },
    { id: 'location', label: 'Location' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'host', label: 'Host' }
  ];

  return (
    <div className="hidden md:block sticky top-0 z-[100] bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Back Button */}
          <button
            onClick={onBackClick}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Properties</span>
          </button>

          {/* Section Navigation */}
          <div className="flex items-center space-x-8">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? 'text-[#1a1a1a]'
                    : 'text-[#1a1a1a]/50 hover:text-[#1a1a1a]/70'
                }`}
              >
                {section.label}
                {activeSection === section.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a1a1a] rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {onFavoriteClick && (
              <button 
                onClick={onFavoriteClick}
                className={`p-2 transition-colors ${
                  isFavorite 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'text-[#1a1a1a]/50 hover:text-[#1a1a1a]/70'
                }`}
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500' : ''}`} />
              </button>
            )}
            <button 
              onClick={onShareClick}
              className="p-2 text-[#1a1a1a]/50 hover:text-[#1a1a1a]/70 transition-colors"
              aria-label="Share property"
            >
              <Share className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Section Components
const ImagePreviewSection: React.FC<{ property: Property }> = ({ property }) => {
  return (
    <section className="w-full py-8">
      {/* Desktop Title - Above carousel */}
      <div className="hidden md:block mb-8">
        <h1 className="text-3xl font-semibold text-[#1a1a1a]/90 mb-4">{property.title}</h1>
      </div>
      
      {/* Desktop Carousel */}
      <DesktopCarousel property={property} />
      
      {/* Desktop Location and Stats - Below carousel */}
      <div className="hidden md:block mt-8">
        <h2 className="text-xl font-medium text-[#1a1a1a]/90 mb-2">{property.city}, {property.state}</h2>
        <div className="flex items-center space-x-4 text-[#1a1a1a]/80 mt-2">
          <div className="flex items-center text-sm space-x-1">
            <IoBedOutline className="w-5 h-5" />
            <span>{property.bedrooms} Bedrooms  ●</span>
          </div>
          <div className="flex items-center text-sm space-x-1">
            <PiBathtubLight className="w-5 h-5" />
            <span>{property.bathrooms} Bath  ●</span>
          </div>
          <div className="flex items-center text-sm space-x-1"> 
            <GoPeople className="w-5 h-5" />
            <span>{property.maxGuests} Max Guests</span>
          </div>
        </div>
      </div>
    </section>
  );
};

const OverviewSection: React.FC<{ property: Property }> = ({ property }) => {
  return (
    <section id="overview" className="py-6">
      <div className="space-y-8">
        {/* Host Preview */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-200 pb-8 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
              {property.host?.profileImage && property.host.profileImage.trim() ? (
                <img 
                  src={property.host.profileImage} 
                  alt={property.host?.name || 'Host'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-400 text-xs sm:text-base font-semibold">
                    {property.host?.name?.charAt(0)?.toUpperCase() || 'H'}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#1a1a1a]/90">
                Hosted by {property.host?.name}
              </h3>
              <div className="flex items-center space-x-2 text-gray-600 text-sm mt-1">
                <span>{property.host?.type}</span>
                <span>•</span>
                <span>Host since {property.host?.joinDate}</span>
              </div>
            </div>
          </div>
        
        </div>

        {/* Property Highlights */}
        <div className="border-b border-gray-200 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {property.propertyHighlights?.map((highlight) => {
              // Icon is already a React component, use it directly
              const IconComponent = highlight.icon || Home;
              
              return (
                <div key={highlight.id} className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <IconComponent className="w-6 h-6 text-[#1a1a1a]/90" />
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-medium text-[#1a1a1a]/90">{highlight.title}</h4>
                    <p className="text-[#1a1a1a]/90 text-sm mt-1">{highlight.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div className='text-[#1a1a1a]/90'>
          <DescriptionSection description={property.description} />
        </div>
      </div>
    </section>
  );
};

interface AmenitiesSectionProps {
  property: Property;
  onShowModal: () => void;
  onShowDrawer: () => void;
}

// Description Section Component with Show More/Less functionality
interface DescriptionSectionProps {
  description: string;
}

const DescriptionSection: React.FC<DescriptionSectionProps> = ({ description }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if content height exceeds the collapsed height
    if (contentRef.current) {
      const shouldShow = contentRef.current.scrollHeight > 200;
      setShouldShowButton(shouldShow);
    }
  }, [description]);

  return (
    <div className="relative">
      <div
        ref={contentRef}
        className={`text-[#1a1a1a]/90 leading-relaxed space-y-4 overflow-hidden transition-all duration-700 ease-in-out transform-gpu ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-[200px] opacity-90'
        }`}
      >
        {description.split('\n\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
      
      <div className="relative">
        {!isExpanded && shouldShowButton && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>
      
      {shouldShowButton && (
        <div className="relative z-10 bg-white">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-4 px-4 py-2 text-[#1a1a1a] font-medium hover:bg-gray-50 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] flex items-center space-x-2 border border-gray-200 hover:border-gray-300 hover:shadow-sm"
          >
            <span>{isExpanded ? 'Show less' : 'Show more'}</span>
            <ChevronDown className={`w-4 h-4 transform transition-transform duration-500 ease-in-out ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}
    </div>
  );
};

const SectionDivider = () => (
  <div className="border-b border-gray-200 my-8" />
);

const AmenitiesSection: React.FC<AmenitiesSectionProps> = ({ 
  property, 
  onShowModal,
  onShowDrawer 
}) => {
  
  // Map amenity names (strings) to icon components
  const getIconForAmenity = (amenityName: string): React.ComponentType<{ className?: string }> => {
    const normalizedName = amenityName.toLowerCase().trim();
    
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      // Internet & Tech
      'wifi': Wifi,
      'wi-fi': Wifi,
      'wireless internet': Wifi,
      'internet': Wifi,
      'tv': Tv,
      'television': Tv,
      'smart tv': Tv2,
      'laptop': Laptop,
      'computer': Monitor,
      'desktop': Monitor,
      'printer': Printer,
      'phone': Phone,
      'smartphone': Smartphone,
      
      // Transportation
      'parking': Car,
      'free parking': Car,
      'garage': Car,
      'car': Car,
      'bike': Bike,
      'bicycle': Bike,
      'bicycles': Bike,
      
      // Kitchen & Dining
      'kitchen': Utensils,
      'fully equipped kitchen': Utensils,
      'coffee maker': Coffee,
      'coffee': Coffee,
      'microwave': Microwave,
      'refrigerator': Refrigerator,
      'fridge': Refrigerator,
      'stove': Flame,
      'oven': Flame,
      'dishwasher': Utensils,
      'dining area': Utensils,
      'restaurant': IoRestaurantOutline,
      'breakfast': MdFreeBreakfast,
      'free breakfast': MdFreeBreakfast,
      
      // Bathroom & Laundry
      'bath': Bath,
      'bathroom': Bath,
      'shower': Bath,
      'bathtub': PiBathtubLight,
      'washing machine': GiWashingMachine,
      'dryer': GiWashingMachine,
      'laundry': MdLocalLaundryService,
      'iron': Utensils,
      'hair dryer': PiHairDryerLight,
      
      // Bedroom & Living
      'bed': Bed,
      'bedroom': Bed,
      'sofa': Sofa,
      'couch': Sofa,
      'armchair': Armchair,
      'furniture': Sofa,
      
      // Outdoor & Recreation
      'pool': Waves,
      'swimming pool': LiaSwimmingPoolSolid,
      'hot tub': LiaHotTubSolid,
      'jacuzzi': LiaHotTubSolid,
      'beach': LiaUmbrellaBeachSolid,
      'beach access': MdBeachAccess,
      'bbq': GiBarbecue,
      'barbecue': GiBarbecue,
      'grill': GiBarbecue,
      'fireplace': GiFireplace,
      'balcony': MdBalcony,
      'patio': MdBalcony,
      'terrace': MdBalcony,
      'garden': TreePine,
      'yard': TreePine,
      'mountain view': Mountain,
      'ocean view': Waves,
      'view': Mountain,
      'hiking': GiHiking,
      'hiking trails': GiHiking,
      'golf course': GiGolfFlag,
      'golf': GiGolfFlag,
      'tennis': GiTennisRacket,
      'basketball': GiBasketballBall,
      'soccer': GiSoccerBall,
      'pool table': Gamepad2,
      'ping pong': Gamepad2,
      'table tennis': Gamepad2,
      'boating': GiBoatFishing,
      'fishing': GiBoatFishing,
      'water sports': GiBoatFishing,
      
      // Wellness & Spa
      'spa': MdOutlineSpa,
      'gym': Dumbbell,
      'fitness center': MdFitnessCenter,
      'workout': Dumbbell,
      'exercise': Dumbbell,
      'meditation': GiMeditation,
      'yoga': GiMeditation,
      
      // Climate Control
      'air conditioning': AirVent,
      'ac': AirVent,
      'heating': Flame,
      'fan': Fan,
      'ceiling fan': Fan,
      
      // Safety & Security
      'security': Shield,
      'safe': Lock,
      'lock': Lock,
      'smoke detector': Shield,
      'fire extinguisher': Shield,
      'first aid kit': PiFirstAidKitLight,
      
      // Pets & Family
      'pets allowed': MdPets,
      'pet friendly': MdPets,
      'pets': MdPets,
      'baby': Baby,
      'crib': Baby,
      'high chair': Baby,
      'child friendly': MdChildCare,
      'family friendly': MdChildCare,
      
      // Smoking
      'smoking allowed': MdSmokingRooms,
      'no smoking': Shield,
      'non-smoking': Shield,
      
      // Business & Work
      'workspace': Laptop,
      'dedicated workspace': Laptop,
      'desk': GiDesk,
      'business center': MdBusinessCenter,
      'wifi workspace': Laptop,
      
      // Entertainment
      'games': Gamepad2,
      'game console': Gamepad2,
      'board games': Gamepad2,
      'music': Music,
      'books': BookOpen,
      'library': IoLibraryOutline,
      'entertainment': Tv,
      
      // Accessibility
      'elevator': MdElevator,
      'wheelchair accessible': MdElevator,
      'accessible': MdElevator,
      
      // Other
      'key': Key,
      'self check-in': Key,
      'check-in': Key,
      'camera': Camera,
      'alarm': AlarmClock,
      'clock': Clock,
      'timer': Timer,
    };
    
    // Try exact match first
    if (iconMap[normalizedName]) {
      return iconMap[normalizedName];
    }
    
    // Try partial matches
    for (const [key, icon] of Object.entries(iconMap)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return icon;
      }
    }
    
    // Default fallback
    return Home;
  };

  const displayedAmenities = property.amenities.slice(0, 6);

  const handleShowAllAmenities = () => {
    // Use drawer for mobile, modal for desktop
    if (window.innerWidth < 768) {
      onShowDrawer();
    } else {
      onShowModal();
    }
  };

  return (
    <section id="amenities" className="py-6">
      <h2 className="text-2xl font-semibold text-[#1a1a1a]/90 mb-8">What this place offers</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedAmenities.map((amenity) => {
          // Handle both object format (with icon property) and string format (from database)
          const amenityName = typeof amenity === 'string' ? amenity : amenity.name;
          // Always use the amenity name to get the icon, not the icon property
          const IconComponent = getIconForAmenity(amenityName);
          
          return (
            <div key={typeof amenity === 'string' ? amenity : amenity.id} className="flex items-center space-x-3">
              <IconComponent className="w-5 h-5 text-[#1a1a1a]/90" />
              <span className="text-[#1a1a1a]/90">{amenityName}</span>
            </div>
          );
        })}
      </div>
      
      {property.amenities.length > 6 && (
        <div className="mt-8 text-left">
          <button
            onClick={handleShowAllAmenities}
            className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-[#1a1a1a]/90 hover:bg-gray-50 transition-colors font-medium"
          >
            Show all {property.amenities.length} amenities
          </button>
        </div>
      )}
    </section>
  );
};

interface AvailabilitySectionProps {
  property: Property;
  checkInDate: string;
  checkOutDate: string;
  onCheckInChange: (date: string) => void;
  onCheckOutChange: (date: string) => void;
}

const AvailabilitySection: React.FC<AvailabilitySectionProps> = ({ 
  property,
  checkInDate,
  checkOutDate,
  onCheckInChange,
  onCheckOutChange
}) => {
  // Initialize selectedMonth to show check-in month if available, otherwise current month
  const getInitialMonth = () => {
    if (checkInDate) {
      const checkIn = new Date(checkInDate);
      return new Date(checkIn.getFullYear(), checkIn.getMonth(), 1);
    }
    return new Date();
  };

  const [selectedMonth, setSelectedMonth] = useState(getInitialMonth());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Initialize selectedDates from props
  const [selectedDates, setSelectedDates] = useState<{start?: Date; end?: Date}>(() => ({
    start: checkInDate ? new Date(checkInDate) : undefined,
    end: checkOutDate ? new Date(checkOutDate) : undefined
  }));

  // Update selectedDates when props change
  useEffect(() => {
    setSelectedDates({
      start: checkInDate ? new Date(checkInDate) : undefined,
      end: checkOutDate ? new Date(checkOutDate) : undefined
    });
    // Update selectedMonth to show check-in month when it changes
    if (checkInDate) {
      const checkIn = new Date(checkInDate);
      setSelectedMonth(new Date(checkIn.getFullYear(), checkIn.getMonth(), 1));
    }
  }, [checkInDate, checkOutDate]);

  // Helper to normalize date to start of day for comparison
  const normalizeDate = (date: Date): Date => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  const handleMonthChange = (increment: number) => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + increment);
      return newDate;
    });
  };

  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      dayDate.setHours(0, 0, 0, 0);
      days.push(dayDate);
    }
    
    return days;
  };

  const handleDateClick = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const dateNormalized = normalizeDate(date);
    
    if (!selectedDates.start || (selectedDates.start && selectedDates.end)) {
      // Start new selection
      setSelectedDates({ start: date, end: undefined });
      onCheckInChange(dateString);
      onCheckOutChange('');
    } else {
      const startNormalized = normalizeDate(selectedDates.start);
      
      if (dateNormalized > startNormalized) {
        // Complete selection
        setSelectedDates(prev => ({ ...prev, end: date }));
        onCheckOutChange(dateString);
      } else if (dateNormalized < startNormalized) {
        // Start new selection from earlier date
        setSelectedDates({ start: date, end: undefined });
        onCheckInChange(dateString);
        onCheckOutChange('');
      } else {
        // Same date clicked, clear selection
        setSelectedDates({ start: date, end: undefined });
        onCheckInChange(dateString);
        onCheckOutChange('');
      }
    }
  };

  const isDateInRange = (date: Date) => {
    if (!selectedDates.start || !selectedDates.end) return false;
    const start = normalizeDate(selectedDates.start);
    const end = normalizeDate(selectedDates.end);
    const dateNormalized = normalizeDate(date);
    return dateNormalized > start && dateNormalized < end;
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDates.start) return false;
    const start = normalizeDate(selectedDates.start);
    const dateNormalized = normalizeDate(date);
    
    if (selectedDates.end) {
      const end = normalizeDate(selectedDates.end);
      return dateNormalized.getTime() === start.getTime() || 
             dateNormalized.getTime() === end.getTime();
    }
    return dateNormalized.getTime() === start.getTime();
  };

  const isDateDisabled = (date: Date) => {
    const dateNormalized = normalizeDate(date);
    const todayNormalized = normalizeDate(today);
    return dateNormalized < todayNormalized;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate nights
  const calculateNights = () => {
    if (checkInDate && checkOutDate) {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const diffTime = checkOut.getTime() - checkIn.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  const nights = calculateNights();
  const nextMonth = new Date(selectedMonth);
  nextMonth.setMonth(selectedMonth.getMonth() + 1);

  return (
    <section id="availability" className="py-6">
      {/* Header Section */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-[#1a1a1a]/90 mb-2">
          {nights > 0 
            ? `${nights} ${nights === 1 ? 'Night' : 'Nights'} in ${property.city}`
            : `Availability in ${property.city}`
          }
        </h2>
        {checkInDate && checkOutDate && (
          <p className="text-sm md:text-base text-gray-500">
            {new Date(checkInDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} to {new Date(checkOutDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </div>
      
      {/* Calendar Grid - Responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {[selectedMonth, nextMonth].map((month, offset) => {
          const days = generateCalendarDays(month);

          return (
            <div key={offset} className="space-y-3 md:space-y-4">
              {/* Month Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm md:text-base font-semibold text-gray-900">
                  {monthNames[month.getMonth()]} {month.getFullYear()}
                </h3>
                {offset === 0 && (
                  <button
                    onClick={() => handleMonthChange(-1)}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                )}
                {offset === 1 && (
                  <button
                    onClick={() => handleMonthChange(1)}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Next month"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                )}
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-0.5 md:gap-1 mb-2">
                {dayNames.map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-0.5 md:gap-1">
                {days.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${offset}-${index}`} className="h-8 md:h-10" />;
                  }
                  
                  const isDisabled = isDateDisabled(date);
                  const isSelected = isDateSelected(date);
                  const isInRange = isDateInRange(date);
                  
                  return (
                    <button
                      key={`${offset}-${date.getTime()}`}
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

      {/* Footer Info */}
      <div className="mt-6 md:mt-8 flex items-center space-x-2 text-sm text-[#1a1a1a]/70">
        <Calendar className="w-4 h-4" />
        <span>{property.minimumNights} nights minimum</span>
      </div>
    </section>
  );
};

// Main PropertyDetail Component
const PropertyDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id: propertyId } = useParams<{ id: string }>();
  
  // Shared date state
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  
  const [activeSection, setActiveSection] = useState('overview');
  
  // Fetch property from API
  const { property: propertyData, loading, error } = usePropertyWithImages(propertyId || '');
  
  // Fetch rating stats
  const { rating: ratingStats } = usePropertyRating(propertyId || '');
  
  // Get authenticated user
  const { user } = useAuth();
  
  // Fetch guest by email if user is logged in
  const { guest, refetch: refetchGuest } = useGuestByEmail(user?.email || '');
  const { getOrCreateGuest } = useGetOrCreateGuest();
  const { propertyIds: favoritePropertyIds, refetch: refetchFavorites } = useFavoritePropertyIds(guest?.id || null);
  const { toggleFavorite } = useToggleFavorite();
  const { success: showSuccess, error: showError } = useToast();
  
  const [showAmenitiesModal, setShowAmenitiesModal] = useState(false);
  const [showAmenitiesDrawer, setShowAmenitiesDrawer] = useState(false);
  const [checkInDate, setCheckInDate] = useState<string>(tomorrow.toISOString().split('T')[0]);
  const [checkOutDate, setCheckOutDate] = useState<string>(dayAfterTomorrow.toISOString().split('T')[0]);

  // Handle booking request success - navigate to confirmation page
  const handleBookingSuccess = (bookingId: string) => {
    navigate(`/booking-confirmation/${bookingId}`);
  };

  // Handle back navigation
  const handleBackClick = () => {
    navigate(ROUTES.PROPERTIES);
  };

  // Handle section navigation with smooth scrolling
  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle favorite toggle
  const handleFavoriteToggle = async () => {
    if (!propertyId) return;
    
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


  // Track scroll position to update active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['overview', 'amenities', 'availability', 'location', 'reviews', 'host'];
      const scrollPosition = window.scrollY + 100; // Offset for sticky header

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mobile booking bar positioning is now handled by CSS without JavaScript workarounds

  // Show loading state
  if (loading) {
    return (
      <>
        <SEO
          title="Property Details"
          description="Loading property details..."
          url={`/properties/${propertyId}`}
          noindex={true}
        />
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <PropertyLoader />
            <p className="text-[#1a1a1a]/70 mt-6 text-lg">Loading property details...</p>
          </div>
        </div>
      </>
    );
  }

  // Show error state
  if (error || !propertyData) {
    return (
      <>
        <SEO
          title="Property Not Found"
          description="The property you're looking for could not be found."
          url={`/properties/${propertyId}`}
          noindex={true}
        />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[#1a1a1a]/90 mb-2">Error loading property</h3>
            <p className="text-[#1a1a1a]/70 mb-4">{error || 'Property not found'}</p>
            <button
              onClick={() => navigate(ROUTES.PROPERTIES)}
              className="px-6 py-3 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#1a1a1a]/90 transition-colors font-medium"
            >
              Back to Properties
            </button>
          </div>
        </div>
      </>
    );
  }

  // Convert API data to Property format (propertyData is guaranteed to exist here)
  const baseProperty: Property = adaptPropertyForDetail({ ...propertyData, host_id: propertyData.host?.id || '' });
  
  // Update property with rating stats
  const property: Property = {
    ...baseProperty,
    rating: ratingStats.averageRating,
    reviewCount: ratingStats.totalReviews
  };

  // Handle share
  const handleShare = async () => {
    const shareData = {
      title: property.title,
      text: `Check out ${property.title} in ${property.city}, ${property.state}`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        showSuccess('Link copied to clipboard');
      }
    } catch (error) {
      // User cancelled or error occurred
      if (error instanceof Error && error.name !== 'AbortError') {
        // Only show error if it's not a user cancellation
        try {
          await navigator.clipboard.writeText(window.location.href);
          showSuccess('Link copied to clipboard');
        } catch {
          showError('Failed to share. Please try again.');
        }
      }
    }
  };

  // Generate SEO data
  const seoImage = property.images && property.images.length > 0 
    ? property.images[0].url 
    : '/images/default-property.jpg';
  
  const propertyStructuredData = generatePropertyStructuredData({
    id: property.id,
    title: property.title,
    description: property.description || `${property.title} in ${property.city}, ${property.state}`,
    pricePerNight: property.pricePerNight,
    images: property.images?.map(img => img.url) || [],
    address: property.address,
    city: property.city,
    country: property.country,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    guests: property.maxGuests,
    rating: property.rating,
    reviewCount: property.reviewCount,
  });

  return (
    <>
      <SEO
        title={property.title}
        description={property.description || `${property.title} - ${property.propertyType} in ${property.city}, ${property.state}. ${property.bedrooms} bedrooms, ${property.bathrooms} bathrooms. Book now!`}
        keywords={`${property.title}, ${property.city}, ${property.state}, vacation rental, ${property.propertyType}, ${property.bedrooms} bedrooms, booking`}
        image={seoImage}
        url={`/properties/${property.id}`}
        type="product"
        structuredData={propertyStructuredData}
      />
      {/* Modals/Drawers - Rendered at root level outside the main container */}
      <AmenitiesModal 
        property={property}
        isOpen={showAmenitiesModal}
        onClose={() => setShowAmenitiesModal(false)}
      />
      <AmenitiesDrawer 
        property={property}
        isOpen={showAmenitiesDrawer}
        onClose={() => setShowAmenitiesDrawer(false)}
      />
      
      <div className="relative min-h-screen bg-white">

        {/* Sticky Tab Bar - Hidden on mobile */}
        <StickyTabBar
          onBackClick={handleBackClick}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          onFavoriteClick={handleFavoriteToggle}
          onShareClick={handleShare}
          isFavorite={propertyId ? favoritePropertyIds.includes(propertyId) : false}
        />

        {/* Mobile Back Button - Only visible on mobile */}
      <div className="md:hidden sticky top-0 z-[100] bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 py-4 flex items-center justify-between">
            <button
              onClick={handleBackClick}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            
            {/* Share and Favorite Icons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleFavoriteToggle}
                className={`p-2 transition-colors ${
                  propertyId && favoritePropertyIds.includes(propertyId)
                    ? 'text-red-500 hover:text-red-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                aria-label={propertyId && favoritePropertyIds.includes(propertyId) ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart className={`w-5 h-5 ${propertyId && favoritePropertyIds.includes(propertyId) ? 'fill-red-500' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Share property"
              >
                <Share className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content with Desktop Sticky Layout */}
        <main className="pb-0 md:pb-0 bg-white relative">
          {/* Mobile Carousel - Outside container for full width */}
          <div className="md:hidden">
            <MobileCarousel property={property} />
          </div>
          
          {/* Mobile Property Info - Outside container, directly below carousel */}
          <div className="md:hidden px-4 sm:px-6 mt-4 max-w-2xl mx-auto">
            <h1 className="text-2xl font-semibold text-[#1a1a1a]/90 mb-3">{property.title}</h1>
            <h2 className="text-lg font-medium text-[#1a1a1a]/90 mb-2">{property.city}, {property.state}</h2>
            <div className="flex items-center space-x-4 text-[#1a1a1a]/80 mt-2">
              <div className="flex items-center text-xs sm:text-sm space-x-1">
                <IoBedOutline className="w-5 h-5 hidden sm:inline" />
                <span>{property.bedrooms} Bedrooms  ●</span>
              </div>
              <div className="flex items-center text-xs sm:text-sm space-x-1">
                <PiBathtubLight className="w-5 h-5 hidden sm:inline" />
                <span>{property.bathrooms} Bath  ●</span>
              </div>
              <div className="flex items-center text-xs sm:text-sm space-x-1"> 
                <GoPeople className="w-5 h-5 hidden sm:inline" />
                <span>{property.maxGuests} Max Guests</span>
              </div>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 relative">
            {/* Image Preview Section - Desktop only */}
            <div className="hidden md:block">
              <ImagePreviewSection property={property} />
            </div>
            
            {/* Content with Booking Card Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Main Content - Takes up 2/3 on desktop */}
              <div className="lg:col-span-2">
                <OverviewSection property={property} />
                <SectionDivider />
                <AmenitiesSection 
                  property={property}
                  onShowModal={() => setShowAmenitiesModal(true)}
                  onShowDrawer={() => setShowAmenitiesDrawer(true)}
                />
                <SectionDivider />
                <ThingsToKnowSection property={property} />
                <SectionDivider />
                <AvailabilitySection 
                  property={property}
                  checkInDate={checkInDate}
                  checkOutDate={checkOutDate}
                  onCheckInChange={setCheckInDate}
                  onCheckOutChange={setCheckOutDate}
                />
                <SectionDivider />
                <LocationSection property={property} />
                <SectionDivider />
                <ReviewsSection 
                  property={property} 
                  guestId={guest?.id || null}
                />
                <SectionDivider />
                <HostSection property={property} />
              </div>


              {/* Desktop Sticky Booking Card - Takes up 1/3 on desktop, hidden on mobile */}
              <div className="hidden lg:block lg:col-span-1">
                <div className="sticky top-32">
                  <BookingCard 
                    property={property}
                    checkInDate={checkInDate}
                    checkOutDate={checkOutDate}
                    onCheckInChange={setCheckInDate}
                    onCheckOutChange={setCheckOutDate}
                    onBookingSuccess={handleBookingSuccess}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile Sticky Booking Bar - Sticky positioning that scrolls with content */}
          <div className="md:hidden sticky bottom-0 z-[100] bg-white border-t border-gray-200 shadow-lg mt-8">
            <BookingCard 
              property={property} 
              isMobile={true}
              checkInDate={checkInDate}
              checkOutDate={checkOutDate}
              onCheckInChange={setCheckInDate}
              onCheckOutChange={setCheckOutDate}
              onBookingSuccess={handleBookingSuccess}
            />
          </div>
        </main>
    </div>
    <Footer />
    </>
  );
};

export default PropertyDetail;
