import { Link, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useState, useEffect, useRef } from 'react';
import { Search, Heart, User, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants';

const BottomNavigation = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);

  // Detect footer visibility to hide bottom nav
  useEffect(() => {
    if (loading || !user) return;

    // Find footer element
    const footer = document.querySelector('footer');
    if (!footer) {
      setIsVisible(true);
      return;
    }

    footerRef.current = footer as HTMLElement;

    // Create intersection observer to detect when footer is near viewport
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Hide nav when footer is intersecting (visible in viewport)
          // We use a rootMargin to trigger slightly before footer enters viewport
          setIsVisible(!entry.isIntersecting);
        });
      },
      {
        root: null,
        rootMargin: '100px 0px 0px 0px', // Trigger 100px before footer enters viewport
        threshold: 0,
      }
    );

    observerRef.current.observe(footer);

    return () => {
      if (observerRef.current && footerRef.current) {
        observerRef.current.unobserve(footerRef.current);
        observerRef.current.disconnect();
      }
    };
  }, [loading, user, location.pathname]); // Re-run when route changes

  // Only show when user is signed in
  if (loading || !user) {
    return null;
  }

  // Hide on property detail pages and booking pages
  const isPropertyDetailPage = location.pathname.includes('/properties/') && location.pathname !== ROUTES.PROPERTIES;
  const isBookingPage = location.pathname.includes('/booking/');
  
  if (isPropertyDetailPage || isBookingPage) {
    return null;
  }

  // Check if current route matches a nav item
  const isActive = (path: string) => {
    if (path === ROUTES.PROPERTIES) {
      return location.pathname === ROUTES.PROPERTIES;
    }
    // Check for bookings tab in dashboard
    if (path === `${ROUTES.DASHBOARD}?tab=bookings`) {
      return location.pathname === ROUTES.DASHBOARD && location.search === '?tab=bookings';
    }
    return location.pathname === path;
  };

  const navItems = [
    {
      label: 'Explore',
      icon: Search,
      path: ROUTES.PROPERTIES,
      active: isActive(ROUTES.PROPERTIES),
    },
    {
      label: 'Favorites',
      icon: Heart,
      path: ROUTES.FAVORITES,
      active: isActive(ROUTES.FAVORITES),
    },
    {
      label: 'My Bookings',
      icon: Calendar,
      path: `${ROUTES.DASHBOARD}?tab=bookings`,
      active: isActive(`${ROUTES.DASHBOARD}?tab=bookings`),
    },
    {
      label: 'Profile',
      icon: User,
      path: ROUTES.PROFILE,
      active: isActive(ROUTES.PROFILE),
    },
  ];

  const navContent = (
    <nav 
      className={`fixed bottom-0 left-0 right-0 z-[9999] bg-white/95 backdrop-blur-xl border-t border-gray-100 md:hidden transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        transform: isVisible ? 'translateZ(0) translateY(0)' : 'translateZ(0) translateY(100%)',
        WebkitTransform: isVisible ? 'translateZ(0) translateY(0)' : 'translateZ(0) translateY(100%)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)',
      }}
    >
      <div className="flex items-center justify-around h-16 px-2 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ease-out rounded-xl group ${
                item.active
                  ? 'text-[#1a1a1a]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {/* Active indicator background */}
              {item.active && (
                <div 
                  className="absolute inset-0 rounded-xl transition-all duration-200"
                  style={{
                    backgroundColor: 'rgba(26, 26, 26, 0.06)',
                  }}
                />
              )}
              
              {/* Active indicator dot */}
              {item.active && (
                <div 
                  className="absolute top-1.5 w-1 h-1 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: '#1a1a1a',
                  }}
                />
              )}
              
              <div className="relative flex flex-col items-center justify-center gap-1">
                <Icon
                  className={`w-5 h-5 transition-all duration-200 ${
                    item.active 
                      ? 'text-[#1a1a1a] scale-110' 
                      : 'text-gray-400 group-hover:scale-105'
                  }`}
                  strokeWidth={item.active ? 2.5 : 2}
                  fill={item.active ? '#1a1a1a' : 'none'}
                />
                <span
                  className={`text-[10px] font-semibold tracking-wide transition-all duration-200 ${
                    item.active 
                      ? 'text-[#1a1a1a]' 
                      : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );

  // Render to document body using portal to ensure it's always fixed to viewport
  return typeof document !== 'undefined' 
    ? createPortal(navContent, document.body)
    : navContent;
};

export default BottomNavigation;

