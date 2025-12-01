import { Helmet } from 'react-helmet-async';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  structuredData?: object;
  noindex?: boolean;
  nofollow?: boolean;
}

const defaultTitle = 'Maxed Homes - Find Your Perfect Home';
const defaultDescription = 'Discover premium vacation rentals and properties in Côte d\'Ivoire. Book your perfect stay with Maxed Homes - luxury accommodations with exceptional service.';
const defaultImage = '/images/og-image.jpg'; // You should add this image
const defaultUrl = typeof window !== 'undefined' ? window.location.origin : 'https://maxedhomes.com';

/**
 * SEO Component for managing meta tags, Open Graph, Twitter Cards, and structured data
 * 
 * @example
 * <SEO 
 *   title="Luxury Villa in Abidjan"
 *   description="Beautiful 3-bedroom villa with pool"
 *   image="/images/villa.jpg"
 *   url="/properties/villa-123"
 * />
 */
export default function SEO({
  title,
  description = defaultDescription,
  keywords = 'vacation rentals, properties, Côte d\'Ivoire, Abidjan, luxury homes, booking, accommodation',
  image = defaultImage,
  url,
  type = 'website',
  structuredData,
  noindex = false,
  nofollow = false,
}: SEOProps) {
  const fullTitle = title ? `${title} | Maxed Homes` : defaultTitle;
  const fullUrl = url ? `${defaultUrl}${url}` : defaultUrl;
  const fullImage = image.startsWith('http') ? image : `${defaultUrl}${image}`;

  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow',
  ].join(', ');

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content="Maxed Homes" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />

      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <meta name="theme-color" content="#1a1a1a" />
      <meta name="author" content="Maxed Homes" />

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}

/**
 * Helper function to generate structured data for a property
 */
export function generatePropertyStructuredData(property: {
  id: string;
  title: string;
  description: string;
  pricePerNight: number;
  images: string[];
  address?: string;
  city?: string;
  country?: string;
  bedrooms?: number;
  bathrooms?: number;
  guests?: number;
  rating?: number;
  reviewCount?: number;
}) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://maxedhomes.com';
  const imageUrls = property.images.map(img => 
    img.startsWith('http') ? img : `${baseUrl}${img}`
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'Accommodation',
    name: property.title,
    description: property.description,
    image: imageUrls,
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.city || 'Abidjan',
      addressCountry: property.country || 'CI',
      streetAddress: property.address,
    },
    numberOfRooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms,
    occupancy: {
      '@type': 'QuantitativeValue',
      maxValue: property.guests,
    },
    priceRange: `$${property.pricePerNight}`,
    aggregateRating: property.rating && property.reviewCount ? {
      '@type': 'AggregateRating',
      ratingValue: property.rating,
      reviewCount: property.reviewCount,
    } : undefined,
    url: `${baseUrl}/properties/${property.id}`,
  };
}

/**
 * Helper function to generate structured data for the organization
 */
export function generateOrganizationStructuredData() {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://maxedhomes.com';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Maxed Homes',
    url: baseUrl,
    logo: `${baseUrl}/images/logo.png`,
    description: 'Premium vacation rentals and properties in Côte d\'Ivoire',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: ['English', 'French'],
    },
    sameAs: [
      // Add social media links here when available
      // 'https://www.facebook.com/maxedhomes',
      // 'https://www.instagram.com/maxedhomes',
    ],
  };
}

