import FAQSection from '../components/FAQSection';
import HeroSection from '../components/home/HeroSection';
import StatsSection from '../components/home/StatsSection';
import WhyBookSection from '../components/home/WhyBookSection';
import WhatWeOfferSection from '../components/home/WhatWeOfferSection';
import PartnerWithUsSection from '../components/home/PartnerWithUsSection';
import AvailableListingsSection from '../components/home/AvailableListingsSection';
import SEO, { generateOrganizationStructuredData } from '../components/SEO';

const Home = () => {
  const structuredData = generateOrganizationStructuredData();

  return (
    <>
      <SEO
        title="Find Your Perfect Home"
        description="Discover premium vacation rentals and properties in Côte d'Ivoire. Book your perfect stay with Maxed Homes - luxury accommodations with exceptional service."
        keywords="vacation rentals, properties, Côte d'Ivoire, Abidjan, luxury homes, booking, accommodation, short-term rentals"
        url="/"
        structuredData={structuredData}
      />
      <div className="min-h-screen overflow-x-hidden">
      <HeroSection />
      <StatsSection />
      <AvailableListingsSection />
      <WhyBookSection />
      <WhatWeOfferSection />
      <FAQSection />
      <PartnerWithUsSection />
      </div>
    </>
  );
};

export default Home;