import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Wifi, Car, Coffee, Utensils, Dumbbell, Waves, Mountain, Shield, Home } from 'lucide-react';
import { GiBarbecue, GiGolfFlag, GiMeditation, GiHiking, GiBoatFishing, GiFireplace } from "react-icons/gi";
import { LiaHotTubSolid } from "react-icons/lia";
import { MdOutlineSpa } from "react-icons/md";
import type { Property } from '../../types';

interface AmenitiesModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
}

const AmenitiesModal: React.FC<AmenitiesModalProps> = ({ property, isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when modal is open and handle escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      // Focus the modal when it opens
      if (modalRef.current) {
        modalRef.current.focus();
      }
      
      // Handle escape key
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

  const getIcon = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      wifi: Wifi,
      car: Car,
      utensils: Utensils,
      coffee: Coffee,
      dumbbell: Dumbbell,
      waves: Waves,
      mountain: Mountain,
      shield: Shield,
      fireplace: GiFireplace,
      hotTub: LiaHotTubSolid,
      bbq: GiBarbecue,
      golfCourse: GiGolfFlag,
      spa: MdOutlineSpa,
      meditation: GiMeditation,
      hiking: GiHiking,
      boating: GiBoatFishing,
    };
    return iconMap[iconName] || Home;
  };

  if (!isOpen) return null;

  // Portal the modal to the body to avoid any stacking context issues
  return createPortal(
    <div 
      className={`fixed inset-0 z-[9999] overflow-hidden ${isOpen ? 'animate-fade-in' : ''}`}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose} // Close when clicking the outer container
    >
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/30 backdrop-blur-[1px] transition-opacity duration-300 ease-in-out
          ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 sm:items-center sm:p-0">
          {/* Modal Panel */}
          <div
            ref={modalRef}
            className={`relative transform overflow-hidden rounded-2xl bg-white text-left shadow-lg 
              transition-all duration-300 ease-out sm:my-8 sm:w-full sm:max-w-2xl
              ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}
            onClick={(e) => e.stopPropagation()} // Prevent clicks inside modal from closing it
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200
                transition-colors duration-200"
              aria-label="Close modal"
            >
              <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="px-6 py-4 ">
              <h2 
                id="modal-title"
                className="text-2xl font-semibold text-black"
              >
                What this place offers
              </h2>
            </div>

            {/* Content */}
            <div className="max-h-[calc(100vh-16rem)] overflow-y-auto px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {property.amenities.map((amenity) => {
                  const IconComponent = getIcon(amenity.icon || 'home');
                  return (
                    <div 
                      key={amenity.id} 
                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <IconComponent className="h-5 w-5 text-black flex-shrink-0" />
                      <span className="text-black/80">{amenity.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AmenitiesModal;