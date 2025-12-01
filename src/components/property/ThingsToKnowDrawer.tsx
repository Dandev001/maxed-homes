import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Key, Shield, X } from 'lucide-react';
import type { Property } from '../../types';

type ThingsToKnowType = 'cancellation' | 'house-rules' | 'safety';

interface ThingsToKnowDrawerProps {
  property: Property;
  type: ThingsToKnowType;
  isOpen: boolean;
  onClose: () => void;
}

const ThingsToKnowDrawer: React.FC<ThingsToKnowDrawerProps> = ({ 
  property, 
  type, 
  isOpen, 
  onClose 
}) => {
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
    }
    
    return () => {
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [isOpen]);

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

  const drawerContent = (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={`
          absolute bottom-0 inset-x-0
          bg-white rounded-t-2xl
          transform transition-transform duration-300
          flex flex-col
          shadow-xl
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{ maxHeight: '90vh' }}
      >
        {/* Handle */}
        <div className="sticky top-0 bg-white pt-3 pb-2 rounded-t-2xl z-10">
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto" />
        </div>

        {/* Header */}
        <div className="sticky top-8 bg-white px-4 py-4 border-b border-gray-200 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <IconComponent className="w-5 h-5 text-[#1a1a1a]/90" />
            </div>
            <h3 className="text-xl font-semibold text-[#1a1a1a]/90">{content.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-4 py-6 space-y-6">
            {/* Current Policy/Rules */}
            <div>
              <h4 className="text-base font-semibold text-[#1a1a1a]/90 mb-3">Current policy</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-[#1a1a1a]/80 whitespace-pre-line leading-relaxed text-sm">
                  {content.description}
                </p>
              </div>
            </div>

            {/* Explanation */}
            <div>
              <h4 className="text-base font-semibold text-[#1a1a1a]/90 mb-3">What this means</h4>
              <p className="text-[#1a1a1a]/70 leading-relaxed text-sm">
                {content.explanation}
              </p>
            </div>
            
            <div className="h-8" /> {/* Bottom spacing */}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
};

export default ThingsToKnowDrawer;

