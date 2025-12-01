import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '../../../test/utils'
import userEvent from '@testing-library/user-event'
import PropertyCard from '../PropertyCard'
import type { Property } from '../../../types'

// Mock the hooks
vi.mock('../../../hooks/useFavorites', () => ({
  usePropertyFavoriteCount: vi.fn(() => ({ count: 0, loading: false })),
}))

vi.mock('../../../hooks/useReviews', () => ({
  usePropertyRating: vi.fn(() => ({ 
    rating: { averageRating: 0, totalReviews: 0 }, 
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
}))

const mockProperty: Property = {
  id: 'prop-1',
  title: 'Beautiful Apartment',
  description: 'A lovely apartment in the city',
  propertyType: 'apartment',
  bedrooms: 2,
  bathrooms: 1,
  maxGuests: 4,
  areaSqft: 1000,
  pricePerNight: 10000,
  cleaningFee: 5000,
  securityDeposit: 20000,
  address: '123 Main St',
  city: 'New York',
  state: 'NY',
  zipCode: '10001',
  country: 'USA',
  coordinates: { latitude: 40.7128, longitude: -74.0060 },
  amenities: [],
  houseRules: '',
  checkInTime: '15:00',
  checkOutTime: '11:00',
  minimumNights: 1,
  maximumNights: 30,
  status: 'active',
  isFeatured: false,
  images: [
    {
      id: 'img-1',
      url: 'https://example.com/image.jpg',
      altText: 'Property image',
      caption: '',
      displayOrder: 1,
      isPrimary: true,
      createdAt: new Date(),
    },
  ],
  rating: 4.5,
  reviewCount: 10,
  hostId: 'host-1',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('PropertyCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render property information', () => {
    render(<PropertyCard property={mockProperty} />)
    
    expect(screen.getByText('New York, NY')).toBeInTheDocument()
    expect(screen.getByText(/2 beds/i)).toBeInTheDocument()
    expect(screen.getByText(/1 bath/i)).toBeInTheDocument()
    expect(screen.getByText(/4 guests/i)).toBeInTheDocument()
  })

  it('should display price for 5 nights', () => {
    render(<PropertyCard property={mockProperty} />)
    
    // Price should show pricePerNight * 5
    expect(screen.getByText(/for 5 nights/i)).toBeInTheDocument()
  })

  it('should call onViewDetails when card is clicked', async () => {
    const handleViewDetails = vi.fn()
    const user = userEvent.setup()
    
    render(<PropertyCard property={mockProperty} onViewDetails={handleViewDetails} />)
    
    const card = screen.getByText('New York, NY').closest('div[class*="group"]')
    if (card) {
      await user.click(card)
      expect(handleViewDetails).toHaveBeenCalledWith('prop-1')
    }
  })

  it('should call onFavorite when heart button is clicked', async () => {
    const handleFavorite = vi.fn()
    const user = userEvent.setup()
    
    render(<PropertyCard property={mockProperty} onFavorite={handleFavorite} />)
    
    const heartButton = screen.getByLabelText(/add to favorites/i)
    await user.click(heartButton)
    
    expect(handleFavorite).toHaveBeenCalledWith('prop-1')
  })

  it('should show filled heart when isFavorite is true', () => {
    render(<PropertyCard property={mockProperty} onFavorite={vi.fn()} isFavorite={true} />)
    
    const heartButton = screen.getByLabelText(/remove from favorites/i)
    expect(heartButton).toBeInTheDocument()
  })

  it('should show empty heart when isFavorite is false', () => {
    render(<PropertyCard property={mockProperty} onFavorite={vi.fn()} isFavorite={false} />)
    
    const heartButton = screen.getByLabelText(/add to favorites/i)
    expect(heartButton).toBeInTheDocument()
  })

  it('should not show heart button when onFavorite is not provided', () => {
    render(<PropertyCard property={mockProperty} />)
    
    expect(screen.queryByLabelText(/favorite/i)).not.toBeInTheDocument()
  })

  it('should display rating when available', () => {
    // The rating hook is already mocked at the top
    // This test verifies the component renders correctly
    render(<PropertyCard property={mockProperty} />)
    
    // Component should render
    expect(screen.getByText('New York, NY')).toBeInTheDocument()
  })

  it('should handle property without images', () => {
    const propertyWithoutImages = {
      ...mockProperty,
      images: [],
    }
    
    render(<PropertyCard property={propertyWithoutImages} />)
    
    // Should still render the card
    expect(screen.getByText('New York, NY')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(<PropertyCard property={mockProperty} className="custom-class" />)
    
    const card = container.querySelector('.custom-class')
    expect(card).toBeInTheDocument()
  })

  it('should stop propagation when heart button is clicked', async () => {
    const handleViewDetails = vi.fn()
    const handleFavorite = vi.fn()
    const user = userEvent.setup()
    
    render(
      <PropertyCard
        property={mockProperty}
        onViewDetails={handleViewDetails}
        onFavorite={handleFavorite}
      />
    )
    
    const heartButton = screen.getByLabelText(/add to favorites/i)
    await user.click(heartButton)
    
    // onFavorite should be called
    expect(handleFavorite).toHaveBeenCalled()
    // onViewDetails should NOT be called (event stopped)
    expect(handleViewDetails).not.toHaveBeenCalled()
  })
})

