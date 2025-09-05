import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

interface PreloadScreenProps {
  onComplete: () => void;
}

const PreloadScreen: React.FC<PreloadScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const percentageRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    const percentage = percentageRef.current;

    if (!container || !text || !percentage) return;

    // Create timeline for color inversion animation
    timelineRef.current = gsap.timeline({ repeat: -1, yoyo: true });
    
    // Color inversion animation - continuously swap background and text colors
    timelineRef.current
      .to(container, {
        backgroundColor: '#ffffff',
        color: '#000000',
        duration: 1,
        ease: 'power2.inOut'
      })
      .to(container, {
        backgroundColor: '#000000',
        color: '#ffffff', 
        duration: 1,
        ease: 'power2.inOut'
      });

    // Progress counter animation
    let progressTween = gsap.to({ value: 0 }, {
      value: 100,
      duration: 3, // 3 seconds to complete loading
      ease: 'power2.out',
      onUpdate: function() {
        const currentProgress = Math.round(this.targets()[0].value);
        setProgress(currentProgress);
      },
      onComplete: () => {
        // Stop color inversion
        if (timelineRef.current) {
          timelineRef.current.kill();
        }
        
        // Animate out the preloader
        gsap.timeline()
          .to([text, percentage], {
            opacity: 0,
            y: -50,
            duration: 0.6,
            ease: 'power2.inOut'
          })
          .to(container, {
            opacity: 0,
            duration: 0.8,
            ease: 'power2.inOut',
            onComplete: () => {
              // Add a small delay before calling onComplete to ensure smooth transition
              setTimeout(onComplete, 100);
            }
          }, '-=0.3');
      }
    });

    // Initial animation for text and percentage
    gsap.fromTo([text, percentage], 
      { 
        opacity: 0, 
        y: 30,
        scale: 0.8
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: 'power2.out',
        stagger: 0.1
      }
    );

    // Cleanup function
    return () => {
      if (progressTween) progressTween.kill();
      if (timelineRef.current) timelineRef.current.kill();
    };
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black text-white transition-colors duration-1000 overflow-hidden"
      style={{
        backgroundColor: '#000000',
        color: '#ffffff'
      }}
    >
      {/* Main centered text */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div 
          ref={textRef}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight text-center"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          MAXED HOMES
        </div>
      </div>
      
      {/* Bottom right counter */}
      <div className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 md:bottom-10 md:right-10">
        <div
          ref={percentageRef}
          className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tabular-nums"
        >
          {progress}%
        </div>
      </div>
    </div>
  );
};

export default PreloadScreen;
