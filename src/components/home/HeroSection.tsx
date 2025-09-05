import { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import houseImage from '../../assets/images/place (13).jpg';

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const subheadingRef = useRef<HTMLParagraphElement | null>(null);
  const ctaButtonsRef = useRef<HTMLDivElement | null>(null);
  const [titleLetters, setTitleLetters] = useState<string[]>([]);

  // Split title text into letters on component mount
  useLayoutEffect(() => {
    const title = "Maxed Homes";
    const letters = title.split('').map(char => char === ' ' ? '\u00A0' : char); // Use non-breaking space
    setTitleLetters(letters);
  }, []);

  // GSAP entrance animations with optimized performance
  useLayoutEffect(() => {
    if (typeof window === 'undefined' || !sectionRef.current || titleLetters.length === 0) return;
    
    // Check for reduced motion preference
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    // Create optimized timeline with GPU acceleration
    const tl = gsap.timeline({ 
      defaults: { 
        ease: 'power3.out',
        force3D: true // Enable hardware acceleration
      }
    });

    // Get all letter spans
    const letterSpans = headingRef.current?.querySelectorAll('.letter');
    
    // Set initial states for performance
    gsap.set([subheadingRef.current, ctaButtonsRef.current], {
      opacity: 0,
      y: 60,
      scale: 0.95,
      transformOrigin: 'center center'
    });

    // Set initial state for letters
    if (letterSpans) {
      gsap.set(letterSpans, {
        opacity: 0,
        y: 100,
        scale: 0.3,
        rotationX: -90,
        transformOrigin: 'center bottom'
      });
    }

    // Animate letters with stagger and ease-in effect
    if (letterSpans) {
      tl.to(letterSpans, {
        opacity: 1,
        y: 0,
        scale: 1,
        rotationX: 0,
        duration: 0.8,
        ease: 'power2.in',
        stagger: {
          amount: 1.2,
          from: 'start'
        }
      });
    }

    // Continue with other animations
    tl.to(subheadingRef.current, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 1,
      ease: 'power3.out'
    }, '-=0.4') // Start 0.4s before letter animation ends
    .to(ctaButtonsRef.current, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.8,
      ease: 'power3.out'
    }, '-=0.4'); // Start 0.4s before previous animation ends

    // Cleanup function
    return () => {
      tl.kill();
    };
  }, [titleLetters]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden
                 pt-16 sm:pt-20 md:pt-0"
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={houseImage}
          alt="Luxurious modern home"
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        
        {/* Optimized gradient overlays for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 text-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-6xl mx-auto">
        {/* Main Heading */}
        <h1
          ref={headingRef}
          className="text-white font-bold tracking-tight leading-none mb-4 sm:mb-6 md:mb-8
                     text-5xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-7xl xl:text-9xl
                     drop-shadow-2xl"
          style={{ willChange: 'transform, opacity' }}
        >
          {titleLetters.map((letter, index) => (
            <span
              key={index}
              className="letter inline-block"
              style={{ willChange: 'transform, opacity' }}
            >
              {letter}
            </span>
          ))}
        </h1>

        {/* Subheading */}
        <p
          ref={subheadingRef}
          className="text-white/90 font-light leading-relaxed max-w-4xl mx-auto
                     text-sm xs:text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-3xl
                     drop-shadow-lg px-2 sm:px-4 mb-8 sm:mb-10 md:mb-12"
          style={{ willChange: 'transform, opacity' }}
        >
          Unlock the door to your next adventure with unique rentals tailored to your dreams
        </p>

        {/* CTA Buttons */}
        <div
          ref={ctaButtonsRef}
          className="flex flex-row gap-3 sm:gap-4 justify-center items-center"
          style={{ willChange: 'transform, opacity' }}
        >
          <button className="group relative overflow-hidden bg-white text-black font-medium
                           px-5 py-2.5 rounded-3xl transition-all duration-300 ease-out
                           hover:bg-black hover:text-white hover:scale-105
                           text-base sm:text-lg md:text-lg lg:text-lg xl:text-xl
                           min-w-[120px] shadow-xl hover:shadow-2xl
                           border-2 border-transparent">
            <span className="relative z-10">Contact Us</span>
            <div className="absolute inset-0 bg-gradient-to-r from-black/0 via-black/10 to-black/0 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
          
          <button className="group relative overflow-hidden bg-transparent text-white font-medium
                           px-5 py-2.5 rounded-3xl transition-all ease-out
                           border-2 border-white hover:bg-white hover:text-black hover:scale-105
                           text-base sm:text-lg md:text-lg lg:text-lg xl:text-xl
                           min-w-[120px] shadow-xl hover:shadow-2xl">
            <span className="relative z-10">Our Services</span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>
      </div>

      

      {/* Scroll Indicator */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="w-5 h-8 sm:w-6 sm:h-10 border-2 border-white/60 rounded-full flex justify-center">
          <div className="w-0.5 h-2 sm:w-1 sm:h-3 bg-white/60 rounded-full mt-1.5 sm:mt-2 animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;