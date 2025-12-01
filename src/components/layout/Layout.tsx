import { Outlet, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import BottomNavigation from './BottomNavigation';
import { ROUTES } from '../../constants';

interface LayoutProps {
  children?: ReactNode;
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
}

const Layout = ({ 
  children, 
  className = '', 
  showHeader = true, 
  showFooter = true 
}: LayoutProps) => {
  const location = useLocation();
  
  // Hide navbar on properties page, property detail page, booking page, favorites page, dashboard page, profile page, and admin pages
  const shouldShowHeader = showHeader && 
    location.pathname !== ROUTES.PROPERTIES && 
    location.pathname !== ROUTES.FAVORITES &&
    location.pathname !== ROUTES.DASHBOARD &&
    location.pathname !== ROUTES.PROFILE &&
    !location.pathname.includes('/properties/') &&
    !location.pathname.includes('/booking/') &&
    !location.pathname.startsWith('/admin');
  
  // Don't show footer on property detail page, booking page, dashboard page, and admin pages
  const shouldShowFooter = showFooter && 
    location.pathname !== ROUTES.DASHBOARD &&
    !location.pathname.includes('/properties/') &&
    !location.pathname.includes('/booking/') &&
    !location.pathname.startsWith('/admin');
  
  // Check if this is an admin page
  const isAdminPage = location.pathname.startsWith('/admin');
  
  // Check if this is a property detail page or booking page
  const isPropertyDetailPage = location.pathname.includes('/properties/');
  const isBookingPage = location.pathname.includes('/booking/');
  
  // Check if this is the dashboard page
  const isDashboardPage = location.pathname === ROUTES.DASHBOARD;
  
  // Check if this is the profile page
  const isProfilePage = location.pathname === ROUTES.PROFILE;
  
  // For admin pages, don't show navbar/footer/bottom nav (admin dashboard has its own layout)
  if (isAdminPage) {
    return (
      <div className={className}>
        {children || <Outlet />}
      </div>
    );
  }
  
  // For dashboard page, show bottom nav but not navbar/footer (dashboard has its own header)
  if (isDashboardPage) {
    return (
      <div className={`min-h-screen ${className}`}>
        {children || <Outlet />}
        <BottomNavigation />
      </div>
    );
  }
  
  // For profile page, show bottom nav but not navbar/footer (profile has its own header)
  if (isProfilePage) {
    return (
      <div className={`min-h-screen ${className}`}>
        {children || <Outlet />}
        <BottomNavigation />
      </div>
    );
  }
  
  // For property detail pages and booking pages, use minimal layout to avoid interference with fixed elements
  if (isPropertyDetailPage || isBookingPage) {
    return (
      <div className={`min-h-screen ${className}`}>
        {shouldShowHeader && <Navbar />}
        
        {/* Property detail and booking pages handle their own layout structure */}
        <div className="pb-16 md:pb-0">
          {children || <Outlet />}
        </div>
        
        {shouldShowFooter && <Footer />}
        <BottomNavigation />
      </div>
    );
  }
  
  // Default layout for other pages
  return (
    <div className={`min-h-screen flex flex-col ${className}`}>
      {shouldShowHeader && <Navbar />}
      
      <main className="flex-1 pb-16 md:pb-0">
        {children || <Outlet />}
      </main>
      
      {shouldShowFooter && <Footer />}
      <BottomNavigation />
    </div>
  );
};

export default Layout; 