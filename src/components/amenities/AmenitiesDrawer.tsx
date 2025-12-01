import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Wifi, Car, Coffee, Utensils, Dumbbell, Waves, Mountain, Shield, Home, X } from 'lucide-react';
import { GiBarbecue, GiGolfFlag, GiMeditation, GiHiking, GiBoatFishing, GiFireplace } from "react-icons/gi";
import { LiaHotTubSolid } from "react-icons/lia";
import { MdOutlineSpa } from "react-icons/md";
import type { Property } from '../../types';

interface AmenitiesDrawerProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
}

const AmenitiesDrawer: React.FC<AmenitiesDrawerProps> = ({ property, isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      // Store the current scroll position and lock the body
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;
    } else {
      // Restore the scroll position when drawer closes
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
    }
    
    return () => {
      // Cleanup
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [isOpen]);

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
        style={{ maxHeight: '85vh' }}
      >
        {/* Handle */}
        <div className="sticky top-0 bg-white pt-3 pb-2 rounded-t-2xl">
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto" />
        </div>

        {/* Header */}
        <div className="sticky top-8 bg-white px-4 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xl font-semibold">What this place offers</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-4 py-4 space-y-4">
            {property.amenities.map((amenity) => {
              const IconComponent = getIcon(amenity.icon || 'home');
              return (
                <div 
                  key={amenity.id} 
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg"
                >
                  <IconComponent className="w-5 h-5 text-gray-600 shrink-0" />
                  <span className="text-gray-900">{amenity.name}</span>
                </div>
              );
            })}
            <div className="h-8" /> {/* Bottom spacing to account for mobile browsers */}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
};

export default AmenitiesDrawer;
