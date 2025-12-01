import React from 'react';

/**
 * Loading component for route-level Suspense boundaries
 * Provides a consistent loading experience when lazy-loaded routes are being fetched
 */
const RouteLoader: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#1a1a1a] rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-sm text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );
};

export default RouteLoader;

