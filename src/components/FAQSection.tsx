import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  image?: string;
}

const faqData: FAQItem[] = [
  {
    id: 1,
    question: "What kind of properties do you list?",
    answer: "We curate short- and mid-term rental homes in partnership with trusted hosts. From cozy studios to luxury apartments, each space is handpicked for comfort, style, and convenience. All properties are verified and bookable via Airbnb or similar platforms.",
    image: "/src/assets/images/house1.jpg"
  },
  {
    id: 2,
    question: "How do I book a property?",
    answer: "All our listings link directly to Airbnb, where you can check availability, read reviews, and complete your booking securely. We also provide support if you need help choosing a space or coordinating with the host."
  },
  {
    id: 3,
    question: "Can I trust the listings on Maxed Homes?",
    answer: "Absolutely. Every home featured on Maxed Homes has been reviewed, verified, and curated based on quality, location, and guest experience. We work directly with hosts to ensure top-tier service and comfort."
  },
  {
    id: 4,
    question: "I'm a host — how can I get listed?",
    answer: "We love partnering with great hosts! If you have a home listed on Airbnb or similar platforms and want to be featured on Maxed Homes, fill out our 'Partner With Us' form and we'll review your property for fit and quality."
  },
  {
    id: 5,
    question: "Do you offer virtual tours or more info before booking?",
    answer: "Yes! Many of our listings include photos, videos, or virtual tours. Since bookings happen via Airbnb, you'll also have access to detailed guest reviews, amenities, and host communication before confirming."
  }
];

const FAQSection = () => {
  const [openItems, setOpenItems] = useState<number[]>([1]); // First item open by default

  const toggleItem = (id: number) => {
    setOpenItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <section className="relative z-10 py-16 sm:py-20 lg:py-24 bg-neutral-50">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div 
          className="mb-12 sm:mb-16 lg:mb-20 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.h2 
            className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-wide leading-tight mb-4 text-neutral-900"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            viewport={{ once: true }}
          >
            Frequently asked questions
          </motion.h2>
          
          {/* Gentle divider */}
          <div className="w-16 h-px bg-neutral-200 mx-auto mb-6"></div>
          
          <motion.p 
            className="text-sm sm:text-base font-normal leading-relaxed max-w-2xl mx-auto text-neutral-700"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            viewport={{ once: true }}
          >
            Clear answers to help you understand our services and booking process
          </motion.p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqData.map((item, index) => (
            <motion.div
              key={item.id}
              className="bg-white/80 backdrop-blur-sm border border-neutral-100 rounded-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
              viewport={{ once: true, margin: "-50px" }}
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full p-6 sm:p-7 lg:p-8 text-left focus:outline-none hover:bg-neutral-50/50 transition-colors duration-300"
                aria-expanded={openItems.includes(item.id)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-neutral-300 flex-shrink-0"></div>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-normal tracking-wide leading-relaxed text-neutral-900">
                      {item.question}
                    </h3>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 bg-neutral-100 rounded-lg">
                    <ChevronDownIcon
                      className={`h-4 w-4 sm:h-5 sm:w-5 text-neutral-600 transition-transform duration-300 ${
                        openItems.includes(item.id) ? 'transform rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>
              </button>
              
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  openItems.includes(item.id)
                    ? 'max-h-[800px] opacity-100'
                    : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 sm:px-7 lg:px-8 pb-6 sm:pb-7 lg:pb-8">
                  <div className="border-t border-neutral-200 pt-6">
                    {openItems.includes(item.id) && item.image ? (
                      <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                        <div className="lg:col-span-7">
                          <div className="flex items-start gap-3">
                            <div className="w-1 h-1 rounded-full bg-neutral-400 flex-shrink-0 mt-2"></div>
                            <p className="text-sm sm:text-base font-normal leading-relaxed text-neutral-700">
                              {item.answer}
                            </p>
                          </div>
                        </div>
                        <div className="lg:col-span-5">
                          <motion.div 
                            className="rounded-lg overflow-hidden"
                            initial={{ opacity: 0, scale: 1.05 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1.4, ease: [0.25, 0.1, 0.25, 1] }}
                            viewport={{ once: true }}
                          >
                            <img
                              src={item.image}
                              alt="Property example"
                              className="w-full h-48 sm:h-64 lg:h-56 object-cover"
                            />
                          </motion.div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <div className="w-1 h-1 rounded-full bg-neutral-400 flex-shrink-0 mt-2"></div>
                        <p className="text-sm sm:text-base font-normal leading-relaxed text-neutral-700">
                          {item.answer}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection; 