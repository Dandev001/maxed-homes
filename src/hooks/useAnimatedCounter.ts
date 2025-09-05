import { useState, useEffect, useRef, useCallback } from 'react';

// Optimized custom hook for animated counter with better performance
export const useAnimatedCounter = (end: number, duration: number = 1500, start: number = 0) => {
  const [count, setCount] = useState(start);
  const [isVisible, setIsVisible] = useState(false);
  const rafRef = useRef<number | undefined>(undefined);

  const animate = useCallback((startTime: number, startValue: number, endValue: number) => {
    const animateFrame = (currentTime: number) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Optimized easing function
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentCount = startValue + (endValue - startValue) * easeOutCubic;
      
      setCount(Math.round(currentCount));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animateFrame);
      }
    };
    
    rafRef.current = requestAnimationFrame(animateFrame);
  }, [duration]);

  useEffect(() => {
    if (!isVisible) return;

    const startTime = performance.now();
    animate(startTime, start, end);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isVisible, end, start, animate]);

  return { count, setIsVisible };
};