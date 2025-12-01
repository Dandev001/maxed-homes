import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ROUTES } from '../constants';
import SEO from '../components/SEO';
import houseImage from '../assets/images/house.jpg';
import house1Image from '../assets/images/house1.jpg';
import roadImage from '../assets/images/road.jpg';

// Custom hook for animated counter (reused from Home)
const useAnimatedCounter = (end: number, duration: number = 2000, start: number = 0) => {
  const [count, setCount] = useState(start);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const startValue = start;
    const endValue = end;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = startValue + (endValue - startValue) * easeOutQuart;
      
      setCount(Math.floor(currentCount));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, end, duration, start]);

  return { count, setIsVisible };
};

// Stats component with intersection observer
const AnimatedStat = ({ 
  endValue, 
  suffix = '', 
  label, 
  duration = 2000 
}: { 
  endValue: number; 
  suffix?: string; 
  label: string; 
  duration?: number;
}) => {
  const { count, setIsVisible } = useAnimatedCounter(endValue, duration);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [setIsVisible]);

  return (
    <div ref={ref}>
      <div className="text-2xl sm:text-3xl lg:text-4xl font-medium text-white mb-1 sm:mb-2">
        {count}{suffix}
      </div>
      <div className="text-white/80 text-sm sm:text-sm lg:text-base">{label}</div>
    </div>
  );
};

