# PropertyCard Component

A comprehensive property card component with lazy loading, currency formatting, hover animations, and availability indicators.

## Features

- **🖼️ Lazy Loading**: Images load only when they enter the viewport for better performance
- **💰 Currency Formatting**: Proper currency display using Intl.NumberFormat
- **📊 Property Details**: Displays beds, baths, location, amenities, and area
- **✅ Availability Indicator**: Shows real-time availability status
- **✨ Hover Animations**: Smooth GSAP and Framer Motion animations
- **❤️ Interactive Features**: Favorite button and click handlers
- **📱 Responsive Design**: Works on all screen sizes
- **♿ Accessibility**: Proper ARIA labels and keyboard navigation

## Usage

```tsx
import { PropertyCard } from './components/ui';

<PropertyCard
  property={propertyData}
  onFavorite={(id) => handleFavorite(id)}
  onViewDetails={(id) => navigateToDetails(id)}
  isFavorite={favorites.has(property.id)}
  showAvailability={true}
  className="w-full"
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `property` | `Property` | ✅ | Property data object |
| `onFavorite` | `(id: string) => void` | ❌ | Callback when favorite button is clicked |
| `onViewDetails` | `(id: string) => void` | ❌ | Callback when card is clicked |
| `isFavorite` | `boolean` | ❌ | Whether the property is favorited |
| `showAvailability` | `boolean` | ❌ | Whether to show availability indicator |
| `className` | `string` | ❌ | Additional CSS classes |

## Dependencies

- React 19+
- Framer Motion
- GSAP
- Lucide React (for icons)
- Tailwind CSS

## Animation Details

The component uses a combination of GSAP and Framer Motion for smooth animations:

- **Hover Effects**: Card lifts up and image scales on hover
- **Entrance Animation**: Cards fade in with staggered timing
- **Button Interactions**: Scale animations on button clicks
- **Image Loading**: Smooth opacity transition when images load

## Performance Optimizations

- **Lazy Loading**: Images only load when visible
- **GPU Acceleration**: Uses `will-change` and `transform3d` for smooth animations
- **Intersection Observer**: Efficient viewport detection
- **Memoization**: Optimized re-renders with proper dependencies

## Accessibility

- Proper ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader friendly
- High contrast support
- Focus indicators

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
