import { motion } from 'framer-motion';
import { fadeInUp, fadeInUpDelay } from '../../utils/animations';
import AnimatedStat from './AnimatedStat';

const StatsSection = () => {
  return (
    <section className="relative z-10 py-12 sm:py-16 lg:py-20 bg-white">
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
            className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-wide leading-tight mb-6 text-neutral-900"
            variants={fadeInUpDelay}
            custom={1}
            style={{ willChange: 'transform, opacity' }}
          >
            Excellence in numbers
          </motion.h2>
          
          {/* Gentle divider */}
          <div className="w-16 h-px bg-neutral-200 mx-auto mb-6"></div>
          
          <motion.p 
            className="text-base sm:text-lg font-normal leading-relaxed max-w-2xl mx-auto text-neutral-700"
            variants={fadeInUpDelay}
            custom={2}
            style={{ willChange: 'transform, opacity' }}
          >
            Our commitment to quality and service reflected in meaningful metrics
          </motion.p>
        </motion.div>

        {/* Stats Grid - Clean Layout */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Stat 1 */}
          <motion.div 
            className="text-center"
            variants={fadeInUpDelay}
            initial="hidden"
            whileInView="visible"
            custom={0}
            viewport={{ once: true, margin: "-100px" }}
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="flex items-center justify-center mb-4">
              <div className="w-2 h-2 rounded-full bg-neutral-300"></div>
            </div>
            
            <div className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-wide leading-none mb-3 text-neutral-900">
              <AnimatedStat 
                endValue={100} 
                suffix="%" 
                label="" 
                duration={2500}
              />
            </div>
            
            <div className="text-sm sm:text-base font-medium tracking-wide text-neutral-700 leading-relaxed">
              Quality<br />commitment
            </div>
          </motion.div>

          {/* Stat 2 */}
          <motion.div 
            className="text-center"
            variants={fadeInUpDelay}
            initial="hidden"
            whileInView="visible"
            custom={1}
            viewport={{ once: true, margin: "-100px" }}
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="flex items-center justify-center mb-4">
              <div className="w-2 h-2 rounded-full bg-neutral-300"></div>
            </div>
            
            <div className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-wide leading-none mb-3 text-neutral-900">
              <AnimatedStat 
                endValue={8} 
                suffix="+" 
                label="" 
                duration={2000}
              />
            </div>
            
            <div className="text-sm sm:text-base font-medium tracking-wide text-neutral-700 leading-relaxed">
              Curated<br />properties
            </div>
          </motion.div>

          {/* Stat 3 */}
          <motion.div 
            className="text-center"
            variants={fadeInUpDelay}
            initial="hidden"
            whileInView="visible"
            custom={2}
            viewport={{ once: true, margin: "-100px" }}
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="flex items-center justify-center mb-4">
              <div className="w-2 h-2 rounded-full bg-neutral-300"></div>
            </div>
            
            <div className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-wide leading-none mb-3 text-neutral-900">
              <AnimatedStat 
                endValue={3} 
                suffix="+" 
                label="" 
                duration={1500}
              />
            </div>
            
            <div className="text-sm sm:text-base font-medium tracking-wide text-neutral-700 leading-relaxed">
              Cities in Benin<br />& beyond
            </div>
          </motion.div>

          {/* Stat 4 */}
          <motion.div 
            className="text-center"
            variants={fadeInUpDelay}
            initial="hidden"
            whileInView="visible"
            custom={3}
            viewport={{ once: true, margin: "-100px" }}
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="flex items-center justify-center mb-4">
              <div className="w-2 h-2 rounded-full bg-neutral-300"></div>
            </div>
            
            <div className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-wide leading-none mb-3 text-neutral-900">
              <AnimatedStat 
                endValue={25} 
                suffix="+" 
                label="" 
                duration={3000}
              />
            </div>
            
            <div className="text-sm sm:text-base font-medium tracking-wide text-neutral-700 leading-relaxed">
              Early<br />adopters
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;