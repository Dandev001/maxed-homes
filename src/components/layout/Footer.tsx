import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { APP_CONFIG, ROUTES } from '../../constants';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const essentialLinks = [
    { label: 'About', path: ROUTES.ABOUT },
    { label: 'Contact', path: ROUTES.CONTACT },
    { label: 'Privacy', path: '#' },
  ];

  // Social media icons
  const socialIcons = {
    instagram: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    twitter: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    linkedin: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    )
  };

  return (
    <footer className="bg-neutral-900 text-neutral-50 border-t border-neutral-700">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="py-12 sm:py-16 lg:py-20">
          
          {/* Main Content */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16 items-start"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
            viewport={{ once: true }}
          >
            
            {/* Brand */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-neutral-600"></div>
                <span className="text-sm font-medium tracking-wide text-neutral-400 uppercase">Brand</span>
              </div>
              
              <div>
                <Link to={ROUTES.HOME} className="group">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 bg-neutral-50 rounded-lg flex items-center justify-center group-hover:bg-neutral-200 transition-colors duration-300">
                      <span className="text-neutral-900 font-medium text-sm tracking-wide">MH</span>
                    </div>
                    <span className="text-xl sm:text-2xl font-light tracking-wide text-neutral-50 group-hover:text-neutral-300 transition-colors duration-300">
                      {APP_CONFIG.NAME}
                    </span>
                  </div>
                </Link>
                <p className="text-base font-normal leading-relaxed text-neutral-300 max-w-sm">
                  Creating exceptional rental experiences through thoughtful curation and dedicated service
                </p>
              </div>
            </motion.div>

            {/* Links */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-neutral-600"></div>
                <span className="text-sm font-medium tracking-wide text-neutral-400 uppercase">Navigate</span>
              </div>
              
              <div className="space-y-4">
                {essentialLinks.map((link, index) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                    viewport={{ once: true }}
                  >
                    <Link
                      to={link.path}
                      className="text-base font-medium tracking-wide text-neutral-200 hover:text-neutral-50 transition-colors duration-300 block"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Contact & Social */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-neutral-600"></div>
                <span className="text-sm font-medium tracking-wide text-neutral-400 uppercase">Connect</span>
              </div>
              
              <div className="space-y-4">
                <p className="text-base font-normal leading-relaxed text-neutral-300">
                  Ready to find your perfect stay?
                </p>
                
                <a
                  href="https://wa.me/+22960000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-neutral-50 text-neutral-900 px-6 py-3 font-medium text-sm tracking-wide rounded-lg hover:bg-neutral-200 transition-all duration-300"
                >
                  WhatsApp us
                </a>
                
                <div className="flex gap-3 pt-2">
                  {[
                    { name: 'Instagram', icon: socialIcons.instagram, href: '#' },
                    { name: 'Twitter', icon: socialIcons.twitter, href: '#' },
                    { name: 'LinkedIn', icon: socialIcons.linkedin, href: '#' }
                  ].map((social, index) => (
                    <motion.a
                      key={social.name}
                      href={social.href}
                      className="w-10 h-10 bg-neutral-800 border border-neutral-600 rounded-lg flex items-center justify-center hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-400 transition-all duration-300"
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                      viewport={{ once: true }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title={social.name}
                    >
                      {social.icon}
                    </motion.a>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>

        </div>

        {/* Bottom */}
        <motion.div 
          className="border-t border-neutral-700 py-6 sm:py-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm font-normal tracking-wide text-neutral-400">
              © {currentYear} {APP_CONFIG.NAME}
            </p>
            <p className="text-sm font-normal tracking-wide text-neutral-400">
              Made with care in Benin
            </p>
          </div>
        </motion.div>
        
      </div>
    </footer>
  );
};

export default Footer; 