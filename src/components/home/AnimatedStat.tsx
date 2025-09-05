import { useEffect, useRef } from 'react';
import { useAnimatedCounter } from '../../hooks/useAnimatedCounter';

// Optimized stats component with intersection observer
interface AnimatedStatProps {
  endValue: number;
  suffix?: string;
  label: string;
  duration?: number;
}

const AnimatedStat = ({ 
  endValue, 
  suffix = '', 
  duration = 1500 
}: AnimatedStatProps) => {
  const { count, setIsVisible } = useAnimatedCounter(endValue, duration);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [setIsVisible]);

  return (
    <span 
      ref={ref}
      style={{ 
        willChange: 'contents',
        transform: 'translateZ(0)' // Force hardware acceleration
      }}
    >
      {count}{suffix}
    </span>
  );
};

export default AnimatedStat;