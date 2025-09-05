import { Outlet } from 'react-router-dom';
import type { BaseComponentProps } from '../../types';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps extends BaseComponentProps {
  showHeader?: boolean;
  showFooter?: boolean;
}

const Layout = ({ 
  children, 
  className = '', 
  showHeader = true, 
  showFooter = true 
}: LayoutProps) => {
  return (
    <div className={`min-h-screen flex flex-col ${className}`}>
      {showHeader && <Navbar />}
      
      <main className="flex-1">
        {children || <Outlet />}
      </main>
      
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout; 