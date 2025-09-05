import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeInUp, fadeInUpDelay } from '../../utils/animations';
import { ROUTES } from '../../constants';

const WhatWeOfferSection = () => {
  return (
    <section className="relative z-10 py-10 sm:py-12 lg:py-16 bg-neutral-800 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div 
          className="mb-8 sm:mb-12 text-center"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          style={{ willChange: 'transform, opacity' }}
        >
          <motion.h2 
            className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-wide leading-tight mb-4 text-neutral-50"
            variants={fadeInUpDelay}
            custom={1}
            style={{ willChange: 'transform, opacity' }}
          >
            What we offer
          </motion.h2>
          
          <motion.p 
            className="text-sm sm:text-base font-normal leading-relaxed max-w-xl mx-auto text-neutral-300"
            variants={fadeInUpDelay}
            custom={2}
            style={{ willChange: 'transform, opacity' }}
          >
            Comprehensive services to maximize your property's potential
          </motion.p>
        </motion.div>

        {/* Services Grid - Compact Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          
          {/* Property Listing Management */}
          <motion.div
            className="bg-neutral-900 border border-neutral-600 rounded-3xl p-6 sm:p-8 group hover:shadow-lg transition-all duration-300"
            variants={fadeInUpDelay}
            initial="hidden"
            whileInView="visible"
            custom={0}
            viewport={{ once: true, margin: "-100px" }}
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="flex items-start gap-6">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-neutral-50 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="mb-4">
                  <span className="text-xs font-medium tracking-wide text-neutral-400 uppercase">Management</span>
                  <h3 className="text-lg sm:text-xl font-medium tracking-wide leading-tight text-neutral-50 mt-1">
                    Property listing optimization
                  </h3>
                </div>
                
                <p className="text-sm sm:text-base font-normal leading-relaxed mb-5 text-neutral-300">
                  Complete optimization from photography to profit maximization through strategic management
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    'Professional photography',
                    'Virtual tours',
                    'Multi-platform optimization',
                    'Dynamic pricing',
                    'Guest communication',
                    'Performance analytics'
                  ].map((service, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-neutral-500 flex-shrink-0"></div>
                      <span className="text-sm font-medium text-neutral-300">{service}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Guest Experience Management */}
          <motion.div
            className="bg-neutral-900 border border-neutral-600 rounded-3xl p-6 sm:p-8 group hover:shadow-lg transition-all duration-300"
            variants={fadeInUpDelay}
            initial="hidden"
            whileInView="visible"
            custom={1}
            viewport={{ once: true, margin: "-100px" }}
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="flex items-start gap-6">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-neutral-50 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="mb-4">
                  <span className="text-xs font-medium tracking-wide text-neutral-400 uppercase">Experience</span>
                  <h3 className="text-lg sm:text-xl font-medium tracking-wide leading-tight text-neutral-50 mt-1">
                    Guest experience management
                  </h3>
                </div>
                
                <p className="text-sm sm:text-base font-normal leading-relaxed mb-5 text-neutral-300">
                  Comprehensive guest care and property maintenance with attention to every detail, 24/7
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    '24/7 guest support',
                    'Concierge services',
                    'Professional cleaning',
                    'Check-in coordination',
                    'Local recommendations',
                    'Emergency response'
                  ].map((service, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-neutral-500 flex-shrink-0"></div>
                      <span className="text-sm font-medium text-neutral-300">{service}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Call to Action - Compact Style */}
        <motion.div
          className="mt-8 sm:mt-12 text-center"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          style={{ willChange: 'transform, opacity' }}
        >
          <div className="bg-neutral-50 text-neutral-900 rounded-3xl p-6 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-light tracking-wide leading-tight mb-3 text-neutral-900">
              Ready to maximize your property?
            </h3>
            
            <p className="text-sm sm:text-base font-normal leading-relaxed mb-5 text-neutral-700 max-w-lg mx-auto">
              Partner with us to unlock your property's full potential
            </p>
            
            <div className="flex flex-row gap-3 justify-center items-center">
              <Link
                to={ROUTES.CONTACT}
                className="bg-neutral-900 text-neutral-50 px-6 py-3 font-medium text-sm tracking-wide rounded-lg hover:bg-neutral-800 transition-all duration-300 inline-block"
              >
                Get started today
              </Link>
              <Link
                to={ROUTES.PROPERTIES}
                className="border border-neutral-400 text-neutral-700 px-6 py-3 font-medium text-sm tracking-wide rounded-lg hover:border-neutral-600 hover:bg-neutral-100 transition-all duration-300 inline-block"
              >
                View properties
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default WhatWeOfferSection;