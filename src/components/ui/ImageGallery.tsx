import { useState, useEffect, useRef, ReactNode } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import LazyImage from './LazyImage';
import { optimizeImageUrl } from '../../utils/imageOptimization';

export interface ImageGalleryImage {
  id: string;
  url: string;
  alt?: string;
  caption?: string;
  thumbnail?: string;
}

export interface ImageGalleryProps {
  images: ImageGalleryImage[];
  initialIndex?: number;
  onClose?: () => void;
  showThumbnails?: boolean;
  showControls?: boolean;
  enableKeyboard?: boolean;
  className?: string;
  renderImage?: (image: ImageGalleryImage, index: number) => ReactNode;
  lightboxOnly?: boolean; // If true, only show lightbox (no grid)
  isLightboxOpen?: boolean; // External control of lightbox state
  onLightboxOpen?: () => void; // Callback when lightbox opens
}

/**
 * ImageGallery Component with Lightbox
 * 
 * A full-featured image gallery with:
 * - Lightbox modal view
 * - Keyboard navigation
 * - Touch/swipe support
 * - Thumbnail navigation
 * - Image optimization
 */
const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  initialIndex = 0,
  onClose,
  showThumbnails = true,
  showControls = true,
  enableKeyboard = true,
  className = '',
  renderImage,
  lightboxOnly = false,
  isLightboxOpen: externalIsLightboxOpen,
  onLightboxOpen,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [internalLightboxOpen, setInternalLightboxOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const isLightboxOpen = externalIsLightboxOpen !== undefined 
    ? externalIsLightboxOpen 
    : internalLightboxOpen;
  
  const setIsLightboxOpen = externalIsLightboxOpen !== undefined
    ? (open: boolean) => {
        if (open) {
          onLightboxOpen?.();
        } else {
          onClose?.();
        }
      }
    : setInternalLightboxOpen;
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const minSwipeDistance = 50;

  // Filter out images with invalid URLs
  const validImages = images.filter(
    (img) => img && img.url && typeof img.url === 'string' && img.url.trim() !== ''
  );

  // Ensure currentIndex is within bounds
  const safeCurrentIndex = Math.min(currentIndex, Math.max(0, validImages.length - 1));
  const currentImage = validImages[safeCurrentIndex];

  // Ensure currentIndex is within bounds when validImages changes
  useEffect(() => {
    if (validImages.length > 0 && currentIndex >= validImages.length) {
      setCurrentIndex(Math.max(0, validImages.length - 1));
    }
  }, [validImages.length, currentIndex]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isLightboxOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isLightboxOpen || !enableKeyboard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'Escape':
          e.preventDefault();
          closeLightbox();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, currentIndex, enableKeyboard]);

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    }
    if (isRightSwipe) {
      goToPrevious();
    }
  };

  const goToNext = () => {
    if (validImages.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
  };

  const goToPrevious = () => {
    if (validImages.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    if (externalIsLightboxOpen === undefined) {
      setInternalLightboxOpen(true);
    }
    onLightboxOpen?.();
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    onClose?.();
  };

  // Click outside to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === lightboxRef.current) {
      closeLightbox();
    }
  };

  if (validImages.length === 0) {
    return null;
  }

  return (
    <>
      {/* Gallery Grid - Only show if not lightboxOnly */}
      {!lightboxOnly && (
        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 ${className}`}>
        {validImages.map((image, index) => (
          <div
            key={image.id}
            className="relative group cursor-pointer overflow-hidden rounded-lg aspect-square"
            onClick={() => openLightbox(index)}
          >
            {renderImage ? (
              renderImage(image, index)
            ) : (
              <LazyImage
                src={image.thumbnail || image.url}
                alt={image.alt || `Image ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                optimize
                optimizationOptions={{ quality: 75, format: 'webp' }}
              />
            )}
            
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Image count badge for first image */}
            {index === 0 && validImages.length > 1 && (
              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                +{validImages.length - 1}
              </div>
            )}
          </div>
        ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          ref={lightboxRef}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={handleBackdropClick}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            aria-label="Close gallery"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous button */}
          {showControls && validImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Next button */}
          {showControls && validImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          {/* Main image */}
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <LazyImage
                src={optimizeImageUrl(currentImage.url, {
                  width: 1920,
                  quality: 90,
                  format: 'webp',
                })}
                alt={currentImage.alt || `Image ${safeCurrentIndex + 1}`}
                className="max-w-full max-h-[80vh] object-contain"
                optimize={false} // Already optimized above
                placeholder="blur"
              />

              {/* Caption */}
              {currentImage.caption && (
                <div className="mt-4 text-white text-center max-w-2xl">
                  <p className="text-lg">{currentImage.caption}</p>
                </div>
              )}

              {/* Image counter */}
              {validImages.length > 1 && (
                <div className="mt-2 text-white/70 text-sm">
                  {safeCurrentIndex + 1} / {validImages.length}
                </div>
              )}
            </div>
          </div>

          {/* Thumbnail strip */}
          {showThumbnails && validImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 max-w-4xl overflow-x-auto px-4 py-2 bg-black/50 rounded-lg">
              {validImages.map((image, index) => (
                <button
                  key={image.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToImage(index);
                  }}
                  className={`flex-shrink-0 w-20 h-20 rounded overflow-hidden border-2 transition-all ${
                    index === safeCurrentIndex
                      ? 'border-white scale-110'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <LazyImage
                    src={image.thumbnail || image.url}
                    alt={image.alt || `Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    optimize
                    optimizationOptions={{ width: 80, quality: 60 }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ImageGallery;

