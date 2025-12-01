import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Star, X, CheckCircle } from 'lucide-react';
import type { Property } from '../../types';
import { useCreateReview } from '../../hooks/useReviews';
import { sanitizeString } from '../../utils/sanitize';

export interface ReviewFormProps {
  property: Property;
  bookingId: string;
  guestId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  property,
  bookingId,
  guestId,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    comment: '',
    cleanliness_rating: 0,
    communication_rating: 0,
    location_rating: 0,
    value_rating: 0
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { createReview, loading: reviewLoading } = useCreateReview();

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        rating: 0,
        title: '',
        comment: '',
        cleanliness_rating: 0,
        communication_rating: 0,
        location_rating: 0,
        value_rating: 0
      });
      setErrors({});
      setHoveredRating(0);
      setShowSuccess(false);
    }
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
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

    if (formData.rating === 0) {
      newErrors.rating = 'Please provide a rating';
    }
    if (!formData.comment.trim()) {
      newErrors.comment = 'Please share your experience';
    } else if (formData.comment.trim().length < 10) {
      newErrors.comment = 'Please provide at least 10 characters';
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
      // Sanitize all text inputs before sending
      const sanitizedTitle = formData.title.trim() ? sanitizeString(formData.title.trim()) : undefined;
      const sanitizedComment = sanitizeString(formData.comment.trim());
      
      await createReview({
        booking_id: bookingId,
        property_id: property.id,
        guest_id: guestId,
        rating: formData.rating,
        title: sanitizedTitle,
        comment: sanitizedComment,
        cleanliness_rating: formData.cleanliness_rating > 0 ? formData.cleanliness_rating : undefined,
        communication_rating: formData.communication_rating > 0 ? formData.communication_rating : undefined,
        location_rating: formData.location_rating > 0 ? formData.location_rating : undefined,
        value_rating: formData.value_rating > 0 ? formData.value_rating : undefined
      });

      setShowSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit review. Please try again.';
      setErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = (
    rating: number,
    onRatingChange: (rating: number) => void,
    hovered: number,
    onHover: (rating: number) => void,
    label: string,
    error?: string
  ) => {
    const displayRating = hovered || rating;

    return (
      <div>
        <label className={`block font-semibold text-gray-900 mb-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          {label} {label === 'Overall Rating' && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onRatingChange(star)}
              onMouseEnter={() => onHover(star)}
              onMouseLeave={() => onHover(0)}
              className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7'} ${
                  star <= displayRating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-200'
                } transition-colors`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className={`ml-2 text-gray-600 font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {rating}/5
            </span>
          )}
        </div>
        {error && (
          <p className={`mt-1 text-red-600 font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>{error}</p>
        )}
      </div>
    );
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
      <div
        className={`relative z-10 bg-white shadow-2xl w-full ${
          isMobile
            ? `absolute left-0 right-0 bottom-0 rounded-t-[32px] flex flex-col transition-all duration-300 ease-out ${
                isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
              }`
            : 'rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto'
        }`}
        style={isMobile ? { height: '100vh', maxHeight: '100vh' } : {}}
      >
        {/* Mobile Header */}
        {isMobile && (
          <div className="flex-shrink-0 pt-2.5 pb-2 px-4">
            <div className="flex justify-center mb-1.5">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1a1a1a]">Write a Review</h2>
              <button
                onClick={onClose}
                className="p-1.5 -mr-1.5 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors"
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
            <h2 className="text-2xl font-bold text-[#1a1a1a]">Write a Review</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Thank you!</h3>
              <p className="text-gray-600">Your review has been submitted successfully.</p>
            </div>
          </div>
        )}

        {!showSuccess && (
          <form onSubmit={handleSubmit} className={`flex flex-col ${isMobile ? 'flex-1 min-h-0' : ''}`}>
            {/* Scrollable Content */}
            <div
              className={`${isMobile ? 'flex-1 overflow-y-auto overscroll-contain min-h-0' : ''} ${
                isMobile ? 'px-4' : 'px-6 pt-6 pb-0'
              }`}
              style={isMobile ? { WebkitOverflowScrolling: 'touch', paddingBottom: '0.5rem' } : {}}
            >
              <div className={isMobile ? 'space-y-5 pt-1.5' : 'space-y-6 pb-0'}>
                {/* Property Info */}
                <div className={`bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl ${
                  isMobile ? 'p-4' : 'p-5'
                } border border-gray-200/50`}>
                  <h3 className={`font-bold text-[#1a1a1a] ${isMobile ? 'text-base' : 'text-lg'}`}>
                    {property.title}
                  </h3>
                  <p className={`text-gray-600 ${isMobile ? 'text-xs mt-1' : 'text-sm mt-1'}`}>
                    {property.city}, {property.state}
                  </p>
                </div>

                {/* Error Message */}
                {errors.general && (
                  <div
                    className={`bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start space-x-2.5 ${
                      isMobile ? 'p-3 text-xs' : 'p-4 text-sm'
                    } text-red-700`}
                  >
                    <X className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} flex-shrink-0 mt-0.5`} />
                    <p className="flex-1 leading-relaxed">{errors.general}</p>
                  </div>
                )}

                {/* Overall Rating */}
                {renderStarRating(
                  formData.rating,
                  (rating) => setFormData({ ...formData, rating }),
                  hoveredRating,
                  setHoveredRating,
                  'Overall Rating',
                  errors.rating
                )}

                {/* Title */}
                <div>
                  <label className={`block font-semibold text-gray-900 mb-1.5 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    Review Title <span className={`text-gray-500 font-normal ${isMobile ? 'text-[10px]' : 'text-xs'}`}>(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`w-full border-2 border-gray-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all ${
                      isMobile ? 'px-3 py-2.5 text-sm' : 'px-4 py-3.5'
                    }`}
                    placeholder="Summarize your visit or highlight what you liked"
                    maxLength={255}
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className={`block font-semibold text-gray-900 mb-1.5 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    Your Review <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    rows={isMobile ? 5 : 6}
                    className={`w-full border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent resize-none transition-all ${
                      isMobile ? 'px-3 py-2.5 text-sm' : 'px-4 py-3.5'
                    } ${
                      errors.comment ? 'border-red-300 bg-red-50/50' : 'border-gray-200 bg-white'
                    }`}
                    placeholder="Share details about your experience, what you enjoyed, and any helpful tips for other guests..."
                  />
                  {errors.comment && (
                    <p className={`mt-1 text-red-600 font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      {errors.comment}
                    </p>
                  )}
                  <p className={`mt-1 text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    {formData.comment.length} characters (minimum 10)
                  </p>
                </div>

                {/* Detailed Ratings (Optional) */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className={`font-semibold text-gray-900 mb-4 ${isMobile ? 'text-sm' : 'text-base'}`}>
                    Additional Ratings <span className={`text-gray-500 font-normal ${isMobile ? 'text-xs' : 'text-sm'}`}>(optional)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {renderStarRating(
                      formData.cleanliness_rating,
                      (rating) => setFormData({ ...formData, cleanliness_rating: rating }),
                      0,
                      () => {},
                      'Cleanliness'
                    )}
                    {renderStarRating(
                      formData.communication_rating,
                      (rating) => setFormData({ ...formData, communication_rating: rating }),
                      0,
                      () => {},
                      'Communication'
                    )}
                    {renderStarRating(
                      formData.location_rating,
                      (rating) => setFormData({ ...formData, location_rating: rating }),
                      0,
                      () => {},
                      'Location'
                    )}
                    {renderStarRating(
                      formData.value_rating,
                      (rating) => setFormData({ ...formData, value_rating: rating }),
                      0,
                      () => {},
                      'Value'
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button - Sticky at bottom on mobile */}
            <div
              className={`flex-shrink-0 bg-white border-t border-gray-200 ${
                isMobile ? 'pt-2 px-4' : 'px-6 pt-4 pb-6'
              }`}
              style={
                isMobile
                  ? {
                      paddingBottom: `calc(1rem + env(safe-area-inset-bottom, 0px))`,
                      boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)',
                      position: 'sticky',
                      bottom: 0
                    }
                  : {}
              }
            >
              <div className={`flex ${isMobile ? 'flex-col gap-2.5' : 'flex-row gap-3'}`}>
                {isMobile && (
                  <button
                    type="button"
                    onClick={onClose}
                    className={`w-full border-2 border-gray-300 rounded-lg font-semibold text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                      isMobile ? 'px-4 py-3 text-sm' : 'px-6 py-4'
                    }`}
                    disabled={isSubmitting || reviewLoading}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className={`bg-[#1a1a1a] text-white rounded-lg font-semibold hover:bg-[#1a1a1a]/95 active:bg-[#1a1a1a] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    isMobile ? 'w-full px-4 py-3 text-sm' : 'flex-1 px-6 py-4'
                  }`}
                  disabled={isSubmitting || reviewLoading}
                >
                  {isSubmitting || reviewLoading ? (
                    <span className="flex items-center justify-center space-x-2">
                      <span className={`border-2 border-white border-t-transparent rounded-full animate-spin ${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                      <span>Submitting...</span>
                    </span>
                  ) : (
                    'Submit Review'
                  )}
                </button>
                {!isMobile && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={isSubmitting || reviewLoading}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ReviewForm;

