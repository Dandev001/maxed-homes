# PropertyGrid Component

A comprehensive, feature-rich property grid component with responsive layout, advanced filtering, pagination, and loading states.

## Features

### 🎨 **Responsive Grid Layout**
- Adaptive grid that adjusts to screen size (1-4 columns)
- Grid and list view modes
- Smooth transitions between layouts
- Mobile-first responsive design

### ⚡ **Loading States**
- Beautiful skeleton loading animations
- Configurable skeleton count
- Smooth loading transitions
- Error state handling

### 📄 **Pagination**
- Smart pagination with ellipsis for large datasets
- Configurable items per page
- Page navigation with keyboard support
- Results counter display
- Smooth scroll to top on page change

### 🔍 **Empty States**
- Contextual empty state messages
- Clear call-to-action buttons
- Different states for no results vs. no data
- Filter-specific empty states

### 🎛️ **Filter Integration**
- Real-time filter application
- Filter summary with active filter chips
- Clear all filters functionality
- Filter persistence across page changes
- Advanced filter panel support

### ✨ **Additional Features**
- Favorites system integration
- Property click handling
- View mode switching (grid/list)
- Smooth animations with Framer Motion
- Accessibility support
- TypeScript support

## Usage

### Basic Usage

```tsx
import { PropertyGrid } from './components/ui';

<PropertyGrid
  properties={properties}
  loading={isLoading}
  onPropertyClick={(id) => navigateToProperty(id)}
  onPropertyFavorite={(id) => toggleFavorite(id)}
  favorites={favoriteSet}
/>
```

### Advanced Usage with Filters

```tsx
import { PropertyGrid } from './components/ui';
import { PropertyFilters } from '../types';

const [filters, setFilters] = useState<PropertyFilters>({
  city: 'New York',
  propertyType: ['apartment', 'loft'],
  pricePerNight: { min: 100, max: 500 },
  bedrooms: { min: 1, max: 3 },
  minRating: 4.5,
  isFeatured: true
});

<PropertyGrid
  properties={filteredProperties}
  filters={filters}
  onFiltersChange={setFilters}
  onPropertyClick={handlePropertyClick}
  onPropertyFavorite={handlePropertyFavorite}
  favorites={favorites}
  viewMode="grid"
  onViewModeChange={setViewMode}
  showFilters={true}
  showViewToggle={true}
  showPagination={true}
  itemsPerPage={12}
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `properties` | `Property[]` | ✅ | `[]` | Array of property objects to display |
| `loading` | `boolean` | ❌ | `false` | Whether to show loading skeletons |
| `error` | `string` | ❌ | `undefined` | Error message to display |
| `filters` | `PropertyFilters` | ❌ | `{}` | Active filters object |
| `onFiltersChange` | `(filters: PropertyFilters) => void` | ❌ | `undefined` | Callback when filters change |
| `onPropertyClick` | `(propertyId: string) => void` | ❌ | `undefined` | Callback when property is clicked |
| `onPropertyFavorite` | `(propertyId: string) => void` | ❌ | `undefined` | Callback when favorite button is clicked |
| `favorites` | `Set<string>` | ❌ | `new Set()` | Set of favorited property IDs |
| `viewMode` | `'grid' \| 'list'` | ❌ | `'grid'` | Current view mode |
| `onViewModeChange` | `(mode: 'grid' \| 'list') => void` | ❌ | `undefined` | Callback when view mode changes |
| `showFilters` | `boolean` | ❌ | `true` | Whether to show filter summary |
| `showViewToggle` | ❌ | `true` | Whether to show view mode toggle |
| `showPagination` | `boolean` | ❌ | `true` | Whether to show pagination |
| `itemsPerPage` | `number` | ❌ | `12` | Number of items per page |
| `className` | `string` | ❌ | `''` | Additional CSS classes |

## Components

### PropertyCardSkeleton
Loading skeleton component that mimics the PropertyCard layout.

```tsx
<PropertyCardSkeleton />
```

### EmptyState
Displays when no properties are found or available.

```tsx
<EmptyState
  title="No properties found"
  description="Try adjusting your filters"
  action={<button>Clear Filters</button>}
/>
```

### Pagination
Handles page navigation with smart page number display.

```tsx
<Pagination
  currentPage={1}
  totalPages={10}
  onPageChange={setPage}
  totalItems={100}
  itemsPerPage={12}
