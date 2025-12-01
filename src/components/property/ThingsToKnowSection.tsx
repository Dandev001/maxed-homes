import React, { useState, useEffect } from 'react';
import { Calendar, Key, Shield } from 'lucide-react';
import type { Property } from '../../types';
import ThingsToKnowModal from './ThingsToKnowModal';
import ThingsToKnowDrawer from './ThingsToKnowDrawer';

type ThingsToKnowType = 'cancellation' | 'house-rules' | 'safety' | null;

interface ThingsToKnowSectionProps {
  property: Property;
}

const ThingsToKnowSection: React.FC<ThingsToKnowSectionProps> = ({ property }) => {
  const [openType, setOpenType] = useState<ThingsToKnowType>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLearnMore = (type: 'cancellation' | 'house-rules' | 'safety') => {
    setOpenType(type);
  };

  const handleClose = () => {
    setOpenType(null);
  };
  // Format house rules for display
  const formatHouseRules = () => {
    const formattedRules: string[] = [];
    
    // Extract check-in/check-out times if they exist
    if (property.checkInTime) {
      const checkIn = new Date(`2000-01-01T${property.checkInTime}`).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      formattedRules.push(`Check-in after ${checkIn}`);
    }
    
    if (property.checkOutTime) {
      const checkOut = new Date(`2000-01-01T${property.checkOutTime}`).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      formattedRules.push(`Checkout before ${checkOut}`);
    }
    
    // Add max guests if available
    if (property.maxGuests) {
      formattedRules.push(`${property.maxGuests} ${property.maxGuests === 1 ? 'guest' : 'guests'} maximum`);
    }
    
    // Add other rules from house_rules field if they exist
    if (property.houseRules) {
      const rules = property.houseRules.split('\n').filter(rule => rule.trim());
      rules.forEach(rule => {
        if (!rule.toLowerCase().includes('check-in') && 
            !rule.toLowerCase().includes('checkout') && 
            !rule.toLowerCase().includes('check out') &&
            !rule.toLowerCase().includes('guest')) {
          formattedRules.push(rule);
        }
      });
    }
    
    return formattedRules.length > 0 ? formattedRules.join(' ') : 'No specific house rules';
  };

  const houseRulesText = formatHouseRules();

  // Format safety & property info
  const formatSafetyProperty = () => {
    if (!property.safetyProperty) {
      // Default safety items if none provided
      return 'Carbon monoxide alarm\nSmoke alarm\nNot suitable for children and infants';
    }
    return property.safetyProperty;
  };

  const safetyPropertyText = formatSafetyProperty();

  // Format cancellation policy
  const formatCancellationPolicy = () => {
    if (!property.cancellationPolicy) {
      // Default cancellation policy if none provided
      return 'Free cancellation before check-in. Cancel before check-in for a partial refund. Review this host\'s full policy for details.';
    }
    return property.cancellationPolicy;
  };

  const cancellationPolicyText = formatCancellationPolicy();

  return (
    <section className="py-6 md:py-8">
      <h2 className="text-2xl font-semibold text-[#1a1a1a]/90 mb-6 md:mb-8">Things to know</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {/* Cancellation Policy */}
        <div className="flex flex-col">
          <div className="flex items-center mb-3 md:mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mr-3 md:mr-4">
              <Calendar className="w-5 h-5 md:w-6 md:h-6 text-[#1a1a1a]/90" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-[#1a1a1a]/90">Cancellation policy</h3>
          </div>
          <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-3 md:mb-4">
            {cancellationPolicyText}
          </p>
          <button 
            onClick={() => handleLearnMore('cancellation')}
            className="text-sm md:text-base text-[#1a1a1a]/90 font-medium underline hover:text-[#1a1a1a]/70 transition-colors text-left self-start"
          >
            Learn more
          </button>
        </div>

        {/* House Rules */}
        <div className="flex flex-col">
          <div className="flex items-center mb-3 md:mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mr-3 md:mr-4">
              <Key className="w-5 h-5 md:w-6 md:h-6 text-[#1a1a1a]/90" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-[#1a1a1a]/90">House rules</h3>
          </div>
          <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-3 md:mb-4 whitespace-pre-line">
            {houseRulesText}
          </p>
          <button 
            onClick={() => handleLearnMore('house-rules')}
            className="text-sm md:text-base text-[#1a1a1a]/90 font-medium underline hover:text-[#1a1a1a]/70 transition-colors text-left self-start"
          >
            Learn more
          </button>
        </div>

        {/* Safety & Property */}
        <div className="flex flex-col">
          <div className="flex items-center mb-3 md:mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mr-3 md:mr-4">
              <Shield className="w-5 h-5 md:w-6 md:h-6 text-[#1a1a1a]/90" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-[#1a1a1a]/90">Safety & property</h3>
          </div>
          <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-3 md:mb-4 whitespace-pre-line">
            {safetyPropertyText}
          </p>
          <button 
            onClick={() => handleLearnMore('safety')}
            className="text-sm md:text-base text-[#1a1a1a]/90 font-medium underline hover:text-[#1a1a1a]/70 transition-colors text-left self-start"
          >
            Learn more
          </button>
        </div>
      </div>

      {/* Modal for Desktop */}
      {!isMobile && openType && (
        <ThingsToKnowModal
          property={property}
          type={openType}
          isOpen={!!openType}
          onClose={handleClose}
        />
      )}

      {/* Drawer for Mobile */}
      {isMobile && openType && (
        <ThingsToKnowDrawer
          property={property}
          type={openType}
          isOpen={!!openType}
          onClose={handleClose}
        />
      )}
    </section>
  );
};

export default ThingsToKnowSection;

