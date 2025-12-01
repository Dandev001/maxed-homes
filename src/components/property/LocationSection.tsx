import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { MapPin } from 'lucide-react';
import type { Property } from '../../types';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationSectionProps {
  property: Property;
}

const LocationSection: React.FC<LocationSectionProps> = ({ property }) => {
  const position: [number, number] = [property.coordinates.latitude, property.coordinates.longitude];

  return (
    <section id="location" className="py-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#1a1a1a]/90 mb-4">Where you'll be</h2>
          <div className="flex items-start space-x-2 mb-6">
            <MapPin className="w-5 h-5 text-[#1a1a1a]/90 mt-1" />
            <div>
              <p className="text-[#1a1a1a]/90 leading-relaxed">
                {property.city}, {property.state}
              </p>
            </div>
          </div>
        </div>
        
        {/* Interactive Map */}
        <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-lg z-0">
          <MapContainer 
            center={position} 
            zoom={14} 
            className="w-full h-full"
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position}>
              <Popup>
                <div className="p-2">
                  <h3 className="font-medium text-sm mb-1">{property.title}</h3>
                  <p className="text-xs text-gray-600">{property.address}</p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>
    </section>
  );
};

export default LocationSection;
