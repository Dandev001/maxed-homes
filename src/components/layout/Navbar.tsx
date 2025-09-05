import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { ROUTES} from '../../constants';
import { Menu, X } from 'lucide-react';

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
  const location = useLocation();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 50);
  });

  const navItems = [
    { label: 'Home', path: ROUTES.HOME },
    { label: 'About', path: ROUTES.ABOUT },
    { label: 'Contact', path: ROUTES.CONTACT },
  ];

  const isActive = (path: string) => location.pathname === path;

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
          borderColor: isScrolled ? PALETTE.gray : 'transparent',
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
          borderColor: isScrolled ? PALETTE.gray : 'transparent',
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
                transition: `all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
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
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                  e.currentTarget.style.color = PALETTE.dark;
                  e.currentTarget.style.textShadow = '0 10px 30px rgba(26,26,26,0.1)';
                  // Animate hover underline
                  const hoverUnderline = e.currentTarget.querySelector('.hover-underline');
                  if (hoverUnderline && !isActive(item.path)) {
                    hoverUnderline.style.transform = 'translateX(-50%) scaleX(1)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                  e.currentTarget.style.color = isActive(item.path) ? PALETTE.dark : PALETTE.dark60;
                  e.currentTarget.style.textShadow = 'none';
                  // Reset hover underline
                  const hoverUnderline = e.currentTarget.querySelector('.hover-underline');
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

        {/* Close Button with refined animation */}
        <div
          style={{
            opacity: isMenuOpen ? 1 : 0,
            transform: isMenuOpen ? 'translateY(0px) scale(1)' : 'translateY(20px) scale(0.9)',
            transition: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            transitionDelay: isMenuOpen ? '450ms' : '0ms'
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