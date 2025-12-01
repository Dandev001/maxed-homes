import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import LazyImage from '../ui/LazyImage';
import type { Property } from '../../types';

interface MobileCarouselProps {
  property: Property;
}

const MobileCarousel: React.FC<MobileCarouselProps> = ({ property }) => {
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
      <div className="w-full h-[50vh] min-h-[350px] bg-gray-200 rounded-b-4xl flex items-center justify-center">
        <span className="text-gray-500">No images available</span>
      </div>
    );
  }

  return (
    <div className="relative w-screen" style={{ marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)' }}>
      <div className="overflow-hidden rounded-b-4xl" ref={emblaRef}>
        <div className="flex">
          {images.map((image) => (
            <div
              key={image.id}
              className="flex-[0_0_100%] min-w-0 relative"
            >
              <div className="relative w-full h-[50vh] min-h-[350px]">
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

      {/* Image Counter - Top right */}
      {images.length > 1 && (
        <div className="absolute top-4 right-4 z-10 bg-gray-800/80 text-white text-sm px-3 py-1.5 rounded-lg backdrop-blur-sm">
          {selectedIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};

export default MobileCarousel;

