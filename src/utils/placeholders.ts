/**
 * Placeholder Image Utilities
 * 
 * Provides utilities for generating and managing placeholder images
 */

export const PLACEHOLDER_IMAGES = {
  property: '/placeholder-property.jpg',
  avatar: '/placeholder-avatar.jpg',
  thumbnail: '/placeholder-thumbnail.jpg',
} as const;

/**
 * Gets a placeholder image URL based on type
 * 
 * @param type - Type of placeholder needed
 * @param width - Optional width for dynamic placeholders
 * @param height - Optional height for dynamic placeholders
 * @returns Placeholder image URL
 */
export function getPlaceholderImage(
  type: keyof typeof PLACEHOLDER_IMAGES = 'property',
  width?: number,
  height?: number
): string {
  // If width and height are provided, use SVG placeholder for reliability
  if (width && height) {
    return createSVGPlaceholder(width, height, 'Property Image');
  }

  // Otherwise, use static placeholder or default SVG
  const defaultWidth = type === 'avatar' ? 200 : type === 'thumbnail' ? 300 : 800;
  const defaultHeight = type === 'avatar' ? 200 : type === 'thumbnail' ? 200 : 500;
  return createSVGPlaceholder(defaultWidth, defaultHeight, 'Property Image');
}

/**
 * Creates a data URL placeholder (SVG)
 * 
 * @param width - Width of placeholder
 * @param height - Height of placeholder
 * @param text - Optional text to display
 * @param bgColor - Background color (hex)
 * @param textColor - Text color (hex)
 * @returns Data URL string
 */
export function createSVGPlaceholder(
  width: number = 400,
  height: number = 300,
  text: string = 'Image',
  bgColor: string = '#e5e7eb',
  textColor: string = '#9ca3af'
): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-size="16" 
        fill="${textColor}" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >${text}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Generates a gradient placeholder
 * 
 * @param width - Width of placeholder
 * @param height - Height of placeholder
 * @param colors - Array of colors for gradient
 * @returns Data URL string
 */
export function createGradientPlaceholder(
  width: number = 400,
  height: number = 300,
  colors: string[] = ['#e5e7eb', '#d1d5db']
): string {
  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;
  const stops = colors
    .map((color, index) => {
      const offset = (index / (colors.length - 1)) * 100;
      return `<stop offset="${offset}%" stop-color="${color}"/>`;
    })
    .join('');

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
          ${stops}
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#${gradientId})"/>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Checks if an image URL is valid
 * 
 * @param url - Image URL to validate
 * @returns True if URL appears valid
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  
  const trimmed = url.trim();
  if (trimmed.length === 0) return false;

  // Check for common image URL patterns
  const imageUrlPattern = /\.(jpg|jpeg|png|gif|webp|avif|svg)(\?.*)?$/i;
  const dataUrlPattern = /^data:image\//;
  const httpPattern = /^https?:\/\//;
  const pathPattern = /^\/[^/]/;

  return (
    imageUrlPattern.test(trimmed) ||
    dataUrlPattern.test(trimmed) ||
    httpPattern.test(trimmed) ||
    pathPattern.test(trimmed)
  );
}


