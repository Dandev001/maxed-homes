# TypeScript Types Documentation

This directory contains comprehensive TypeScript type definitions for the Maxed Homes Property Rental System.

## File Structure

### Core Types
- **`index.ts`** - Main type definitions including enhanced Property, Booking, Guest interfaces and filter types
- **`api.ts`** - API-specific types for all endpoints and responses
- **`database.ts`** - Database types aligned with Supabase schema
- **`types.ts`** - Consolidated exports for easy importing

## Enhanced Interfaces

### Property Interface
The Property interface has been significantly enhanced with:
- **Property Types**: Comprehensive enum for different property types (house, apartment, villa, etc.)
- **Location Data**: Enhanced coordinates and address information
- **Amenities**: Structured amenity system with categories
- **Pricing**: Detailed pricing breakdown including fees and deposits
- **Availability**: Check-in/out times and minimum/maximum night requirements
- **Media**: Image management with ordering and primary image support
- **Ratings**: Optional rating and review count fields

### Booking Interface
Comprehensive booking management with:
- **Pricing Structure**: Detailed breakdown of all costs (base price, fees, taxes, etc.)
- **Status Management**: Extended status options including 'expired'
- **Guest Information**: Full guest and host relationship data
- **Timeline Support**: Optional booking timeline for tracking changes
- **Special Requests**: Support for guest special requirements

### Guest Interface
Enhanced guest management featuring:
- **Contact Information**: Complete contact details including emergency contacts
- **Preferences**: Detailed preference system for property types, amenities, and notifications
- **Verification Status**: Multi-level verification tracking (email, phone, identity, payment)
- **Accessibility**: Accessibility preference support
- **Profile Management**: Image and personal information handling

## API Response Types

### Comprehensive API Coverage
- **Property APIs**: CRUD operations, search, availability checking
- **Booking APIs**: Full booking lifecycle management
- **Guest APIs**: Guest management and preferences
- **Authentication APIs**: Login, registration, token management
- **File Upload APIs**: Image and document handling
- **Analytics APIs**: Performance metrics and reporting
- **Notification APIs**: System notification management

### Response Structure
All API responses follow a consistent structure:
```typescript
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp: Date;
  requestId?: string;
}
```

## Filter Types

### Advanced Filtering
- **Property Filters**: Location-based, price range, amenities, availability
- **Booking Filters**: Date ranges, status, guest/host filtering
- **Guest Filters**: Verification status, booking history, location
- **Search Facets**: Dynamic filtering with counts and selections

### Search Capabilities
- **Geographic Search**: Coordinate-based radius searching
- **Faceted Search**: Multi-dimensional filtering with counts
- **Suggestions**: Auto-complete and search suggestions
- **Sorting**: Multiple sort options with direction control

## Usage Examples

### Importing Types
```typescript
// Import specific types
import type { Property, Booking, Guest } from '../types';

// Import API types
import type { ApiResponse, PaginatedResponse } from '../types/api';

// Import everything
import type * as Types from '../types/types';
```

### Using Enhanced Property Interface
```typescript
const property: Property = {
  id: 'prop-123',
  title: 'Beautiful Beach House',
  propertyType: 'house',
  bedrooms: 3,
  bathrooms: 2,
  maxGuests: 6,
  pricePerNight: 250,
  coordinates: {
    latitude: 34.0522,
    longitude: -118.2437
  },
  amenities: [
    { id: 'wifi', name: 'WiFi', category: 'basic' },
    { id: 'pool', name: 'Swimming Pool', category: 'outdoor' }
  ],
  // ... other properties
};
```

### Using Filter Types
```typescript
const filters: PropertyFilters = {
  city: 'Los Angeles',
  propertyType: ['house', 'villa'],
  pricePerNight: { min: 100, max: 500 },
  amenities: ['wifi', 'pool'],
  coordinates: {
    latitude: 34.0522,
    longitude: -118.2437,
    radius: 10
  }
};
```

## Type Safety Features

### Utility Types
- **Optional<T, K>**: Make specific fields optional
- **RequiredFields<T, K>**: Make specific fields required
- **PartialExcept<T, K>**: Make all fields partial except specified ones

### Form Validation
- **ValidationRule<T>**: Type-safe validation rules
- **FormField<T>**: Structured form field definitions
- **FormState<T>**: Form state management with validation

### Event System
- **PropertyEvent**: Property lifecycle events
- **BookingEvent**: Booking lifecycle events
- **Timeline Support**: Change tracking and audit trails

## Best Practices

1. **Use Specific Types**: Import only the types you need to keep bundles small
2. **Leverage Utility Types**: Use the provided utility types for common patterns
3. **Type Guards**: Implement type guards for runtime type checking
4. **Consistent Naming**: Follow the established naming conventions
5. **Documentation**: Add JSDoc comments for complex types

## Migration Notes

If migrating from the old type system:
1. Update imports to use the new type structure
2. Replace old Property interface with the enhanced version
3. Update API calls to use the new response types
4. Implement new filter types for better search functionality
5. Add proper error handling with the new ErrorResponse type

## Future Enhancements

Planned additions include:
- Review and rating types
- Messaging system types
- Payment processing types
- Advanced analytics types
- Multi-language support types
