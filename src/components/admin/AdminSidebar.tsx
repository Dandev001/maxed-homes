import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Home, Calendar, Users, BarChart3, Mail, LogOut, User as UserIcon, X, CreditCard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const tabs: Tab[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'properties', label: 'Properties', icon: Home },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'messages', label: 'Messages', icon: Mail },
  { id: 'payments', label: 'Payments', icon: CreditCard },
];

export default function AdminSidebar({ 
  activeTab, 
  onTabChange, 
  isMobileOpen = false,
  onMobileClose 
}: AdminSidebarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Admin';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.HOME);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-gray-100
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col shadow-sm
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Admin</h1>
            {onMobileClose && (
              <button
                onClick={onMobileClose}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id);
                  if (onMobileClose) {
                    onMobileClose();
                  }
                }}
                className={`
                  w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200
                  ${isActive
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? '' : 'text-gray-500'}`} />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center space-x-3 mb-3 px-2">
            <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white font-semibold text-sm">
              {getUserInitials()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {getUserDisplayName()}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LogOut className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

