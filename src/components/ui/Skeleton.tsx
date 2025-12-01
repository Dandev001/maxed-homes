import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-gray-200';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-[shimmer_2s_infinite]',
    none: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
      aria-busy="true"
      aria-live="polite"
    />
  );
};

// Pre-built skeleton components for common use cases
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 1, 
  className = '' 
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        height={16}
        width={i === lines - 1 ? '80%' : '100%'}
        className="h-4"
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-6 bg-white rounded-lg border border-gray-200 ${className}`}>
    <Skeleton variant="rectangular" height={200} className="mb-4" />
    <SkeletonText lines={2} className="mb-2" />
    <Skeleton variant="text" width="60%" height={20} />
  </div>
);

export const SkeletonAvatar: React.FC<{ size?: number; className?: string }> = ({ 
  size = 40, 
  className = '' 
}) => (
  <Skeleton variant="circular" width={size} height={size} className={className} />
);

export const SkeletonButton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <Skeleton variant="rectangular" height={40} width={120} className={`rounded-lg ${className}`} />
);

export default Skeleton;

