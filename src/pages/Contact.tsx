import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Facebook, 
  Instagram, 
  Linkedin
} from 'lucide-react';
import { ROUTES } from '../constants';
import SEO from '../components/SEO';
import { useCreateContactMessage } from '../hooks/useContactMessages';
import { sanitizeString, sanitizeEmail, sanitizePhone } from '../utils/sanitize';
import houseImage from '../assets/images/house1.jpg';
import roadImage from '../assets/images/road.jpg';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface FormErrors {
  [key: string]: string;
}

const Contact = () => {
  const { createContactMessage, loading: isSubmitting } = useCreateContactMessage();
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSuccessMessage(null);
    setErrors({});
    
    try {
      // Sanitize all inputs before sending
      const sanitizedEmail = sanitizeEmail(formData.email.trim());
      const sanitizedPhone = formData.phone.trim() ? sanitizePhone(formData.phone.trim()) : undefined;
      
      await createContactMessage({
        full_name: sanitizeString(formData.fullName.trim()),
        email: sanitizedEmail,
        phone: sanitizedPhone,
        subject: sanitizeString(formData.subject.trim()),
        message: sanitizeString(formData.message.trim())
      });
      
      // Reset form on success
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      
      setSuccessMessage('Message sent successfully! We\'ll get back to you soon.');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message. Please try again.';
      setErrors({ general: errorMessage });
    }
  };

  return (
    <>
      <SEO
        title="Contact Us"
        description="Get in touch with Maxed Homes. Have questions about our properties or need assistance? Contact our team - we're here to help with all your vacation rental needs."
        keywords="contact Maxed Homes, customer support, vacation rental inquiries, property questions, booking assistance"
        url="/contact"
      />
      <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section 
        className="relative min-h-screen text-white overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${houseImage})`
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
              Have Questions Or Need{' '}
              <span className="text-white">Assistance?</span>
            </motion.h1>
            <motion.p 
              className="text-base sm:text-lg md:text-xl lg:text-lg mb-8 sm:mb-12 text-white/90 max-w-4xl mx-auto leading-relaxed px-4"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              We're Here to Help! Whether you have inquiries about our services, need 
              assistance with your next steps, or require support, our team is ready to assist you.
            </motion.p>
            
            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-row gap-3 sm:gap-6 justify-center items-center px-4 max-w-lg mx-auto"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            >
              <a
                href="#contact-form"
                className="bg-white text-gray-900 hover:bg-gray-100 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-xs sm:text-base transition-all duration-300 transform hover:scale-105 hover:shadow-xl text-center"
              >
                Get In Touch
              </a>
              <a
                href="tel:+15558874543"
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-xs sm:text-base transition-all duration-300 transform hover:scale-105 text-center"
              >
                Call Now
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Contact Section */}
      <section id="contact-form" className="py-16 sm:py-20 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div 
            className="text-center mb-12 sm:mb-16 lg:mb-20"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1a1a1a] mb-4 sm:mb-6">
              Contact us for all your real estate needs
            </h2>
            <p className="text-base sm:text-base lg:text-lg text-[#1a1a1a]/80 max-w-3xl mx-auto">
              Ready to get started? Reach out to our team and we'll help you find the perfect solution.
            </p>
          </motion.div>

          {/* Contact Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Left Side - Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true, margin: "-100px" }}
              className="space-y-8"
            >
              {/* Message Us */}
              <div>
                <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Message Us</h3>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-[#1a1a1a]/60" />
                  <a 
                    href="mailto:support@maxedhomes.com" 
                    className="text-[#1a1a1a]/80 hover:text-[#1a1a1a] transition-colors"
                  >
                    support@maxedhomes.com
                  </a>
                </div>
              </div>

              {/* Call Us */}
              <div>
                <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Call Us</h3>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-[#1a1a1a]/60" />
                  <a 
                    href="tel:+15558874543" 
                    className="text-[#1a1a1a]/80 hover:text-[#1a1a1a] transition-colors"
                  >
                    (555) 887-4543
                  </a>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">Location</h3>
                <div className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-[#1a1a1a]/60 mt-0.5" />
                    <div>
                      <p className="text-[#1a1a1a]/80">1647 Elm Street, Suite 301, Greenfield,</p>
                      <p className="text-[#1a1a1a]/80">TX, 75001</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 mt-4">
                    <Clock className="w-5 h-5 text-[#1a1a1a]/60" />
                    <div>
                      <p className="text-[#1a1a1a]/80 font-medium">Business Hours</p>
                      <p className="text-[#1a1a1a]/60 text-sm">Monday - Friday:</p>
                      <p className="text-[#1a1a1a]/60 text-sm">9:00 AM - 6:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div>
                <h3 className="text-xl font-semibold text-[#1a1a1a] mb-4">Social Media</h3>
                <div className="flex space-x-4">
                  <motion.a
                    href="#"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <span className="text-[#1a1a1a] font-bold text-sm">𝕏</span>
                  </motion.a>
                  <motion.a
                    href="#"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <Facebook className="w-5 h-5 text-[#1a1a1a]" />
                  </motion.a>
                  <motion.a
                    href="#"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <Instagram className="w-5 h-5 text-[#1a1a1a]" />
                  </motion.a>
                  <motion.a
                    href="#"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <Linkedin className="w-5 h-5 text-[#1a1a1a]" />
                  </motion.a>
                </div>
              </div>
            </motion.div>

            {/* Right Side - Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true, margin: "-100px" }}
            >
              {/* Success Message */}
              {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">{successMessage}</p>
                </div>
              )}

              {/* Error Message */}
              {errors.general && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{errors.general}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-[#1a1a1a] mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-colors ${
                      errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="John Doe"
                  />
                  {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                </div>

                {/* Email Address */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#1a1a1a] mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-colors ${
                      errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="johndoe@example.com"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-[#1a1a1a] mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-colors ${
                      errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter your phone number"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-[#1a1a1a] mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-colors ${
                      errors.subject ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Write the subject of your message"
                  />
                  {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-[#1a1a1a] mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-colors resize-none ${
                      errors.message ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter your message here..."
                  />
                  {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#1a1a1a] text-white py-4 px-6 rounded-lg font-medium hover:bg-[#2a2a2a] focus:ring-2 focus:ring-[#1a1a1a] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </div>
                  ) : (
                    'Submit'
                  )}
                </button>
              </form>
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
            Ready to Get Started?
          </motion.h2>
          <motion.p 
            className="text-sm sm:text-base lg:text-lg text-white/90 mb-6 sm:mb-8 lg:mb-12 max-w-3xl mx-auto leading-relaxed px-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            Whether you're looking for your next home or want to list your property with us, 
            we're here to help you every step of the way.
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
            <a
              href="https://wa.me/+22960000000"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-xs sm:text-base transition-all duration-300 transform hover:scale-105 text-center"
            >
              WhatsApp Us
            </a>
          </motion.div>
        </div>
      </section>
      </div>
    </>
  );
};

export default Contact; 