const About = () => {
  return (
    <>
      <SEO
        title="About Us"
        description="Learn about Maxed Homes - our mission, vision, and commitment to providing exceptional vacation rental experiences in West Africa. Discover our story and values."
        keywords="about Maxed Homes, vacation rental company, West Africa, hospitality, mission, vision, values"
        url="/about"
      />
      <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section 
        className="relative min-h-screen text-white overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${house1Image})`
        }}
      >
        {/* Background decorative elements */}
        <div className="absolute top-1/4 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-white/5 rounded-full blur-3xl transform translate-x-1/2"></div>
        <div className="absolute bottom-1/4 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-white/5 rounded-full blur-3xl transform -translate-x-1/2"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-40 flex items-center justify-center min-h-screen">
          <div className="text-center w-full">
            <motion.h1 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 sm:mb-8 leading-tight px-4"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              Our Story
            </motion.h1>
            <motion.p 
              className="text-base sm:text-lg md:text-xl lg:text-lg mb-8 sm:mb-12 text-white/90 max-w-4xl mx-auto leading-relaxed px-4"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              Born from a passion for exceptional hospitality and deep love for Benin, Maxed Homes connects travelers with extraordinary places and unforgettable experiences.
            </motion.p>
            
            {/* Stats in hero - Better mobile layout */}
            <motion.div 
              className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-5xl mx-auto mt-12 sm:mt-16 px-4"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            >
              <AnimatedStat 
                endValue={2025} 
                label="Founded" 
                duration={2500}
              />
              <AnimatedStat 
                endValue={8} 
                suffix="+" 
                label="Curated Properties" 
                duration={2000}
              />
              <AnimatedStat 
                endValue={3} 
                suffix="+" 
                label="Cities" 
                duration={1500}
              />
              <AnimatedStat 
                endValue={50} 
                suffix="+" 
                label="Beta Users" 
                duration={3000}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Journey Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1a1a1a] mb-6 sm:mb-8">
                Our Journey
              </h2>
              <div className="space-y-4 sm:space-y-6 text-[#1a1a1a]/80 text-sm sm:text-base lg:text-lg leading-relaxed">
                <p>
                  Maxed Homes began with a simple vision: to redefine short-term rentals in Benin and West Africa. 
                  We saw the untapped potential in our beautiful cities and the need for quality, reliable accommodation 
                  that truly reflects our rich culture and warm hospitality.
                </p>
                <p>
                  Starting with our first carefully selected properties in 2024, we're building a platform that connects 
                  travelers with handpicked homes. Every property in our growing collection is personally vetted, ensuring our 
                  early guests experience the very best our region has to offer.
                </p>
                <p>
                  We're just getting started, but our vision is big: to become West Africa's premier boutique rental platform, 
                  combining modern convenience with authentic local experiences.
                </p>
              </div>
            </motion.div>
            
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div 
                className="rounded-2xl h-96 bg-cover bg-center relative overflow-hidden"
                style={{
                  backgroundImage: `url(${houseImage})`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              </div>
              <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-blue-100 rounded-2xl -z-10 transform -translate-x-2 translate-y-2"></div>
              <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 lg:w-24 lg:h-24 bg-green-100 rounded-full -z-10 transform translate-x-2 -translate-y-2"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12 sm:mb-16 lg:mb-20"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1a1a1a] mb-4 sm:mb-6">
              Mission & Vision
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">
            <motion.div
              className="bg-white rounded-3xl p-6 sm:p-8 lg:p-12 relative overflow-hidden group hover:shadow-2xl transition-all duration-500"
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
              viewport={{ once: true, margin: "-50px" }}
              whileHover={{ y: -10 }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 sm:mb-8">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] mb-4 sm:mb-6">Our Mission</h3>
                <p className="text-[#1a1a1a]/80 text-sm sm:text-base lg:text-lg leading-relaxed">
                  To provide exceptional short-term rental experiences that showcase the beauty, 
                  culture, and hospitality of West Africa while empowering local property owners 
                  and communities through sustainable tourism.
                </p>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-3xl p-6 sm:p-8 lg:p-12 relative overflow-hidden group hover:shadow-2xl transition-all duration-500"
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
              viewport={{ once: true, margin: "-50px" }}
              whileHover={{ y: -10 }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-green-200 rounded-full transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 sm:mb-8">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] mb-4 sm:mb-6">Our Vision</h3>
                <p className="text-[#1a1a1a]/80 text-sm sm:text-base lg:text-lg leading-relaxed">
                  To become the leading platform for authentic, culturally-rich travel experiences 
                  across Africa, setting new standards for quality, service, and community impact 
                  in the hospitality industry.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12 sm:mb-16 lg:mb-20"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1a1a1a] mb-4 sm:mb-6">
              Our Core Values
            </h2>
            <p className="text-base sm:text-base lg:text-lg text-[#1a1a1a]/80 max-w-3xl mx-auto">
              These principles guide everything we do
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: (
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                ),
                title: "Authenticity",
                description: "We celebrate and preserve the unique character of each destination, offering genuine local experiences.",
                gradient: "from-blue-100 to-blue-200",
                delay: 0.1
              },
              {
                icon: (
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: "Excellence",
                description: "We maintain the highest standards in everything we do, from property curation to guest service.",
                gradient: "from-green-100 to-green-200",
                delay: 0.2
              },
              {
                icon: (
                  <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                title: "Community",
                description: "We believe in supporting local communities and creating positive economic impact wherever we operate.",
                gradient: "from-purple-100 to-purple-200",
                delay: 0.3
              },
              {
                icon: (
                  <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ),
                title: "Innovation",
                description: "We continuously evolve and embrace new technologies to enhance the travel experience.",
                gradient: "from-orange-100 to-orange-200",
                delay: 0.4
              },
              {
                icon: (
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
                  </svg>
                ),
                title: "Sustainability",
                description: "We're committed to responsible tourism that preserves our environment for future generations.",
                gradient: "from-red-100 to-red-200",
                delay: 0.5
              },
              {
                icon: (
                  <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: "Integrity",
                description: "We operate with complete transparency and honesty in all our relationships and transactions.",
                gradient: "from-indigo-100 to-indigo-200",
                delay: 0.6
              }
            ].map((value, index) => (
              <motion.div
                key={index}
                className="text-center group cursor-pointer"
                initial={{ opacity: 0, y: 80 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.7, 
                  delay: value.delay,
                  ease: "easeOut"
                }}
                viewport={{ once: true, margin: "-50px" }}
                whileHover={{ 
                  y: -10,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
              >
                <motion.div 
                  className={`bg-gradient-to-br ${value.gradient} w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6`}
                  whileHover={{ 
                    scale: 1.1,
                    rotate: 5,
                    transition: { duration: 0.3, ease: "easeOut" }
                  }}
                >
                  {value.icon}
                </motion.div>
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{value.title}</h3>
                <p className="text-[#1a1a1a]/80 text-sm sm:text-sm leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12 sm:mb-16 lg:mb-20"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1a1a1a] mb-4 sm:mb-6">
              Meet the Founder
            </h2>
            <p className="text-base sm:text-base lg:text-lg text-[#1a1a1a]/80 max-w-2xl mx-auto">
              The heart and vision behind Maxed Homes
            </p>
          </motion.div>

          <div className="flex justify-center">
            <motion.div
              className="bg-white rounded-3xl p-6 sm:p-8 text-center group hover:shadow-2xl transition-all duration-500 max-w-md w-full"
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.7, 
                delay: 0.1,
                ease: "easeOut"
              }}
              viewport={{ once: true, margin: "-50px" }}
              whileHover={{ y: -10 }}
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-[#1a1a1a] mb-2">Sarah Akpovi</h3>
              <p className="text-blue-600 font-medium mb-3 sm:mb-4 text-sm sm:text-base">Founder & CEO</p>
              <p className="text-[#1a1a1a]/80 text-xs sm:text-sm leading-relaxed">
                Born and raised in Benin, Sarah is passionate about showcasing West African hospitality to the world through quality short-term rentals.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="py-16 sm:py-20 lg:py-24 text-white relative overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${roadImage})`
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-white/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 
            className="text-2xl sm:text-3xl lg:text-4xl font-medium text-white mb-4 sm:mb-6"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            Ready to Experience Maxed Homes?
          </motion.h2>
          <motion.p 
            className="text-sm sm:text-base lg:text-lg text-white/90 mb-6 sm:mb-8 lg:mb-12 max-w-3xl mx-auto leading-relaxed px-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            Be among the first to discover exceptional stays in West Africa. 
            Your next adventure awaits!
          </motion.p>
          <motion.div 
            className="flex flex-row gap-3 sm:gap-6 justify-center items-center px-4 max-w-lg mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <Link
              to={ROUTES.PROPERTIES}
              className="bg-white text-gray-900 hover:bg-gray-100 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-xs sm:text-base transition-all duration-300 transform hover:scale-105 hover:shadow-xl text-center"
            >
              Browse Properties
            </Link>
            <Link
              to={ROUTES.CONTACT}
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-xs sm:text-base transition-all duration-300 transform hover:scale-105 text-center"
            >
              Get in Touch
            </Link>
          </motion.div>
        </div>
      </section>
      </div>
    </>
  );
};

export default About; 