import React, { useState } from 'react';
import { Star, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';
import { useReviews, useCanGuestReview } from '../../hooks/useReviews';
import { ReviewForm } from '../reviews';
import type { Property } from '../../types';

interface ReviewsSectionProps {
  property: Property;
  guestId?: string | null; // Optional: pass guestId if user is logged in
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ property, guestId = null }) => {
  const { reviews, loading, error, refetch: refetchReviews } = useReviews(property.id);
  const { canReview, loading: canReviewLoading } = useCanGuestReview(property.id, guestId);
  const [showAll, setShowAll] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  // Show first 6 reviews by default
  const displayedReviews = showAll ? reviews : reviews.slice(0, 6);
  const hasMoreReviews = reviews.length > 6;

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Get guest initials
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <section id="reviews" className="py-6">
        <h2 className="text-2xl font-semibold text-[#1a1a1a]/90 mb-8">Reviews</h2>
        <div className="text-center py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="reviews" className="py-6">
        <h2 className="text-2xl font-semibold text-[#1a1a1a]/90 mb-8">Reviews</h2>
        <div className="text-center py-12">
          <p className="text-gray-600">Unable to load reviews. Please try again later.</p>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return (
      <section id="reviews" className="py-6">
        <h2 className="text-2xl font-semibold text-[#1a1a1a]/90 mb-8">Reviews</h2>
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">No reviews yet</p>
          <p className="text-gray-500 text-sm">Be the first to review this property!</p>
        </div>
      </section>
    );
  }

  const handleReviewSuccess = () => {
    refetchReviews();
    // Optionally refetch property rating stats here
  };

  return (
    <section id="reviews" className="py-6">
      {/* Header with rating summary */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-semibold text-[#1a1a1a]/90">
              {property.rating > 0 ? (
                <>
                  <Star className="w-6 h-6 fill-yellow-400 text-yellow-400 inline-block mr-2" />
                  {property.rating.toFixed(1)}
                </>
              ) : (
                'Reviews'
              )}
            </h2>
            {property.reviewCount > 0 && (
              <span className="text-gray-600">
                ({property.reviewCount} {property.reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            )}
          </div>
          
          {/* Write Review Button - Show if guest can review */}
          {guestId && !canReviewLoading && canReview?.canReview && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#1a1a1a]/90 transition-colors font-medium text-sm"
            >
              <Edit3 className="w-4 h-4" />
              <span>Write a Review</span>
            </button>
          )}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-8">
        {displayedReviews.map((review) => {
          const guest = review.guest;
          const guestName = guest ? `${guest.first_name} ${guest.last_name}` : 'Anonymous';
          const guestInitials = guest ? getInitials(guest.first_name, guest.last_name) : 'A';

          return (
            <div key={review.id} className="border-b border-gray-200 pb-8 last:border-b-0 last:pb-0">
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  {/* Guest Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    {guest?.profile_image_url ? (
                      <img
                        src={guest.profile_image_url}
                        alt={guestName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 font-medium text-sm">
                        {guestInitials}
                      </span>
                    )}
                  </div>

                  {/* Guest Info */}
                  <div>
                    <h4 className="font-semibold text-[#1a1a1a]/90">{guestName}</h4>
                    <p className="text-sm text-gray-500">{formatDate(review.created_at)}</p>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center space-x-2">
                  {renderStars(review.rating)}
                </div>
              </div>

              {/* Review Title */}
              {review.title && (
                <h5 className="font-medium text-[#1a1a1a]/90 mb-2">{review.title}</h5>
              )}

              {/* Review Comment */}
              {review.comment && (
                <p className="text-[#1a1a1a]/80 leading-relaxed whitespace-pre-wrap">
                  {review.comment}
                </p>
              )}

              {/* Detailed Ratings (if available) */}
              {(review.cleanliness_rating ||
                review.communication_rating ||
                review.location_rating ||
                review.value_rating) && (
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  {review.cleanliness_rating && (
                    <div>
                      <span className="text-gray-600">Cleanliness: </span>
                      <span className="font-medium">{review.cleanliness_rating}/5</span>
                    </div>
                  )}
                  {review.communication_rating && (
                    <div>
                      <span className="text-gray-600">Communication: </span>
                      <span className="font-medium">{review.communication_rating}/5</span>
                    </div>
                  )}
                  {review.location_rating && (
                    <div>
                      <span className="text-gray-600">Location: </span>
                      <span className="font-medium">{review.location_rating}/5</span>
                    </div>
                  )}
                  {review.value_rating && (
                    <div>
                      <span className="text-gray-600">Value: </span>
                      <span className="font-medium">{review.value_rating}/5</span>
                    </div>
                  )}
                </div>
              )}

              {/* Host Response */}
              {review.host_response && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border-l-4 border-[#1a1a1a]">
                  <p className="text-sm font-medium text-[#1a1a1a]/90 mb-1">Host Response</p>
                  <p className="text-sm text-[#1a1a1a]/80 whitespace-pre-wrap">
                    {review.host_response}
                  </p>
                  {review.host_response_at && (
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDate(review.host_response_at)}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show More/Less Button */}
      {hasMoreReviews && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-[#1a1a1a]/90 hover:bg-gray-50 transition-colors font-medium flex items-center space-x-2 mx-auto"
          >
            <span>{showAll ? 'Show less' : `Show all ${reviews.length} reviews`}</span>
            {showAll ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      )}

      {/* Review Form Modal */}
      {guestId && canReview?.canReview && canReview.bookingId && (
        <ReviewForm
          property={property}
          bookingId={canReview.bookingId}
          guestId={guestId}
          isOpen={showReviewForm}
          onClose={() => setShowReviewForm(false)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </section>
  );
};

export default ReviewsSection;

