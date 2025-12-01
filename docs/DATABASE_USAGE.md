# Database Usage Guide

This guide shows how to use the optimized database queries and caching system for the Maxed Homes property rental platform.

## 🏗️ Database Schema

The system includes 5 core tables:

1. **properties** - Main property data
2. **property_images** - Separate image management
3. **bookings** - Reservation system
4. **availability_calendar** - Date management
5. **guests** - Guest information

## 🚀 Quick Start

### 1. Set up your Supabase project

1. Run the SQL schema in `database/schema.sql` in your Supabase SQL Editor
2. Configure your environment variables in `.env.local`:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 2. Use the React hooks

```typescript
import { useProperty, useFeaturedProperties, useCreateBooking } from '@/hooks'

// Fetch a single property
const { property, loading, error } = useProperty('property-id')

// Fetch featured properties
const { properties } = useFeaturedProperties(6)

// Create a booking
const { createBooking, loading } = useCreateBooking()
```

## 📊 Core Features

### Properties

```typescript
import { propertyQueries } from '@/lib/queries'

// Get property with images
const property = await propertyQueries.getWithImages('property-id')

// Search properties with filters
const results = await propertyQueries.search({
  query: 'beach house',
  filters: {
    city: 'Miami',
    min_price: 100,
    max_price: 500,
    min_bedrooms: 2
  },
  sort_by: 'price',
  sort_order: 'asc',
  page: 1,
  limit: 12
})

// Create new property
const newProperty = await propertyQueries.create({
  title: 'Beautiful Beach House',
  property_type: 'house',
  bedrooms: 3,
  bathrooms: 2,
  max_guests: 6,
  price_per_night: 250,
  address: '123 Beach St',
  city: 'Miami',
  state: 'FL'
})
```

### Bookings

```typescript
import { bookingQueries } from '@/lib/queries'

// Check availability
const availability = await bookingQueries.checkAvailability(
  'property-id',
  '2024-01-15',
  '2024-01-20'
)

// Create booking
const booking = await bookingQueries.create({
  property_id: 'property-id',
  guest_id: 'guest-id',
  check_in_date: '2024-01-15',
  check_out_date: '2024-01-20',
  guests_count: 4,
  base_price: 1000,
  total_amount: 1200
})

// Get guest bookings
const guestBookings = await bookingQueries.getByGuest('guest-id')
```

### Availability Management

```typescript
import { availabilityQueries } from '@/lib/queries'

// Set property unavailable for specific dates
await availabilityQueries.setUnavailable(
  'property-id',
  ['2024-01-15', '2024-01-16'],
  'Maintenance'
)

// Set price override for peak season
await availabilityQueries.setPriceOverride(
  'property-id',
  ['2024-12-20', '2024-12-21', '2024-12-22'],
  500 // Higher price for holidays
)

// Get monthly calendar
const calendar = await availabilityQueries.getMonthlyCalendar(
  'property-id',
  2024,
  1 // January
)
```

### Guests

```typescript
import { guestQueries } from '@/lib/queries'

// Get or create guest
const guest = await guestQueries.getOrCreate({
  email: 'john@example.com',
  first_name: 'John',
  last_name: 'Doe',
  phone: '+1234567890'
})

// Update guest preferences
await guestQueries.updatePreferences('guest-id', {
  preferred_check_in_time: '16:00',
  dietary_restrictions: ['vegetarian'],
  accessibility_needs: ['wheelchair_access']
})
```

## 🎣 React Hooks Usage

### Property Hooks

```typescript
import { 
  useProperty, 
  usePropertyWithImages, 
  useFeaturedProperties,
  usePropertySearch 
} from '@/hooks'

function PropertyPage({ propertyId }: { propertyId: string }) {
  const { property, loading, error } = usePropertyWithImages(propertyId)
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!property) return <div>Property not found</div>
  
  return (
    <div>
      <h1>{property.title}</h1>
      <div className="images">
        {property.images.map(image => (
          <img key={image.id} src={image.image_url} alt={image.alt_text} />
        ))}
      </div>
    </div>
  )
}

function SearchPage() {
  const [filters, setFilters] = useState({
    city: '',
    min_price: 0,
    max_price: 1000
  })
  
  const { results, loading } = usePropertySearch({
    filters,
    page: 1,
    limit: 12
  })
  
  return (
    <div>
      {results?.data.map(property => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  )
}
```

### Booking Hooks

