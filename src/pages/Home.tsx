import FAQSection from '../components/FAQSection';
import HeroSection from '../components/home/HeroSection';
import StatsSection from '../components/home/StatsSection';
import WhyBookSection from '../components/home/WhyBookSection';
import WhatWeOfferSection from '../components/home/WhatWeOfferSection';
import PartnerWithUsSection from '../components/home/PartnerWithUsSection';
import AvailableListingsSection from '../components/home/AvailableListingsSection';

const Home = () => {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <HeroSection />
      <StatsSection />
      <AvailableListingsSection />
      <WhyBookSection />
      <WhatWeOfferSection />
      <FAQSection />
      <PartnerWithUsSection />
    </div>
  );
};

export default Home;