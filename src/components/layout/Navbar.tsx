import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { ROUTES } from '../../constants';
import { Menu, X, User, LogOut, Calendar, Heart, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useIsAdmin } from '../../utils/admin';

const PALETTE = {
  dark: '#1a1a1a',
  dark80: 'rgba(26,26,26,0.8)',
  dark60: 'rgba(26,26,26,0.6)',
  dark20: 'rgba(26,26,26,0.2)',
  white: '#fff',
  white80: 'rgba(255,255,255,0.8)',
  accent: '#2563eb', // fallback for logo, can be changed
  gray: '#e5e5e5',
};

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const isAdmin = useIsAdmin();
  const { scrollY } = useScroll();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 50);
  });

  const navItems = [
    { label: 'Home', path: ROUTES.HOME },
    { label: 'Properties', path: ROUTES.PROPERTIES },
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

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      // Store the current scroll position
      const scrollY = window.scrollY;
      
      // Prevent scrolling by setting overflow hidden and fixing position
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scrolling
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      
      // Restore scroll position
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    // Cleanup function
    return () => {
      if (isMenuOpen) {
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
      }
    };
  }, [isMenuOpen]);

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
    <>
      {/* Main Navbar */}
      <motion.nav
        initial={false}
        animate={{
          backgroundColor: isScrolled ? PALETTE.white80 : 'rgba(255,255,255,0)',
          backdropFilter: isScrolled ? 'blur(12px)' : 'blur(0px)',
          borderRadius: isScrolled ? '9999px' : '0px',
          borderWidth: isScrolled ? '1px' : '0px',
          borderColor: isScrolled ? PALETTE.gray : 'rgba(229,229,229,0)',
        }}
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 200,
        }}
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 ${
          isScrolled
            ? 'shadow-lg shadow-black/10 border w-[calc(100%-2rem)] max-w-4xl'
            : 'w-full'
        }`}
        style={{
          borderColor: isScrolled ? PALETTE.gray : 'rgba(229,229,229,0)',
        }}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to={ROUTES.HOME}
                className="flex items-center space-x-3"
              >
                <motion.div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center`}
                  animate={{
                    backgroundColor: isScrolled ? PALETTE.dark : PALETTE.dark20,
                  }}
                  style={{
                    backgroundColor: isScrolled ? PALETTE.dark : PALETTE.dark20,
                  }}
                >
                  <span className="font-bold text-sm" style={{ color: PALETTE.white }}>
                    MH
                  </span>
                </motion.div>
                
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 rounded-full text-sm font-medium`}
                  style={{
                    color: isActive(item.path)
                      ? isScrolled
                        ? PALETTE.dark
                        : PALETTE.white
                      : isScrolled
                        ? PALETTE.dark60
                        : 'rgba(255,255,255,0.8)',
                  }}
                >
                  {item.label}
                  {isActive(item.path) && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: isScrolled ? PALETTE.dark20 : 'rgba(255,255,255,0.2)',
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              ))}
            </nav>

            {/* Desktop Auth Buttons / User Menu */}
            <div className="hidden md:flex items-center space-x-3 ml-4">
              {loading ? (
                <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              ) : user ? (
                <div className="relative" ref={dropdownRef}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-full transition-colors"
                    style={{
                      backgroundColor: isScrolled ? 'rgba(26,26,26,0.05)' : 'rgba(255,255,255,0.1)',
                      color: isScrolled ? PALETTE.dark : PALETTE.white,
                    }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                      style={{ backgroundColor: isScrolled ? PALETTE.dark : 'rgba(255,255,255,0.2)' }}
                    >
                      {getUserInitials()}
                    </div>
                    <span className="text-sm font-medium hidden lg:block">{getUserDisplayName()}</span>
                  </motion.button>

                  {/* Profile Dropdown */}
                  {isProfileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200"
                    >
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
                        to={ROUTES.FAVORITES}
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Favorites
                      </Link>
                      {isAdmin && (
                        <Link
                          to={ROUTES.ADMIN_DASHBOARD}
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Admin Dashboard
                        </Link>
                      )}
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </div>
              ) : (
                <>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to={ROUTES.LOGIN}
                      className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
                      style={{
                        color: isScrolled ? PALETTE.dark : PALETTE.white,
                        backgroundColor: isScrolled ? 'rgba(26,26,26,0.05)' : 'rgba(255,255,255,0.1)',
                      }}
                    >
                      Sign In
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to={ROUTES.REGISTER}
                      className="px-4 py-2 rounded-full text-sm font-medium text-white transition-colors"
                      style={{
                        backgroundColor: isScrolled ? PALETTE.dark : 'rgba(255,255,255,0.2)',
                      }}
                    >
                      Sign Up
                    </Link>
                  </motion.div>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-full"
              style={{
                color: isScrolled ? PALETTE.dark : PALETTE.white,
                background: isScrolled ? 'rgba(26,26,26,0.05)' : 'rgba(255,255,255,0.1)',
              }}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu - Fullscreen */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(20px)',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem',
          opacity: isMenuOpen ? 1 : 0,
          visibility: isMenuOpen ? 'visible' : 'hidden',
          transition: 'opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), visibility 0.4s',
          transform: isMenuOpen ? 'scale(1)' : 'scale(1.02)',
          transformOrigin: 'center'
        }}
      >
        {/* Navigation Items */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginBottom: '4rem' }}>
          {navItems.map((item, index) => (
            <div
              key={item.path}
              style={{
                opacity: isMenuOpen ? 1 : 0,
                transform: isMenuOpen ? 'translateY(0px)' : 'translateY(30px)',
                transitionProperty: 'all',
                transitionDuration: '0.6s',
                transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                transitionDelay: isMenuOpen ? `${150 + index * 100}ms` : '0ms'
              }}
            >
              <Link
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                style={{
                  fontSize: '3.5rem',
                  fontWeight: '200',
                  color: isActive(item.path) ? PALETTE.dark : PALETTE.dark60,
                  textDecoration: 'none',
                  letterSpacing: '-0.025em',
                  display: 'block',
                  textAlign: 'center',
                  transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  position: 'relative',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  const target = e.currentTarget as HTMLElement;
                  target.style.transform = 'translateY(-3px) scale(1.05)';
                  target.style.color = PALETTE.dark;
                  target.style.textShadow = '0 10px 30px rgba(26,26,26,0.1)';
                  // Animate hover underline
                  const hoverUnderline = target.querySelector('.hover-underline') as HTMLElement;
                  if (hoverUnderline && !isActive(item.path)) {
                    hoverUnderline.style.transform = 'translateX(-50%) scaleX(1)';
                  }
                }}
                onMouseLeave={(e) => {
                  const target = e.currentTarget as HTMLElement;
                  target.style.transform = 'translateY(0px) scale(1)';
                  target.style.color = isActive(item.path) ? PALETTE.dark : PALETTE.dark60;
                  target.style.textShadow = 'none';
                  // Reset hover underline
                  const hoverUnderline = target.querySelector('.hover-underline') as HTMLElement;
                  if (hoverUnderline) {
                    hoverUnderline.style.transform = 'translateX(-50%) scaleX(0)';
                  }
                }}
              >
                {item.label}
                {/* Active indicator with smooth animation */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-0.75rem',
                    left: '50%',
                    transform: `translateX(-50%) scaleX(${isActive(item.path) ? 1 : 0})`,
                    width: '80%',
                    height: '0.25rem',
                    backgroundColor: PALETTE.dark,
                    borderRadius: '9999px',
                    transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    transformOrigin: 'center'
                  }}
                />
                {/* Hover underline */}
                <div
                  className="hover-underline"
                  style={{
                    position: 'absolute',
                    bottom: '-0.75rem',
                    left: '50%',
                    transform: 'translateX(-50%) scaleX(0)',
                    width: '100%',
                    height: '0.125rem',
                    backgroundColor: PALETTE.dark20,
                    borderRadius: '9999px',
                    transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    transformOrigin: 'center'
                  }}
                />
              </Link>
            </div>
          ))}
        </div>

        {/* Auth Section */}
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '1rem',
            marginTop: '2rem',
            opacity: isMenuOpen ? 1 : 0,
            transform: isMenuOpen ? 'translateY(0px)' : 'translateY(20px)',
            transitionProperty: 'all',
            transitionDuration: '0.6s',
            transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            transitionDelay: isMenuOpen ? '550ms' : '0ms'
          }}
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          ) : user ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <p style={{ fontSize: '1.25rem', fontWeight: '500', color: PALETTE.dark, marginBottom: '0.25rem' }}>
                  {getUserDisplayName()}
                </p>
                <p style={{ fontSize: '0.875rem', color: PALETTE.dark60 }}>{user.email}</p>
              </div>
              <Link
                to={ROUTES.PROFILE}
                onClick={() => setIsMenuOpen(false)}
                style={{
                  fontSize: '1.5rem',
                  fontWeight: '300',
                  color: PALETTE.dark60,
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = PALETTE.dark;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = PALETTE.dark60;
                  e.currentTarget.style.transform = 'translateY(0px)';
                }}
              >
                My Profile
              </Link>
              <Link
                to={ROUTES.DASHBOARD}
                onClick={() => setIsMenuOpen(false)}
                style={{
                  fontSize: '1.5rem',
                  fontWeight: '300',
                  color: PALETTE.dark60,
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = PALETTE.dark;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = PALETTE.dark60;
                  e.currentTarget.style.transform = 'translateY(0px)';
                }}
              >
                Dashboard
              </Link>
              {isAdmin && (
                <Link
                  to={ROUTES.ADMIN_DASHBOARD}
                  onClick={() => setIsMenuOpen(false)}
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: '300',
                    color: PALETTE.dark60,
                    textDecoration: 'none',
                    padding: '0.5rem 1rem',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = PALETTE.dark;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = PALETTE.dark60;
                    e.currentTarget.style.transform = 'translateY(0px)';
                  }}
                >
                  Admin Dashboard
                </Link>
              )}
              <button
                onClick={() => {
                  handleSignOut();
                  setIsMenuOpen(false);
                }}
                style={{
                  fontSize: '1.5rem',
                  fontWeight: '300',
                  color: '#ef4444',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0px)';
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to={ROUTES.LOGIN}
                onClick={() => setIsMenuOpen(false)}
                style={{
                  fontSize: '1.5rem',
                  fontWeight: '300',
                  color: PALETTE.dark60,
                  textDecoration: 'none',
                  padding: '0.75rem 2rem',
                  border: `1px solid ${PALETTE.gray}`,
                  borderRadius: '9999px',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = PALETTE.dark;
                  e.currentTarget.style.borderColor = PALETTE.dark;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = PALETTE.dark60;
                  e.currentTarget.style.borderColor = PALETTE.gray;
                  e.currentTarget.style.transform = 'translateY(0px)';
                }}
              >
                Sign In
              </Link>
              <Link
                to={ROUTES.REGISTER}
                onClick={() => setIsMenuOpen(false)}
                style={{
                  fontSize: '1.5rem',
                  fontWeight: '400',
                  color: PALETTE.white,
                  textDecoration: 'none',
                  padding: '0.75rem 2rem',
                  backgroundColor: PALETTE.dark,
                  borderRadius: '9999px',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Close Button with refined animation */}
        <div
          style={{
            opacity: isMenuOpen ? 1 : 0,
            transform: isMenuOpen ? 'translateY(0px) scale(1)' : 'translateY(20px) scale(0.9)',
            transitionProperty: 'all',
            transitionDuration: '0.5s',
            transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            transitionDelay: isMenuOpen ? '650ms' : '0ms',
            marginTop: '2rem'
          }}
        >
          <button
            onClick={() => setIsMenuOpen(false)}
            style={{
              padding: '0.875rem 2rem',
              backgroundColor: 'rgba(255,255,255,0.8)',
              color: PALETTE.dark60,
              border: `1px solid ${PALETTE.gray}`,
              borderRadius: '9999px',
              fontSize: '1rem',
              fontWeight: '400',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.95)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)';
              e.currentTarget.style.color = PALETTE.dark;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0px) scale(1)';
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.8)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)';
              e.currentTarget.style.color = PALETTE.dark60;
            }}
          >
            Close Menu
          </button>
        </div>
      </div>
    </>
  );
};

export default Navbar;