```typescript
import { useCreateBooking, useAvailabilityCheck } from '@/hooks'

function BookingForm({ propertyId }: { propertyId: string }) {
  const { createBooking, loading } = useCreateBooking()
  const { checkAvailability } = useAvailabilityCheck()
  
  const handleSubmit = async (formData) => {
    try {
      // Check availability first
      const availability = await checkAvailability(
        propertyId,
        formData.checkInDate,
        formData.checkOutDate
      )
      
      if (!availability.available) {
        alert('Property not available for selected dates')
        return
      }
      
      // Create booking
      await createBooking({
        property_id: propertyId,
        guest_id: formData.guestId,
        check_in_date: formData.checkInDate,
        check_out_date: formData.checkOutDate,
        guests_count: formData.guestsCount,
        base_price: formData.basePrice,
        total_amount: formData.totalAmount
      })
      
      alert('Booking created successfully!')
    } catch (error) {
      alert(`Error: ${error.message}`)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Book Now'}
      </button>
    </form>
  )
}
```

### Availability Hooks

```typescript
import { useMonthlyCalendar, useSetUnavailable } from '@/hooks'

function PropertyCalendar({ propertyId }: { propertyId: string }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const { calendar, loading } = useMonthlyCalendar(
    propertyId,
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1
  )
  const { setUnavailable } = useSetUnavailable()
  
  const handleBlockDates = async (dates: string[]) => {
    await setUnavailable(propertyId, dates, 'Blocked by owner')
  }
  
  return (
    <div>
      {calendar.map(day => (
        <div 
          key={day.date}
          className={day.is_available ? 'available' : 'unavailable'}
          onClick={() => handleBlockDates([day.date])}
        >
          {day.date}
        </div>
      ))}
    </div>
  )
}
```

## ⚡ Caching Strategy

The system includes intelligent caching to optimize performance:

- **Short-term cache (2 minutes)**: Search results, availability checks
- **Medium-term cache (5 minutes)**: Property details, bookings
- **Long-term cache (15 minutes)**: Featured properties, statistics
- **Very long-term cache (1 hour)**: Guest statistics, rarely changing data

### Cache Management

```typescript
import { cache } from '@/lib/cache'

// Clear specific cache
cache.delete('properties:property-id')

// Clear pattern-based cache
cache.clearPattern('properties:list:')

// Get cache statistics
const stats = cache.getStats()
console.log(`Cache size: ${stats.size} items`)
```

## 🔒 Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Public read access** for properties and images
- **Guest-specific access** for bookings and guest data
- **Input validation** and constraints at database level
- **Optimized indexes** for common query patterns

## 📈 Performance Optimizations

1. **Database Indexes**: Optimized for common queries (city, price, dates)
2. **Query Optimization**: Efficient joins and filtering
3. **Caching Layer**: Reduces database load
4. **Pagination**: Handles large datasets efficiently
5. **Connection Pooling**: Managed by Supabase

## 🛠️ Development Tips

1. **Use TypeScript**: Full type safety with generated types
2. **Error Handling**: Always wrap queries in try-catch blocks
3. **Loading States**: Use the loading states from hooks
4. **Cache Invalidation**: Clear caches after mutations
5. **Testing**: Mock the query functions for unit tests

## 📝 Example: Complete Booking Flow

```typescript
import { 
  usePropertyWithImages, 
  useAvailabilityCheck, 
  useCreateBooking,
  useGuestByEmail 
} from '@/hooks'

function BookingFlow({ propertyId }: { propertyId: string }) {
  const { property } = usePropertyWithImages(propertyId)
  const { checkAvailability } = useAvailabilityCheck()
  const { createBooking } = useCreateBooking()
  const { guest } = useGuestByEmail('user@example.com')
  
  const handleBooking = async (dates, guestCount) => {
    // 1. Check availability
    const availability = await checkAvailability(
      propertyId,
      dates.checkIn,
      dates.checkOut
    )
    
    if (!availability.available) {
      throw new Error('Property not available')
    }
    
    // 2. Calculate pricing
    const nights = Math.ceil(
      (new Date(dates.checkOut) - new Date(dates.checkIn)) / (1000 * 60 * 60 * 24)
    )
    const basePrice = property.price_per_night * nights
    const totalAmount = basePrice + property.cleaning_fee
    
    // 3. Create booking
    const booking = await createBooking({
      property_id: propertyId,
      guest_id: guest.id,
      check_in_date: dates.checkIn,
      check_out_date: dates.checkOut,
      guests_count: guestCount,
      base_price: basePrice,
      cleaning_fee: property.cleaning_fee,
      total_amount: totalAmount
    })
    
    return booking
  }
  
  return (
    <div>
      {/* Booking form UI */}
    </div>
  )
}
```

This system provides a robust, scalable foundation for your property rental platform with optimized queries, intelligent caching, and a great developer experience!
