import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { User, LogOut, Calendar, Settings, Heart } from 'lucide-react';
import { ROUTES, APP_CONFIG } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { label: 'Home', path: ROUTES.HOME },
    { label: 'About', path: ROUTES.ABOUT },
    { label: 'Contact', path: ROUTES.CONTACT },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  const handleSignOut = async () => {
    await signOut();
    setIsProfileDropdownOpen(false);
    navigate(ROUTES.HOME);
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">MH</span>
            </div>
            <span className="text-xl font-bold text-gray-900">{APP_CONFIG.NAME}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons / User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {getUserInitials()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{getUserDisplayName()}</span>
                </button>

                {/* Profile Dropdown */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{getUserDisplayName()}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      to={ROUTES.PROFILE}
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <User className="w-4 h-4 mr-2" />
                      My Profile
                    </Link>
                    <Link
                      to={ROUTES.DASHBOARD}
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                    <Link
                      to={`${ROUTES.DASHBOARD}?tab=bookings`}
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      My Bookings
                    </Link>
                    <Link
                      to={ROUTES.FAVORITES}
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Favorites
                    </Link>
                    <Link
                      to={ROUTES.SETTINGS}
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to={ROUTES.LOGIN}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive(item.path)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t pt-4 space-y-1">
                {loading ? (
                  <div className="px-3 py-2 text-center">
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : user ? (
                  <>
                    <div className="px-3 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{getUserDisplayName()}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      to={ROUTES.PROFILE}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    >
                      <User className="w-4 h-4 mr-2" />
                      My Profile
                    </Link>
                    <Link
                      to={ROUTES.DASHBOARD}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                    <Link
                      to={`${ROUTES.DASHBOARD}?tab=bookings`}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      My Bookings
                    </Link>
                    <Link
                      to={ROUTES.FAVORITES}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Favorites
                    </Link>
                    <Link
                      to={ROUTES.SETTINGS}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to={ROUTES.LOGIN}
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    >
                      Sign In
                    </Link>
                    <Link
                      to={ROUTES.REGISTER}
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 