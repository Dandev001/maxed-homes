import { useState, useRef, useEffect, ImgHTMLAttributes } from 'react';
import { optimizeImageUrl, createBlurPlaceholder } from '../../utils/imageOptimization';
import { getPlaceholderImage, createSVGPlaceholder, isValidImageUrl } from '../../utils/placeholders';

export interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'loading'> {
  src: string | null | undefined;
  alt: string;
  placeholder?: 'property' | 'avatar' | 'thumbnail' | 'custom' | 'blur';
  customPlaceholder?: string;
  width?: number;
  height?: number;
  optimize?: boolean;
  optimizationOptions?: {
    quality?: number;
    format?: 'webp' | 'jpeg' | 'jpg' | 'png' | 'avif';
  };
  fallback?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  threshold?: number; // IntersectionObserver threshold (0-1)
  rootMargin?: string; // IntersectionObserver rootMargin
}

/**
 * LazyImage Component
 * 
 * A performant image component with:
 * - Lazy loading using IntersectionObserver
 * - Automatic image optimization
 * - Placeholder support
 * - Error fallback handling
 * - Loading states
 */
const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder = 'property',
  customPlaceholder,
  width,
  height,
  optimize = true,
  optimizationOptions = {},
  fallback,
  className = '',
  onLoad,
  onError,
  threshold = 0.1,
  rootMargin = '50px',
  ...imgProps
}) => {
  // Determine placeholder to use
  const getPlaceholderSrc = (): string => {
    if (customPlaceholder) return customPlaceholder;
    
    if (placeholder === 'blur') {
      return createBlurPlaceholder(width || 20, height || 20, 10);
    }
    
    if (placeholder === 'custom') {
      return createSVGPlaceholder(width || 400, height || 300, 'Loading...');
    }

    // Use SVG placeholder instead of via.placeholder.com for reliability
    if (width && height) {
      return createSVGPlaceholder(width, height, 'Property Image');
    }

    return getPlaceholderImage(placeholder, width, height);
  };

  const [imageSrc, setImageSrc] = useState<string>(getPlaceholderSrc());
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get the actual image source
  const getImageSrc = (): string => {
    if (!src || !isValidImageUrl(src)) {
      return fallback || getPlaceholderSrc();
    }

    if (optimize) {
      return optimizeImageUrl(src, {
        width,
        height,
        ...optimizationOptions,
      });
    }

    return src;
  };

  // IntersectionObserver for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    const currentRef = containerRef.current || imgRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  // Load image when in view
  useEffect(() => {
    if (!isInView) {
      // Set placeholder while waiting
      setImageSrc(getPlaceholderSrc());
      return;
    }

    const imageUrl = getImageSrc();
    
    // Preload the image
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(imageUrl);
      setIsLoaded(true);
      setHasError(false);
      onLoad?.();
    };

    img.onerror = () => {
      const fallbackUrl = fallback || getPlaceholderSrc();
      setImageSrc(fallbackUrl);
      setIsLoaded(true);
      setHasError(true);
      onError?.();
    };

    img.src = imageUrl;
  }, [isInView, src, width, height, optimize, fallback]);

  // Handle image error after load
  const handleImageError = () => {
    if (!hasError) {
      const fallbackUrl = fallback || getPlaceholderSrc();
      setImageSrc(fallbackUrl);
      setHasError(true);
      onError?.();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      style={width && height ? { width, height } : undefined}
    >
      {/* Placeholder/Loading state */}
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="w-12 h-12 bg-gray-300 rounded-full animate-pulse" />
        </div>
      )}

      {/* Actual image - only render if imageSrc is not empty */}
      {imageSrc && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          className={`w-full h-full transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          onError={handleImageError}
          loading="lazy"
          width={width}
          height={height}
          {...imgProps}
        />
      )}
    </div>
  );
};

export default LazyImage;

