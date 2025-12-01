import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { gsap } from "gsap";
import Layout from "./components/layout/Layout";
import ScrollToTop from "./components/ScrollToTop";
import PreloadScreen from "./components/PreloadScreen";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import ToastContainer from "./components/ui/ToastContainer";
import RouteLoader from "./components/RouteLoader";
import { ToastProvider } from "./contexts/ToastContext";
import { ROUTES } from "./constants";

// Lazy load all route components for code splitting
const Home = lazy(() => import("./pages/Home"));
const Properties = lazy(() => import("./pages/Properties"));
const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Booking = lazy(() => import("./pages/Booking"));
const BookingConfirmation = lazy(() => import("./pages/BookingConfirmation"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Favorites = lazy(() => import("./pages/Favorites"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

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
    <ErrorBoundary>
      <ToastProvider>
        <div className="main-content min-h-screen bg-white">
          <Router>
            <ScrollToTop />
            <ToastContainer />
            <Layout>
              <Suspense fallback={<RouteLoader />}>
                <Routes>
                  <Route path={ROUTES.HOME} element={<Home />} />
                  <Route path={ROUTES.PROPERTIES} element={<Properties />} />
                  <Route path={ROUTES.PROPERTY_DETAIL} element={<PropertyDetail />} />
                  <Route 
                    path={ROUTES.BOOKING} 
                    element={
                      <ProtectedRoute requireAuth={true}>
                        <Booking />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path={ROUTES.BOOKING_CONFIRMATION} 
                    element={
                      <ProtectedRoute requireAuth={true}>
                        <BookingConfirmation />
                      </ProtectedRoute>
                    } 
                  />
                  {/* Placeholder routes for missing pages */}
                  <Route path={ROUTES.SEARCH} element={<div className="p-8 text-center">Search Page - Coming Soon</div>} />
                  <Route path={ROUTES.ABOUT} element={<About />} />
                  <Route path={ROUTES.CONTACT} element={<Contact />} />
                  <Route 
                    path={ROUTES.LOGIN} 
                    element={
                      <ProtectedRoute requireAuth={false}>
                        <AuthPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path={ROUTES.REGISTER} 
                    element={
                      <ProtectedRoute requireAuth={false}>
                        <AuthPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path={ROUTES.DASHBOARD} 
                    element={
                      <ProtectedRoute requireAuth={true}>
                        <Dashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path={ROUTES.PROFILE} 
                    element={
                      <ProtectedRoute requireAuth={true}>
                        <Profile />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path={ROUTES.SETTINGS} 
                    element={
                      <ProtectedRoute requireAuth={true}>
                        <Settings />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path={ROUTES.FAVORITES} 
                    element={
                      <ProtectedRoute requireAuth={true}>
                        <Favorites />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path={ROUTES.ADMIN_DASHBOARD} 
                    element={
                      <ProtectedRoute requireAuth={true} requireAdmin={true}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  {/* 404 Route */}
                  <Route path="*" element={<div className="p-8 text-center">Page Not Found</div>} />
                </Routes>
              </Suspense>
            </Layout>
          </Router>
        </div>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
