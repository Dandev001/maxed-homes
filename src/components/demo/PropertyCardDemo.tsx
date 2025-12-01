import { useState } from 'react';
import { PropertyCard } from '../ui';
import type { Property } from '../../types';

// Sample property data for demonstration
const sampleProperties: Property[] = [
  {
    id: '1',
    title: 'Modern Downtown Loft with City Views',
    description: 'Stunning modern loft in the heart of downtown with panoramic city views and luxury amenities.',
    propertyType: 'loft',
    bedrooms: 2,
    bathrooms: 2,
    maxGuests: 4,
    areaSqft: 1200,
    pricePerNight: 250,
    cleaningFee: 75,
    securityDeposit: 500,
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
    coordinates: {
      latitude: 40.7589,
      longitude: -73.9851,
    },
    amenities: [
      { id: '1', name: 'wifi', category: 'basic' },
      { id: '2', name: 'parking', category: 'parking' },
      { id: '3', name: 'coffee', category: 'kitchen' },
      { id: '4', name: 'gym', category: 'entertainment' },
    ],
    houseRules: 'No smoking, no pets',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    minimumNights: 2,
    maximumNights: 30,
    status: 'active',
    isFeatured: true,
    images: [
      {
        id: '1',
        url: '/src/assets/images/house.jpg',
        altText: 'Modern downtown loft',
        caption: 'Living room with city views',
        displayOrder: 1,
        isPrimary: true,
        createdAt: new Date(),
      },
    ],
    rating: 4.8,
    reviewCount: 127,
    hostId: 'host1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: 'Cozy Beach House with Ocean Access',
    description: 'Beautiful beach house just steps from the ocean with private beach access.',
    propertyType: 'house',
    bedrooms: 3,
    bathrooms: 2,
    maxGuests: 6,
    areaSqft: 1800,
    pricePerNight: 400,
    cleaningFee: 100,
    securityDeposit: 800,
    address: '456 Ocean Drive',
    city: 'Miami',
    state: 'FL',
    zipCode: '33139',
    country: 'USA',
    coordinates: {
      latitude: 25.7907,
      longitude: -80.1300,
    },
    amenities: [
      { id: '1', name: 'wifi', category: 'basic' },
      { id: '2', name: 'parking', category: 'parking' },
      { id: '3', name: 'pool', category: 'outdoor' },
    ],
    houseRules: 'No smoking, pets allowed',
    checkInTime: '16:00',
    checkOutTime: '10:00',
    minimumNights: 3,
    maximumNights: 14,
    status: 'active',
    isFeatured: false,
    images: [
      {
        id: '1',
        url: '/src/assets/images/house1.jpg',
        altText: 'Beach house exterior',
        caption: 'Beautiful beach house',
        displayOrder: 1,
        isPrimary: true,
        createdAt: new Date(),
      },
    ],
    rating: 4.9,
    reviewCount: 89,
    hostId: 'host2',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    title: 'Luxury Penthouse with Rooftop Terrace',
    description: 'Exclusive penthouse with private rooftop terrace and stunning city skyline views.',
    propertyType: 'penthouse',
    bedrooms: 4,
    bathrooms: 3,
    maxGuests: 8,
    areaSqft: 2500,
    pricePerNight: 750,
    cleaningFee: 150,
    securityDeposit: 1500,
    address: '789 Skyline Avenue',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90210',
    country: 'USA',
    coordinates: {
      latitude: 34.0522,
      longitude: -118.2437,
    },
    amenities: [
      { id: '1', name: 'wifi', category: 'basic' },
      { id: '2', name: 'parking', category: 'parking' },
      { id: '3', name: 'gym', category: 'entertainment' },
      { id: '4', name: 'pool', category: 'outdoor' },
      { id: '5', name: 'coffee', category: 'kitchen' },
    ],
    houseRules: 'No smoking, no pets, no parties',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    minimumNights: 2,
    maximumNights: 30,
    status: 'active',
    isFeatured: true,
    images: [
      {
        id: '1',
        url: '/src/assets/images/place (1).jpg',
        altText: 'Luxury penthouse',
        caption: 'Rooftop terrace view',
        displayOrder: 1,
        isPrimary: true,
        createdAt: new Date(),
      },
    ],
    rating: 4.7,
    reviewCount: 203,
    hostId: 'host3',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const PropertyCardDemo: React.FC = () => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const handleFavorite = (propertyId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(propertyId)) {
        newFavorites.delete(propertyId);
      } else {
        newFavorites.add(propertyId);
      }
      return newFavorites;
    });
  };

  const handleViewDetails = (propertyId: string) => {
    // In a real app, this would navigate to the property details page
    // Example: navigate(`/properties/${propertyId}`)
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            PropertyCard Component Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Showcasing the PropertyCard component with lazy loading, currency formatting, 
            hover animations, and availability indicators.
          </p>
        </div>

        {/* Features List */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Features Implemented</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-medium text-gray-900 mb-2">🖼️ Lazy Loading</h3>
              <p className="text-sm text-gray-600">Images load only when they enter the viewport</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-medium text-gray-900 mb-2">💰 Currency Formatting</h3>
              <p className="text-sm text-gray-600">Proper currency display with Intl.NumberFormat</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-medium text-gray-900 mb-2">📊 Property Details</h3>
              <p className="text-sm text-gray-600">Beds, baths, location, and amenities</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-medium text-gray-900 mb-2">✅ Availability Indicator</h3>
              <p className="text-sm text-gray-600">Real-time availability status</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-medium text-gray-900 mb-2">✨ Hover Animations</h3>
              <p className="text-sm text-gray-600">Smooth GSAP and Framer Motion animations</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-medium text-gray-900 mb-2">❤️ Interactive Features</h3>
              <p className="text-sm text-gray-600">Favorite button and click handlers</p>
            </div>
          </div>
        </div>

        {/* Property Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sampleProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onFavorite={handleFavorite}
              onViewDetails={handleViewDetails}
              isFavorite={favorites.has(property.id)}
              showAvailability={true}
              className="w-full"
            />
          ))}
        </div>

        {/* Usage Example */}
        <div className="mt-16 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Usage Example</h2>
          <div className="bg-gray-900 rounded-lg p-6 overflow-x-auto">
            <pre className="text-green-400 text-sm">
              <code>{`import { PropertyCard } from './components/ui';

<PropertyCard
  property={propertyData}
  onFavorite={(id) => handleFavorite(id)}
  onViewDetails={(id) => navigateToDetails(id)}
  isFavorite={favorites.has(property.id)}
  showAvailability={true}
  className="w-full"
/>`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCardDemo;
