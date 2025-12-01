import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Key, Shield, X } from 'lucide-react';
import type { Property } from '../../types';

type ThingsToKnowType = 'cancellation' | 'house-rules' | 'safety';

interface ThingsToKnowModalProps {
  property: Property;
  type: ThingsToKnowType;
  isOpen: boolean;
  onClose: () => void;
}

const ThingsToKnowModal: React.FC<ThingsToKnowModalProps> = ({ 
  property, 
  type, 
  isOpen, 
  onClose 
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when modal is open and handle escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      if (modalRef.current) {
        modalRef.current.focus();
      }
      
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEscape);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, onClose]);

  const getContent = () => {
    switch (type) {
      case 'cancellation':
        return {
          title: 'Cancellation policy',
          icon: Calendar,
          description: property.cancellationPolicy || 'Free cancellation before check-in. Cancel before check-in for a partial refund. Review this host\'s full policy for details.',
          explanation: `Cancellation policies outline the terms and conditions for canceling your reservation. This includes information about refund eligibility, cancellation deadlines, and any fees that may apply. Understanding the cancellation policy helps you make informed decisions about your booking and know what to expect if your plans change.`
        };
      case 'house-rules':
        return {
          title: 'House rules',
          icon: Key,
          description: (() => {
            const rules: string[] = [];
            if (property.checkInTime) {
              const checkIn = new Date(`2000-01-01T${property.checkInTime}`).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              });
              rules.push(`Check-in after ${checkIn}`);
            }
            if (property.checkOutTime) {
              const checkOut = new Date(`2000-01-01T${property.checkOutTime}`).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              });
              rules.push(`Checkout before ${checkOut}`);
            }
            if (property.maxGuests) {
              rules.push(`${property.maxGuests} ${property.maxGuests === 1 ? 'guest' : 'guests'} maximum`);
            }
            if (property.houseRules) {
              const additionalRules = property.houseRules.split('\n').filter(rule => rule.trim());
              rules.push(...additionalRules);
            }
            return rules.length > 0 ? rules.join('\n') : 'No specific house rules';
          })(),
          explanation: `House rules are guidelines set by the host to ensure a comfortable and respectful stay for all guests. These rules typically cover check-in and check-out times, maximum guest capacity, noise levels, smoking policies, pet policies, and other important guidelines. Following these rules helps maintain a positive experience for everyone and ensures the property remains in good condition for future guests.`
        };
      case 'safety':
        return {
          title: 'Safety & property',
          icon: Shield,
          description: property.safetyProperty || 'Carbon monoxide alarm\nSmoke alarm\nNot suitable for children and infants',
          explanation: `Safety and property information provides details about safety features, equipment, and any important considerations for your stay. This may include information about smoke detectors, carbon monoxide alarms, first aid kits, child safety features, accessibility considerations, and any potential hazards. This information helps you prepare appropriately for your stay and ensures the safety of all guests.`
        };
      default:
        return {
          title: '',
          icon: Shield,
          description: '',
          explanation: ''
        };
    }
  };

  const content = getContent();
  const IconComponent = content.icon;

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] overflow-hidden"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-[1px] transition-opacity duration-300 ease-in-out opacity-100"
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
          {/* Modal Panel */}
          <div
            ref={modalRef}
            className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-lg 
              transition-all duration-300 ease-out w-full max-w-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200
                transition-colors duration-200 z-10"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>

            {/* Header */}
            <div className="px-6 py-6 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <IconComponent className="w-6 h-6 text-[#1a1a1a]/90" />
                </div>
                <h2 
                  id="modal-title"
                  className="text-2xl font-semibold text-[#1a1a1a]/90"
                >
                  {content.title}
                </h2>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Current Policy/Rules */}
              <div>
                <h3 className="text-lg font-semibold text-[#1a1a1a]/90 mb-3">Current policy</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-[#1a1a1a]/80 whitespace-pre-line leading-relaxed">
                    {content.description}
                  </p>
                </div>
              </div>

              {/* Explanation */}
              <div>
                <h3 className="text-lg font-semibold text-[#1a1a1a]/90 mb-3">What this means</h3>
                <p className="text-[#1a1a1a]/70 leading-relaxed">
                  {content.explanation}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ThingsToKnowModal;