/>
```

### FilterSummary
Shows active filters with clear functionality.

```tsx
<FilterSummary
  filters={activeFilters}
  onClearFilters={clearFilters}
  resultCount={50}
/>
```

## Styling

The component uses Tailwind CSS classes and can be customized through:

1. **CSS Custom Properties**: Override default colors and spacing
2. **Tailwind Classes**: Pass custom classes via `className` prop
3. **Theme Configuration**: Modify the component's internal styling

### Custom Styling Example

```tsx
<PropertyGrid
  className="custom-property-grid"
  // ... other props
/>
```

```css
.custom-property-grid {
  --grid-gap: 2rem;
  --card-radius: 1rem;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

## Responsive Breakpoints

| Breakpoint | Grid Columns | Description |
|------------|--------------|-------------|
| `sm` (640px+) | 2 columns | Small tablets |
| `md` (768px+) | 2 columns | Tablets |
| `lg` (1024px+) | 3 columns | Laptops |
| `xl` (1280px+) | 4 columns | Desktops |
| `2xl` (1536px+) | 4 columns | Large desktops |

## Animation Details

The component uses Framer Motion for smooth animations:

- **Staggered Entry**: Cards animate in with 0.1s delay between each
- **Layout Animations**: Smooth transitions when switching view modes
- **Hover Effects**: Subtle scale and shadow changes on hover
- **Page Transitions**: Smooth fade transitions between pages

## Accessibility

- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **Focus Management**: Proper focus handling during page changes
- **Color Contrast**: Meets WCAG 2.1 AA standards
- **Semantic HTML**: Uses proper HTML elements and structure

## Performance

- **Virtual Scrolling**: Efficient rendering for large datasets (future enhancement)
- **Image Lazy Loading**: Images load only when visible
- **Memoization**: Optimized re-renders with React.memo
- **Debounced Filters**: Prevents excessive API calls during filtering

## Dependencies

- React 19+
- Framer Motion
- Lucide React (for icons)
- Tailwind CSS
- TypeScript

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Examples

### Real Estate Listings
```tsx
<PropertyGrid
  properties={realEstateProperties}
  filters={searchFilters}
  onFiltersChange={updateFilters}
  onPropertyClick={viewPropertyDetails}
  showFilters={true}
  itemsPerPage={20}
/>
```

### Property Management Dashboard
```tsx
<PropertyGrid
  properties={myProperties}
  viewMode="list"
  onPropertyClick={editProperty}
  showViewToggle={false}
  showPagination={false}
  itemsPerPage={50}
/>
```

### Featured Properties Showcase
```tsx
<PropertyGrid
  properties={featuredProperties}
  filters={{ isFeatured: true }}
  onPropertyClick={viewProperty}
  showFilters={false}
  showPagination={false}
  itemsPerPage={6}
/>
```

## Migration Guide

### From Basic Property List
```tsx
// Before
<div className="grid grid-cols-3 gap-4">
  {properties.map(property => (
    <PropertyCard key={property.id} property={property} />
  ))}
</div>

// After
<PropertyGrid
  properties={properties}
  onPropertyClick={handleClick}
  onPropertyFavorite={handleFavorite}
  favorites={favorites}
/>
```

### Adding Filters
```tsx
// Before
const [properties, setProperties] = useState([]);

// After
const [properties, setProperties] = useState([]);
const [filters, setFilters] = useState({});

<PropertyGrid
  properties={properties}
  filters={filters}
  onFiltersChange={setFilters}
  // ... other props
/>
```

## Troubleshooting

### Common Issues

1. **Properties not displaying**: Check that the `properties` array is not empty and contains valid Property objects
2. **Filters not working**: Ensure `onFiltersChange` callback is provided and properly implemented
3. **Pagination issues**: Verify `itemsPerPage` is set correctly and total items count is accurate
4. **Loading state stuck**: Make sure `loading` prop is properly managed in parent component

### Performance Issues

1. **Slow rendering**: Consider reducing `itemsPerPage` or implementing virtual scrolling
2. **Filter lag**: Debounce filter changes to prevent excessive re-renders
3. **Memory leaks**: Ensure proper cleanup of event listeners and timers

## Contributing

When contributing to the PropertyGrid component:

1. Follow the existing code style and patterns
2. Add TypeScript types for new props
3. Include accessibility considerations
4. Test on multiple screen sizes
5. Update documentation for new features

## License

This component is part of the Maxed Homes project and follows the same licensing terms.
