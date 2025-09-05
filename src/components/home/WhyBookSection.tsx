import { motion } from 'framer-motion';
import { fadeInUp, fadeInUpDelay, scaleIn, slideInLeft } from '../../utils/animations';
import houseImage from '../../assets/images/house.jpg';
import roadImage from '../../assets/images/road.jpg';

const WhyBookSection = () => {
  return (
    <section className="relative z-10 py-12 sm:py-16 lg:py-20 bg-neutral-800">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div 
          className="mb-8 sm:mb-12 lg:mb-16 text-center"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          style={{ willChange: 'transform, opacity' }}
        >
          <motion.h2 
            className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-wide leading-tight mb-6 text-neutral-50"
            variants={fadeInUpDelay}
            custom={1}
            style={{ willChange: 'transform, opacity' }}
          >
            Why book with Maxed Homes
          </motion.h2>
          
          {/* Gentle divider */}
          <div className="w-16 h-px bg-neutral-700 mx-auto mb-6"></div>
          
          <motion.p 
            className="text-base sm:text-lg font-normal leading-relaxed max-w-2xl mx-auto text-neutral-300"
            variants={fadeInUpDelay}
            custom={2}
            style={{ willChange: 'transform, opacity' }}
          >
            Creating exceptional experiences through thoughtful curation, dedicated support, and local expertise
          </motion.p>
        </motion.div>

        {/* Content sections */}
        <div className="space-y-12 sm:space-y-16 lg:space-y-20">
          
          {/* Curated Homes */}
          <motion.div
            className="relative"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Content Box */}
              <div className="order-2 lg:order-1">
                <div className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-600 rounded-3xl p-8 sm:p-10 lg:p-12">
                  {/* Title with subtle accent */}
                  <div className="mb-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-2 h-2 rounded-full bg-neutral-600"></div>
                      <span className="text-sm font-medium tracking-wide text-neutral-400 uppercase">Quality</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-normal tracking-wide leading-relaxed text-neutral-50">
                      Thoughtfully curated homes
                    </h3>
                  </div>
                  
                  {/* Description */}
                  <p className="text-base sm:text-lg font-normal leading-relaxed mb-8 text-neutral-300">
                    Every property is handpicked and quality-checked to ensure comfort, reliability, and memorable experiences
                  </p>
                  
                  {/* Service list */}
                  <div className="space-y-3">
                    {[
                      'Quality verified properties',
                      'Professional photography',
                      'Detailed and honest listings',
                      'Transparent pricing'
                    ].map((service, index) => (
                      <motion.div 
                        key={index} 
                        className="flex items-center gap-4"
                        variants={slideInLeft}
                        initial="hidden"
                        whileInView="visible"
                        custom={index}
                        viewport={{ once: true }}
                        style={{ willChange: 'transform, opacity' }}
                      >
                        <div className="w-1 h-1 rounded-full bg-neutral-500"></div>
                        <span className="font-medium text-sm sm:text-base tracking-wide text-neutral-200">{service}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Image */}
              <div className="order-1 lg:order-2">
                <motion.div 
                  className="rounded-3xl overflow-hidden"
                  variants={scaleIn}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  style={{ willChange: 'transform, opacity' }}
                >
                  <img src={houseImage} className="w-full h-64 sm:h-80 lg:h-96 object-cover" alt="Curated homes" />
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Better Support */}
          <motion.div
            className="relative"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Image */}
              <div className="order-1">
                <motion.div 
                  className="rounded-3xl overflow-hidden"
                  variants={scaleIn}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  style={{ willChange: 'transform, opacity' }}
                >
                  <img src={roadImage} className="w-full h-64 sm:h-80 lg:h-96 object-cover" alt="Dedicated support" />
                </motion.div>
              </div>
              
              {/* Content Box */}
              <div className="order-2">
                <div className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-600 rounded-3xl p-8 sm:p-10 lg:p-12">
                  {/* Title with subtle accent */}
                  <div className="mb-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-2 h-2 rounded-full bg-neutral-600"></div>
                      <span className="text-sm font-medium tracking-wide text-neutral-400 uppercase">Support</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-normal tracking-wide leading-relaxed text-neutral-50">
                      Dedicated guest care
                    </h3>
                  </div>
                  
                  {/* Description */}
                  <p className="text-base sm:text-lg font-normal leading-relaxed mb-8 text-neutral-300">
                    Our team is always available to help you before, during, and after your stay with responsive care
                  </p>
                  
                  {/* Service list */}
                  <div className="space-y-3">
                    {[
                      'Round-the-clock availability',
                      'Instant response times',
                      'Local assistance network',
                      'Proactive problem solving'
                    ].map((service, index) => (
                      <motion.div 
                        key={index} 
                        className="flex items-center gap-4"
                        variants={slideInLeft}
                        initial="hidden"
                        whileInView="visible"
                        custom={index}
                        viewport={{ once: true }}
                        style={{ willChange: 'transform, opacity' }}
                      >
                        <div className="w-1 h-1 rounded-full bg-neutral-500"></div>
                        <span className="font-medium text-sm sm:text-base tracking-wide text-neutral-200">{service}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Local Insights */}
          <motion.div
            className="relative"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Content Box */}
              <div className="order-2 lg:order-1">
                <div className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-600 rounded-3xl p-8 sm:p-10 lg:p-12">
                  {/* Title with subtle accent */}
                  <div className="mb-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-2 h-2 rounded-full bg-neutral-600"></div>
                      <span className="text-sm font-medium tracking-wide text-neutral-400 uppercase">Local</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-normal tracking-wide leading-relaxed text-neutral-50">
                      Local expertise and insights
                    </h3>
                  </div>
                  
                  {/* Description */}
                  <p className="text-base sm:text-lg font-normal leading-relaxed mb-8 text-neutral-300">
                    Benefit from our deep knowledge of Benin and beyond for authentic, enriching local experiences
                  </p>
                  
                  {/* Service list */}
                  <div className="space-y-3">
                    {[
                      'Cultural guidance and tips',
                      'Hidden gems and local favorites',
                      'Trusted local connections',
                      'Authentic experience recommendations'
                    ].map((service, index) => (
                      <motion.div 
                        key={index} 
                        className="flex items-center gap-4"
                        variants={slideInLeft}
                        initial="hidden"
                        whileInView="visible"
                        custom={index}
                        viewport={{ once: true }}
                        style={{ willChange: 'transform, opacity' }}
                      >
                        <div className="w-1 h-1 rounded-full bg-neutral-500"></div>
                        <span className="font-medium text-sm sm:text-base tracking-wide text-neutral-200">{service}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Image */}
              <div className="order-1 lg:order-2">
                <motion.div 
                  className="rounded-3xl overflow-hidden"
                  variants={scaleIn}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  style={{ willChange: 'transform, opacity' }}
                >
                  <img src={houseImage} className="w-full h-64 sm:h-80 lg:h-96 object-cover" alt="Local insights" />
                </motion.div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default WhyBookSection;