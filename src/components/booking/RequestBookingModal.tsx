import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, X } from 'lucide-react';
import { GoPeople } from 'react-icons/go';
import type { Property } from '../../types';
import { useCreateBooking, useAvailabilityCheck } from '../../hooks/useBookings';
import { useGetOrCreateGuest } from '../../hooks/useGuests';
import { sanitizeString, sanitizeEmail, sanitizePhone } from '../../utils/sanitize';
import { calculateBookingPricing } from '../../lib/utils/pricing';

export interface RequestBookingModalProps {
  property: Property;
  checkInDate: string;
  checkOutDate: string;
  guestCounts: {
    adults: number;
    children: number;
    infants: number;
    pets: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (bookingId: string) => void;
}

const RequestBookingModal: React.FC<RequestBookingModalProps> = ({
  property,
  checkInDate,
  checkOutDate,
  guestCounts,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const { createBooking, loading: bookingLoading } = useCreateBooking();
  const { getOrCreateGuest, loading: guestLoading } = useGetOrCreateGuest();
  const { checkAvailability } = useAvailabilityCheck();

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate nights
  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const diffTime = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();
  const totalGuests = guestCounts.adults + guestCounts.children + guestCounts.infants;

  // Calculate pricing using shared utility function
  const pricing = calculateBookingPricing({
    pricePerNight: property.pricePerNight,
    nights,
    cleaningFee: property.cleaningFee || 0,
    securityDeposit: property.securityDeposit || 0,
  });
  
  const { basePrice, cleaningFee, serviceFee, taxes, totalAmount } = pricing;
  
  // For database: include service fee in taxes to match database constraint
  // Database constraint: total_amount = base_price + cleaning_fee + taxes
  // So we combine serviceFee + taxes into the taxes field
  const taxesForDatabase = serviceFee + taxes;

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        message: ''
      });
      setErrors({});
    }
  }, [isOpen]);

  // Lock body scroll when modal is open and handle animation
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Trigger animation after a brief delay
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      document.body.style.overflow = '';
      setIsAnimating(false);
    }
    return () => {
      document.body.style.overflow = '';
      setIsAnimating(false);
    };
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Basic form validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!checkInDate) {
      newErrors.checkIn = 'Check-in date is required';
    }
    if (!checkOutDate) {
      newErrors.checkOut = 'Check-out date is required';
    }

    // Date validation
    if (checkInDate && checkOutDate) {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      checkIn.setHours(0, 0, 0, 0);
      checkOut.setHours(0, 0, 0, 0);

      // Check if dates are in the past
      if (checkIn < today) {
        newErrors.checkIn = 'Check-in date cannot be in the past';
      }
      if (checkOut < today) {
        newErrors.checkOut = 'Check-out date cannot be in the past';
      }

      // Check if check-out is after check-in
      if (checkOut <= checkIn) {
        newErrors.checkOut = 'Check-out date must be after check-in date';
      }

      // Minimum nights validation
      if (nights > 0 && property.minimumNights && nights < property.minimumNights) {
        newErrors.dates = `Minimum stay is ${property.minimumNights} ${property.minimumNights === 1 ? 'night' : 'nights'}`;
      }

      // Maximum nights validation
      if (nights > 0 && property.maximumNights && property.maximumNights > 0 && nights > property.maximumNights) {
        newErrors.dates = `Maximum stay is ${property.maximumNights} ${property.maximumNights === 1 ? 'night' : 'nights'}`;
      }
    }

    // Guest count validation
    if (totalGuests > property.maxGuests) {
      newErrors.guests = `Maximum ${property.maxGuests} ${property.maxGuests === 1 ? 'guest' : 'guests'} allowed`;
    }
    if (totalGuests < 1) {
      newErrors.guests = 'At least 1 guest is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      // Step 1: Check availability before proceeding
      setIsCheckingAvailability(true);
      try {
        const availability = await checkAvailability(property.id, checkInDate, checkOutDate);
        if (!availability.available) {
          setErrors({ 
            general: 'This property is not available for the selected dates. Please choose different dates.' 
          });
          setIsSubmitting(false);
          setIsCheckingAvailability(false);
          return;
        }
      } catch (availabilityError) {
        setErrors({ 
          general: 'Failed to check availability. Please try again.' 
        });
        setIsSubmitting(false);
        setIsCheckingAvailability(false);
        return;
      } finally {
        setIsCheckingAvailability(false);
      }

      // Step 2: Sanitize all inputs before sending
      const sanitizedEmail = sanitizeEmail(formData.email.trim());
      const sanitizedPhone = formData.phone.trim() ? sanitizePhone(formData.phone.trim()) : undefined;
      
      // Step 3: Get or create guest
      const guest = await getOrCreateGuest({
        email: sanitizedEmail,
        first_name: sanitizeString(formData.firstName.trim()),
        last_name: sanitizeString(formData.lastName.trim()),
        phone: sanitizedPhone,
      });

      if (!guest) {
        setErrors({ general: 'Failed to create guest profile. Please try again.' });
        setIsSubmitting(false);
        return;
      }

      // Step 4: Create booking request (status will be 'pending' by default)
      // Note: Database constraint requires total_amount = base_price + cleaning_fee + taxes
      // So we combine serviceFee + taxes into the taxes field for database storage
      const booking = await createBooking({
        property_id: property.id,
        guest_id: guest.id,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        guests_count: totalGuests,
        base_price: basePrice,
        cleaning_fee: cleaningFee,
        security_deposit: property.securityDeposit || 0,
        taxes: taxesForDatabase, // Includes service fee + taxes
        total_amount: totalAmount, // This matches: basePrice + cleaningFee + serviceFee + taxes
        special_requests: formData.message.trim() ? sanitizeString(formData.message.trim()) : undefined,
      });

      if (!booking) {
        setErrors({ general: 'Failed to submit booking request. Please try again.' });
        setIsSubmitting(false);
        return;
      }

      // Success! Pass booking ID to parent for navigation
      onSuccess(booking.id);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit booking request. Please try again.';
      setErrors({ general: errorMessage });
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return typeof document !== 'undefined' && createPortal(
    <div className={`fixed inset-0 z-[9999] ${isMobile ? '' : 'flex items-center justify-center p-4'}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 transition-opacity duration-300 ${
          isMobile 
            ? `bg-black/60 backdrop-blur-sm ${isAnimating ? 'opacity-100' : 'opacity-0'}` 
            : 'bg-black/50 backdrop-blur-sm'
        }`}
        onClick={onClose}
      />
      
      {/* Modal/Drawer Content */}
      <div className={`relative z-10 bg-white shadow-2xl w-full ${
        isMobile 
          ? `absolute left-0 right-0 bottom-0 rounded-t-[32px] flex flex-col transition-all duration-300 ease-out ${
              isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
            }` 
          : 'rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto'
      }`}
      style={isMobile ? { 
        height: '100vh',
        maxHeight: '100vh'
      } : {}}
      >
        {/* Mobile Header with Drag Handle */}
        {isMobile && (
          <div className="flex-shrink-0 pt-2.5 pb-2 px-4">
            <div className="flex justify-center mb-1.5">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1a1a1a]">Request Booking</h2>
              <button
                onClick={onClose}
                className="p-1.5 -mr-1.5 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors touch-manipulation"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <div className="sticky top-0 bg-white border-b border-gray-200 flex items-center justify-between z-10 flex-shrink-0 px-6 py-4">
            <h2 className="text-2xl font-bold text-[#1a1a1a]">Request Booking</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className={`flex flex-col ${isMobile ? 'flex-1 min-h-0' : ''}`}>
          {/* Scrollable Content Area */}
          <div className={`${isMobile ? 'flex-1 overflow-y-auto overscroll-contain min-h-0' : ''} ${
            isMobile ? 'px-4' : 'px-6 pt-6 pb-0'
          }`}
          style={isMobile ? {
            WebkitOverflowScrolling: 'touch',
            paddingBottom: '0.5rem'
          } : {}}
          >
            <div className={isMobile ? 'space-y-4 pt-1.5' : 'space-y-6 pb-0'}>
              {/* Booking Summary - Enhanced Design */}
              <div className={`bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl ${
                isMobile ? 'p-4' : 'p-5'
              } border border-gray-200/50 shadow-sm`}>
                <h3 className={`font-bold text-[#1a1a1a] mb-3 ${isMobile ? 'text-base' : 'text-xl'}`}>
                  {property.title}
                </h3>
                <div className={`${isMobile ? 'space-y-2.5' : 'space-y-3'}`}>
                  <div className="flex items-start space-x-2.5">
                    <div className={`mt-0.5 bg-white rounded-lg shadow-sm ${isMobile ? 'p-1.5' : 'p-2'}`}>
                      <Calendar className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-[#1a1a1a]`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} font-medium text-gray-500 uppercase tracking-wide mb-0.5`}>Dates</p>
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-900 leading-tight`}>
                        {checkInDate && new Date(checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {checkOutDate && new Date(checkOutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <div className={`mt-0.5 bg-white rounded-lg shadow-sm ${isMobile ? 'p-1.5' : 'p-2'}`}>
                      <GoPeople className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-[#1a1a1a]`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} font-medium text-gray-500 uppercase tracking-wide mb-0.5`}>Guests</p>
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-900 leading-tight`}>
                        {totalGuests} {totalGuests === 1 ? 'guest' : 'guests'}
                        {guestCounts.pets > 0 && <span className="text-gray-600"> • {guestCounts.pets} {guestCounts.pets === 1 ? 'pet' : 'pets'}</span>}
                      </p>
                    </div>
                  </div>
                  <div className={`${isMobile ? 'pt-2.5' : 'pt-3'} border-t border-gray-300/50`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} font-medium text-gray-500 uppercase tracking-wide mb-0.5`}>
                          Total ({nights} {nights === 1 ? 'night' : 'nights'})
                        </p>
                      </div>
                      <span className={`font-bold text-[#1a1a1a] ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'XOF',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Messages */}
              {errors.general && (
                <div className={`bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start space-x-2.5 ${
                  isMobile ? 'p-3 text-xs' : 'p-4 text-sm'
                } text-red-700`}>
                  <div className="flex-shrink-0 mt-0.5">
                    <X className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                  </div>
                  <p className="flex-1 leading-relaxed">{errors.general}</p>
                </div>
              )}
              {errors.dates && (
                <div className={`bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start space-x-2.5 ${
                  isMobile ? 'p-3 text-xs' : 'p-4 text-sm'
                } text-red-700`}>
                  <div className="flex-shrink-0 mt-0.5">
                    <X className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                  </div>
                  <p className="flex-1 leading-relaxed">{errors.dates}</p>
                </div>
              )}
              {errors.guests && (
                <div className={`bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start space-x-2.5 ${
                  isMobile ? 'p-3 text-xs' : 'p-4 text-sm'
                } text-red-700`}>
                  <div className="flex-shrink-0 mt-0.5">
                    <X className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                  </div>
                  <p className="flex-1 leading-relaxed">{errors.guests}</p>
                </div>
              )}
              {errors.checkOut && (
                <div className={`bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start space-x-2.5 ${
                  isMobile ? 'p-3 text-xs' : 'p-4 text-sm'
                } text-red-700`}>
                  <div className="flex-shrink-0 mt-0.5">
                    <X className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                  </div>
                  <p className="flex-1 leading-relaxed">{errors.checkOut}</p>
                </div>
              )}

              {/* Form Fields */}
              <div className={`grid ${isMobile ? 'gap-4' : 'gap-5'} ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <div>
                  <label className={`block font-semibold text-gray-900 mb-1.5 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={`w-full border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all ${
                      isMobile ? 'px-3 py-2.5 text-sm' : 'px-4 py-3.5'
                    } ${
                      errors.firstName ? 'border-red-300 bg-red-50/50' : 'border-gray-200 bg-white'
                    }`}
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className={`mt-1 text-red-600 font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className={`block font-semibold text-gray-900 mb-1.5 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={`w-full border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all ${
                      isMobile ? 'px-3 py-2.5 text-sm' : 'px-4 py-3.5'
                    } ${
                      errors.lastName ? 'border-red-300 bg-red-50/50' : 'border-gray-200 bg-white'
                    }`}
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className={`mt-1 text-red-600 font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label className={`block font-semibold text-gray-900 mb-1.5 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all ${
                    isMobile ? 'px-3 py-2.5 text-sm' : 'px-4 py-3.5'
                  } ${
                    errors.email ? 'border-red-300 bg-red-50/50' : 'border-gray-200 bg-white'
                  }`}
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className={`mt-1 text-red-600 font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>{errors.email}</p>
                )}
              </div>

              <div>
                <label className={`block font-semibold text-gray-900 mb-1.5 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  Phone Number <span className={`text-gray-500 font-normal ${isMobile ? 'text-[10px]' : 'text-xs'}`}>(optional)</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full border-2 border-gray-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all ${
                    isMobile ? 'px-3 py-2.5 text-sm' : 'px-4 py-3.5'
                  }`}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className={`block font-semibold text-gray-900 mb-1.5 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  Special Requests <span className={`text-gray-500 font-normal ${isMobile ? 'text-[10px]' : 'text-xs'}`}>(optional)</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={isMobile ? 3 : 4}
                  className={`w-full border-2 border-gray-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent resize-none transition-all ${
                    isMobile ? 'px-3 py-2.5 text-sm' : 'px-4 py-3.5'
                  }`}
                  placeholder="Any special requests or questions for the host?"
                />
              </div>
            </div>
          </div>

          {/* Submit Button - Sticky at bottom on mobile */}
          <div className={`flex-shrink-0 bg-white border-t border-gray-200 ${
            isMobile 
              ? 'pt-2 px-4' 
              : 'px-6 pt-4 pb-6'
          }`}
          style={isMobile ? {
            paddingBottom: `calc(1rem + env(safe-area-inset-bottom, 0px))`,
            boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)',
            position: 'sticky',
            bottom: 0
          } : {}}
          >
            <div className={`flex ${isMobile ? 'flex-col gap-2.5' : 'flex-row gap-3'}`}>
              {isMobile && (
                <button
                  type="button"
                  onClick={onClose}
                  className={`w-full border-2 border-gray-300 rounded-lg font-semibold text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation ${
                    isMobile ? 'px-4 py-3 text-sm' : 'px-6 py-4'
                  }`}
                  disabled={isSubmitting || bookingLoading || guestLoading || isCheckingAvailability}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className={`bg-[#1a1a1a] text-white rounded-lg font-semibold hover:bg-[#1a1a1a]/95 active:bg-[#1a1a1a] transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation shadow-lg ${
                  isMobile ? 'w-full px-4 py-3 text-sm' : 'flex-1 px-6 py-4'
                }`}
                disabled={isSubmitting || bookingLoading || guestLoading || isCheckingAvailability}
              >
                {isSubmitting || bookingLoading || guestLoading || isCheckingAvailability ? (
                  <span className="flex items-center justify-center space-x-2">
                    <span className={`border-2 border-white border-t-transparent rounded-full animate-spin ${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                    <span>{isCheckingAvailability ? 'Checking availability...' : 'Submitting...'}</span>
                  </span>
                ) : (
                  'Submit Request'
                )}
              </button>
              {!isMobile && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting || bookingLoading || guestLoading || isCheckingAvailability}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default RequestBookingModal;

