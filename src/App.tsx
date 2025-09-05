import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { gsap } from "gsap";
import Layout from "./components/layout/Layout";
import ScrollToTop from "./components/ScrollToTop";
import SmoothScroll from "./components/SmoothScroll";
import PreloadScreen from "./components/PreloadScreen";
import { Home, About, Contact } from "./pages";
import { ROUTES } from "./constants";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  const handlePreloadComplete = () => {
    setIsLoading(false);
    // Add a slight delay before showing content to prevent flash
    setTimeout(() => {
      setShowContent(true);
    }, 50);
  };

  useEffect(() => {
    if (showContent) {
      // Animate in the main content
      gsap.fromTo(".main-content", 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
      );
    }
  }, [showContent]);

  if (isLoading) {
    return <PreloadScreen onComplete={handlePreloadComplete} />;
  }

  if (!showContent) {
    return <div className="min-h-screen bg-white"></div>;
  }

  return (
    <div className="main-content min-h-screen bg-white">
      <Router>
        <SmoothScroll />
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path={ROUTES.HOME} element={<Home />} />
            {/* Placeholder routes for missing pages */}
            <Route path={ROUTES.SEARCH} element={<div className="p-8 text-center">Search Page - Coming Soon</div>} />
            <Route path={ROUTES.ABOUT} element={<About />} />
            <Route path={ROUTES.CONTACT} element={<Contact />} />
            <Route path={ROUTES.LOGIN} element={<div className="p-8 text-center">Login Page - Coming Soon</div>} />
            <Route path={ROUTES.REGISTER} element={<div className="p-8 text-center">Register Page - Coming Soon</div>} />
            <Route path={ROUTES.DASHBOARD} element={<div className="p-8 text-center">Dashboard - Coming Soon</div>} />
            {/* 404 Route */}
            <Route path="*" element={<div className="p-8 text-center">Page Not Found</div>} />
          </Routes>
        </Layout>
      </Router>
    </div>
  );
}

export default App;
