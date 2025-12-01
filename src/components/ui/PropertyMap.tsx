import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Maximize2, Minimize2 } from 'lucide-react';
import type { PropertyWithImages } from '../../types/database';

interface PropertyMapProps {
  properties: PropertyWithImages[];
  selectedProperty?: PropertyWithImages | null;
  onPropertySelect?: (property: PropertyWithImages) => void;
  className?: string;
  height?: string;
  showToggle?: boolean;
}

// Mock map component - in a real app, you'd integrate with Google Maps, Mapbox, etc.
const MockMapComponent: React.FC<{
  properties: PropertyWithImages[];
  selectedProperty?: PropertyWithImages | null;
  onPropertySelect?: (property: PropertyWithImages) => void;
  height: string;
}> = ({ properties, selectedProperty, onPropertySelect, height }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={mapRef}
      className="relative bg-gray-100 rounded-lg overflow-hidden"
      style={{ height }}
    >
      {/* Mock map background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100">
        <div className="absolute inset-0 opacity-20">
          {/* Mock map grid */}
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#94a3b8" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Property markers */}
      {properties.map((property, index) => {
        // Mock coordinates - in a real app, these would come from the property data
        const x = 20 + (index * 15) % 60;
        const y = 30 + (index * 20) % 40;
        const isSelected = selectedProperty?.id === property.id;

        return (
          <motion.button
            key={property.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 shadow-lg transition-all duration-200 ${
              isSelected
                ? 'bg-blue-600 border-white scale-125'
                : 'bg-white border-blue-500 hover:scale-110'
            }`}
            style={{ left: `${x}%`, top: `${y}%` }}
            onClick={() => onPropertySelect?.(property)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <MapPin className={`w-4 h-4 mx-auto ${isSelected ? 'text-white' : 'text-blue-600'}`} />
          </motion.button>
        );
      })}

      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <button className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors">
          <Maximize2 className="w-4 h-4" />
        </button>
        <button className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors">
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Map attribution */}
      <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded">
        Mock Map - Integrate with Google Maps or Mapbox
      </div>
    </div>
  );
};

const PropertyMap: React.FC<PropertyMapProps> = ({
  properties,
  selectedProperty,
  onPropertySelect,
  className = '',
  height = '400px',
  showToggle = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Toggle map visibility
  const toggleMap = () => {
    setIsVisible(!isVisible);
  };

  // Toggle map expansion
  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={className}>
      {/* Map Toggle Button */}
      {showToggle && (
        <div className="mb-4">
          <button
            onClick={toggleMap}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            <span>{isVisible ? 'Hide Map' : 'Show Map'}</span>
          </button>
        </div>
      )}

      {/* Map Container */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ 
              opacity: 1, 
              height: isExpanded ? '600px' : height 
            }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="relative overflow-hidden"
          >
            <MockMapComponent
              properties={properties}
              selectedProperty={selectedProperty}
              onPropertySelect={onPropertySelect}
              height={isExpanded ? '600px' : height}
            />

            {/* Expand/Collapse Button */}
            <button
              onClick={toggleExpansion}
              className="absolute top-4 left-4 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={toggleMap}
              className="absolute top-4 right-4 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Property List for Map View */}
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Properties on Map ({properties.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {properties.map((property) => (
              <div
                key={property.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedProperty?.id === property.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => onPropertySelect?.(property)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                      {property.title}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {property.city}, {property.state}
                    </p>
                    <p className="text-sm font-semibold text-blue-600 mt-1">
                      ${property.price_per_night}/night
                    </p>
                  </div>
                  <div className="ml-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PropertyMap;
