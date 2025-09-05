import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import roadImage from '../../assets/images/road.jpg';

const PartnerWithUsSection = () => {
  return (
    <section 
      className="py-16 sm:py-20 text-white relative z-10 overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${roadImage})`
      }}
    >
      <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-white/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-white mb-4 sm:mb-6">
          Partner With Us
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-white/90 mb-6 sm:mb-8 lg:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
          Own a property? List your home with Maxed and reach thousands of verified guests. 
          Start earning with our trusted platform today!
        </p>
        <div className="flex flex-row gap-3 sm:gap-6 justify-center items-center px-4 max-w-lg mx-auto">
          <Link
            to={ROUTES.CONTACT}
            className="bg-white text-gray-900 hover:bg-gray-100 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 hover:shadow-xl text-center"
            style={{ minWidth: 0 }}
          >
            Join as a Partner
          </Link>
          <a
            href="https://wa.me/+22960000000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/80 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-medium text-sm sm:text-base transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            style={{ minWidth: 0 }}
          >
            WhatsApp Us
          </a>
        </div>
      </div>
    </section>
  );
};

export default PartnerWithUsSection;