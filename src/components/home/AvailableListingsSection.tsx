import { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import houseImage from '../../assets/images/house.jpg';
import house1Image from '../../assets/images/house1.jpg';

interface ImageProps {
  id: number;
  image: string;
  alt: string;
}

const ExperienceLuxurySection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const leftTextRef = useRef<HTMLDivElement>(null);
  const rightCarouselRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const autoPlayTimelineRef = useRef<gsap.core.Tween | null>(null);

  const carouselImages: ImageProps[] = [
    {
      id: 1,
      image: houseImage,
      alt: "Modern interior design"
    },
    {
      id: 2,
      image: house1Image,
      alt: "Contemporary living space"
    },
    {
      id: 3,
      image: houseImage,
      alt: "Stylish home design"
    },
    {
      id: 4,
      image: house1Image,
      alt: "Elegant architecture"
    },
    {
      id: 5,
      image: houseImage,
      alt: "Beautiful interior"
    },
    {
      id: 6,
      image: house1Image,
      alt: "Luxury design"
    }
  ];

  // Calculate max index
  const maxIndex = carouselImages.length - 1;

  // Entrance animations
  useEffect(() => {
    const section = sectionRef.current;
    const leftText = leftTextRef.current;
    const rightCarousel = rightCarouselRef.current;

    if (!section || !leftText || !rightCarousel) return;

    // Initial setup - set elements to invisible
    gsap.set([leftText, rightCarousel], { opacity: 0, y: 50 });

    // Create entrance timeline
    const entranceTl = gsap.timeline({ delay: 0.3 });
    
    entranceTl
      .to(leftText, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out"
      })
      .to(rightCarousel, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out"
      }, "-=0.6");

    // Animate images in sequence
    const images = rightCarousel.querySelectorAll('.carousel-image');
    gsap.set(images, { opacity: 0, scale: 0.8 });
    
    gsap.to(images, {
      opacity: 1,
      scale: 1,
      duration: 0.8,
      stagger: 0.1,
      ease: "back.out(1.7)",
      delay: 1.2
    });

  }, []);

  // GSAP carousel animation with buttery smooth performance
  const animateToSlide = useCallback((index: number) => {
    if (!carouselRef.current) return;
    
    // Kill existing timeline for smooth transition
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    const carousel = carouselRef.current;
    const slideWidth = carousel.clientWidth / carouselImages.length;
    const translateX = -(index * slideWidth);
    
    // Use will-change for GPU acceleration
    gsap.set(carousel, { willChange: 'transform' });
    
    timelineRef.current = gsap.timeline({
      onComplete: () => {
        // Remove will-change after animation for better performance
        gsap.set(carousel, { willChange: 'auto' });
      }
    });
    
    timelineRef.current.to(carousel, {
      x: translateX,
      duration: 1.2,
      ease: "power3.inOut",
      force3D: true // Force hardware acceleration
    });
  }, [carouselImages.length]);

  // Auto-play with smooth GSAP timing
  useEffect(() => {
    if (!isAutoPlaying) return;

    // Clear any existing timeline
    if (autoPlayTimelineRef.current) {
      autoPlayTimelineRef.current.kill();
    }

    autoPlayTimelineRef.current = gsap.delayedCall(4, () => {
      const nextIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
      setCurrentIndex(nextIndex);
    });

    return () => {
      if (autoPlayTimelineRef.current) {
        autoPlayTimelineRef.current.kill();
      }
    };
  }, [isAutoPlaying, currentIndex, maxIndex]);

  // Animate when currentIndex changes
  useEffect(() => {
    animateToSlide(currentIndex);
  }, [currentIndex, animateToSlide]);

  const goToSlide = (index: number) => {
    const newIndex = Math.max(0, Math.min(index, maxIndex));
    setCurrentIndex(newIndex);
    setIsAutoPlaying(false);
    
    // Kill auto-play timeline
    if (autoPlayTimelineRef.current) {
      autoPlayTimelineRef.current.kill();
    }
    
    // Resume auto-play after user interaction
    gsap.delayedCall(6, () => setIsAutoPlaying(true));
  };

  const goToPrevious = () => {
    const newIndex = currentIndex <= 0 ? maxIndex : currentIndex - 1;
    goToSlide(newIndex);
  };

  const goToNext = () => {
    const newIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
    goToSlide(newIndex);
  };

  return (
    <section ref={sectionRef} className="relative z-10 py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div ref={containerRef} className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          
          {/* Left Side - Text Content */}
          <div ref={leftTextRef} className="space-y-6 lg:space-y-8">
            <div className="space-y-6">
              <h2 className="text-5xl sm:text-5xl lg:text-7xl text-[#1a1a1a] leading-tight font-light">
              Welcome To
                <br />
                <span className="text-[#1a1a1a] font-light">
                  Maxed Homes
                </span>
              </h2>
              <div className="space-y-4 max-w-lg">
                <p className="text-lg sm:text-xl text-gray-700 leading-relaxed font-medium">
                  Step into a world where luxury meets comfort, where every corner tells a story of elegance.
                </p>
                <p className="text-base sm:text-lg text-gray-500 leading-relaxed">
                  From breathtaking modern designs to timeless architectural masterpieces, each home in our collection is carefully curated to offer you an extraordinary living experience.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Carousel Container */}
          <div ref={rightCarouselRef} className="relative">
            {/* Main Carousel Container - Matches Moodboard */}
            <div className="relative">
              {/* Primary Image Container */}
              <div className="relative h-[500px] sm:h-[600px] lg:h-[700px] xl:h-[800px] 2xl:h-[900px] overflow-hidden rounded-3xl shadow-lg">
                <div 
                  ref={carouselRef}
                  className="flex will-change-transform h-full"
                  style={{ width: `${carouselImages.length * 100}%` }}
                >
                  {carouselImages.map((image) => (
                    <div
                      key={image.id}
                      className="flex-shrink-0 carousel-image"
                      style={{ width: `${100 / carouselImages.length}%` }}
                    >
                      <img
                        src={image.image}
                        alt={image.alt}
                        className="w-full h-full object-cover will-change-transform"
                      />
                    </div>
                  ))}
                </div>

                {/* Navigation Controls - Bottom Right */}
                <div className="absolute bottom-6 right-6 flex items-center space-x-3">
                  {/* Play/Pause Button */}
                  <button
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-gray-900 hover:text-white transition-all duration-300 flex items-center justify-center group"
                    aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
                  >
                    {isAutoPlaying ? (
                      <svg 
                        className="w-3 h-3 text-gray-700 group-hover:text-white transition-colors" 
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    ) : (
                      <svg 
                        className="w-3 h-3 text-gray-700 group-hover:text-white transition-colors ml-0.5" 
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                  
                  {/* Left Arrow */}
                  <button
                    onClick={goToPrevious}
                    className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-gray-900 hover:text-white transition-all duration-300 flex items-center justify-center group"
                    aria-label="Previous image"
                  >
                    <svg 
                      className="w-3 h-3 text-gray-700 group-hover:text-white transition-colors" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  {/* Right Arrow */}
                  <button
                    onClick={goToNext}
                    className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-gray-900 hover:text-white transition-all duration-300 flex items-center justify-center group"
                    aria-label="Next image"
                  >
                    <svg 
                      className="w-3 h-3 text-gray-700 group-hover:text-white transition-colors" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

              </div>
              
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExperienceLuxurySection;
