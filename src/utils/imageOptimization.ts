/**
 * Image Optimization Utilities
 * 
 * Provides utilities for optimizing image URLs, especially for Supabase Storage
 * and other CDN services that support image transformations.
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  format?: 'webp' | 'jpeg' | 'jpg' | 'png' | 'avif';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  blur?: number; // 0-1000, for placeholder images
}

/**
 * Optimizes a Supabase Storage image URL with transformation parameters
 * 
 * @param url - The original image URL
 * @param options - Optimization options
 * @returns Optimized image URL
 */
export function optimizeSupabaseImage(
  url: string,
  options: ImageOptimizationOptions = {}
): string {
  // If not a Supabase Storage URL, return as-is
  if (!url || !url.includes('supabase.co/storage')) {
    return url;
  }

  const {
    width,
    height,
    quality = 80,
    format = 'webp',
    fit = 'cover',
    blur,
  } = options;

  const params: string[] = [];

  if (width) params.push(`width=${width}`);
  if (height) params.push(`height=${height}`);
  if (quality) params.push(`quality=${quality}`);
  if (format) params.push(`format=${format}`);
  if (fit) params.push(`resize=${fit}`);
  if (blur !== undefined) params.push(`blur=${blur}`);

  if (params.length === 0) return url;

  // Supabase Storage uses query parameters for transformations
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${params.join('&')}`;
}

/**
 * Optimizes a generic image URL (for services like Cloudinary, Imgix, etc.)
 * 
 * @param url - The original image URL
 * @param options - Optimization options
 * @returns Optimized image URL
 */
export function optimizeImageUrl(
  url: string,
  options: ImageOptimizationOptions = {}
): string {
  if (!url) return url;

  // Check if it's a Supabase Storage URL
  if (url.includes('supabase.co/storage')) {
    return optimizeSupabaseImage(url, options);
  }

  // For other services, you can add support here
  // For now, return the original URL
  return url;
}

/**
 * Generates a responsive image srcset for different screen sizes
 * 
 * @param baseUrl - Base image URL
 * @param sizes - Array of widths to generate
 * @param options - Additional optimization options
 * @returns srcset string
 */
export function generateSrcSet(
  baseUrl: string,
  sizes: number[] = [400, 800, 1200, 1600],
  options: ImageOptimizationOptions = {}
): string {
  return sizes
    .map((width) => {
      const optimizedUrl = optimizeImageUrl(baseUrl, { ...options, width });
      return `${optimizedUrl} ${width}w`;
    })
    .join(', ');
}

/**
 * Gets the appropriate image size based on container width
 * 
 * @param containerWidth - Width of the container in pixels
 * @returns Recommended image width
 */
export function getOptimalImageWidth(containerWidth: number): number {
  // Use 2x for retina displays
  const retinaMultiplier = 2;
  
  // Round to nearest standard size
  const standardSizes = [400, 600, 800, 1000, 1200, 1600, 2000];
  const targetWidth = containerWidth * retinaMultiplier;
  
  return standardSizes.find((size) => size >= targetWidth) || standardSizes[standardSizes.length - 1];
}

/**
 * Creates a blur placeholder data URL
 * 
 * @param width - Width of placeholder
 * @param height - Height of placeholder
 * @param blur - Blur amount (0-100)
 * @returns Data URL for placeholder
 */
export function createBlurPlaceholder(
  width: number = 20,
  height: number = 20,
  blur: number = 10
): string {
  // Create a simple SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
      <text x="50%" y="50%" font-family="Arial" font-size="10" fill="#9ca3af" text-anchor="middle" dy=".3em">Loading...</text>
    </svg>
  `.trim();
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}


