import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Menu } from 'lucide-react';
import AdminSidebar from '../components/admin/AdminSidebar';
import PropertiesManagement from '../components/admin/PropertiesManagement';
import BookingsManagement from '../components/admin/BookingsManagement';
import UsersManagement from '../components/admin/UsersManagement';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';
import OverviewDashboard from '../components/admin/OverviewDashboard';
import ContactMessages from '../components/admin/ContactMessages';
import PaymentConfigManagement from '../components/admin/PaymentConfigManagement';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'properties', label: 'Properties' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'users', label: 'Users' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'messages', label: 'Messages' },
  { id: 'payments', label: 'Payments' },
];

/**
 * Admin Dashboard - Main container for admin functionality
 * Phase 5: Contact Messages integrated
 */
export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl || 'overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync URL with active tab
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const currentTab = tabs.find((t) => t.id === activeTab);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewDashboard />;
      case 'properties':
        return <PropertiesManagement />;
      case 'bookings':
        return <BookingsManagement />;
      case 'users':
        return <UsersManagement />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'messages':
        return <ContactMessages />;
      case 'payments':
        return <PaymentConfigManagement />;
      default:
        return (
          <div className="bg-white rounded-xl border border-gray-100 p-8 md:p-12">
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-50 mb-5">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {currentTab?.label} Section
              </h3>
              <p className="text-gray-500 max-w-md mx-auto text-sm">
                The <strong>{currentTab?.label.toLowerCase()}</strong> management interface will be implemented in the next phase.
                You can navigate between sections using the sidebar.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
          {/* Mobile Header */}
          <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
            <h1 className="text-lg font-bold text-gray-900">Admin</h1>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-5 md:p-6 lg:p-8">
              <div className="max-w-7xl mx-auto">
                {/* Page Header */}
                {activeTab !== 'properties' && activeTab !== 'bookings' && activeTab !== 'users' && activeTab !== 'analytics' && activeTab !== 'overview' && activeTab !== 'messages' && activeTab !== 'payments' && (
                  <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                      {currentTab?.label || 'Dashboard'}
                    </h2>
                    <p className="text-gray-500 mt-1.5 text-sm">
                      Manage and monitor your platform from here
                    </p>
                  </div>
                )}
                {activeTab === 'analytics' && (
                  <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                      Analytics
                    </h2>
                    <p className="text-gray-500 mt-1.5 text-sm">
                      Detailed analytics and insights
                    </p>
                  </div>
                )}

                {/* Tab Content */}
                {renderTabContent()}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

