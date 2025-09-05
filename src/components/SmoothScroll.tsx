import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

export default function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Initialize Lenis once
    const lenis = new Lenis({
      autoRaf: true,
      // anchors: true, // enable if you want anchor links handled automatically
    });

    lenisRef.current = lenis;
    // Expose for other utilities (e.g., ScrollToTop)
    (window as any).__lenis = lenis;

    const handleScroll = () => {
      // placeholder for optional scroll-based logic
    };
    lenis.on('scroll', handleScroll);

    return () => {
      lenis.off('scroll', handleScroll);
      lenis.destroy();
      if ((window as any).__lenis === lenis) {
        delete (window as any).__lenis;
      }
    };
  }, []);

  return null;
}


