import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import LazyImage from '../ui/LazyImage';
import type { Property } from '../../types';

interface DesktopCarouselProps {
  property: Property;
}

const DesktopCarousel: React.FC<DesktopCarouselProps> = ({ property }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter out images with invalid or empty URLs
  const images = (property.images || []).filter(
    (img) => img && img.url && img.url.trim() !== ''
  );

  // Embla Carousel setup
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: images.length > 1,
    align: 'start',
    skipSnaps: false,
    dragFree: false,
  });

  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  if (images.length === 0) {
    return (
      <div className="w-full h-[500px] lg:h-[600px] bg-gray-200 rounded-2xl flex items-center justify-center">
        <span className="text-gray-500">No images available</span>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
        <div className="flex">
          {images.map((image) => (
            <div
              key={image.id}
              className="flex-[0_0_100%] min-w-0 relative"
            >
              <div className="relative w-full h-[500px] lg:h-[600px]">
                <LazyImage
                  src={image.url}
                  alt={image.altText || property.title}
                  placeholder="property"
                  className="w-full h-full object-cover"
                  optimize
                  optimizationOptions={{ quality: 85, format: 'webp' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <button
            className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all duration-200 ${
              prevBtnDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
            }`}
            onClick={scrollPrev}
            disabled={prevBtnDisabled}
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </button>
          <button
            className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all duration-200 ${
              nextBtnDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
            }`}
            onClick={scrollNext}
            disabled={nextBtnDisabled}
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6 text-gray-900" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              className={`transition-all duration-200 ${
                index === selectedIndex
                  ? 'bg-white w-8 h-2 rounded-full'
                  : 'bg-white/50 w-2 h-2 rounded-full hover:bg-white/75'
              }`}
              onClick={() => emblaApi?.scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Image Counter - Top right */}
      {images.length > 1 && (
        <div className="absolute top-4 right-4 z-10 bg-gray-800/80 text-white text-sm px-3 py-1.5 rounded-lg backdrop-blur-sm">
          {selectedIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};

export default DesktopCarousel;

