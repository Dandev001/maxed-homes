import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Lock, 
  Palette, 
  Mail,
  Save,
  Eye,
  EyeOff,
  Trash2,
  LogOut,
  Menu,
  X,
  Bell,
  Shield,
  Download,
  Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useGuestByEmail, useUpdateGuestPreferences } from '../hooks/useGuests';
import { supabase } from '../lib/supabase';
import { updatePassword, getAuthErrorMessage, resetPassword } from '../lib/auth';
import { logError } from '../utils/logger';
import { ROUTES } from '../constants';


const Settings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { guest, loading: guestLoading, refetch: refetchGuest } = useGuestByEmail(user?.email || '');
  const { updatePreferences, loading: preferencesLoading } = useUpdateGuestPreferences();

  const [activeSection, setActiveSection] = useState<string>('account');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });


  // Theme
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  
  // Notification preferences
  const [notifications, setNotifications] = useState({
    email: true,
    bookingUpdates: true,
    promotional: false,
    newsletter: false,
  });

  // Email preferences
  const [emailPreferences, setEmailPreferences] = useState({
    bookingConfirmations: true,
    paymentReceipts: true,
    bookingReminders: true,
    specialOffers: false,
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public' as 'public' | 'private',
    showEmail: false,
    showPhone: false,
  });

  // Account deletion
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Load settings from guest preferences
  useEffect(() => {
    if (guest?.preferences) {
      const prefs = guest.preferences as {
        theme?: 'light' | 'dark' | 'system';
        notifications?: typeof notifications;
        emailPreferences?: typeof emailPreferences;
        privacy?: typeof privacy;
      };
      
      if (prefs.theme) {
        setTheme(prefs.theme);
      }
      if (prefs.notifications) {
        setNotifications(prev => ({ ...prev, ...prefs.notifications }));
      }
      if (prefs.emailPreferences) {
        setEmailPreferences(prev => ({ ...prev, ...prefs.emailPreferences }));
      }
      if (prefs.privacy) {
        setPrivacy(prev => ({ ...prev, ...prefs.privacy }));
      }
    }
  }, [guest]);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (themeValue: 'light' | 'dark' | 'system') => {
    if (themeValue === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', systemTheme === 'dark');
    } else {
      document.documentElement.classList.toggle('dark', themeValue === 'dark');
    }
    localStorage.setItem('theme', themeValue);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    if (newTheme === 'dark') {
      // Dark mode is disabled - show coming soon message
      setError('Dark mode is coming soon!');
      setTimeout(() => setError(null), 3000);
      return;
    }
    setTheme(newTheme);
    applyTheme(newTheme);
    savePreferences();
  };

  const handleExportData = async () => {
    if (!guest) return;
    
    setError(null);
    setIsSaving(true);
    
    try {
      // Create a data export object
      const exportData = {
        account: {
          email: user?.email,
          createdAt: guest.created_at,
        },
        preferences: guest.preferences || {},
        exportDate: new Date().toISOString(),
      };
      
      // Convert to JSON and download
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `maxed-homes-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccess('Data exported successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to export data. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const savePreferences = async () => {
    if (!guest?.id) return;

    setError(null);
    setIsSaving(true);

    try {
      await updatePreferences(guest.id, {
        theme,
        notifications,
        emailPreferences,
        privacy,
      });
      
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
      await refetchGuest();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const { error: updateError } = await updatePassword(passwordData.newPassword);

      if (updateError) {
        setError(getAuthErrorMessage(updateError));
      } else {
        setSuccess('Password updated successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    if (!user?.email) return;

    setError(null);
    setIsSaving(true);

    try {
      const { error: resetError } = await resetPassword(user.email);
      if (resetError) {
        setError(getAuthErrorMessage(resetError));
      } else {
        setSuccess('Password reset email sent! Please check your inbox.');
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send password reset email');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    if (!user || !guest) return;

    setError(null);
    setIsSaving(true);

    try {
      // Delete guest record
      const { error: deleteError } = await supabase
        .from('guests')
        .delete()
        .eq('id', guest.id);

      if (deleteError) {
        logError('Error deleting guest', deleteError, 'Settings');
        setError('Failed to delete account data. Please try again or contact support.');
        setIsSaving(false);
        return;
      }

      // Sign out the user
      await signOut();
      
      // Note: Auth account deletion requires server-side admin access
      // The guest record has been deleted, and the user is signed out
      // For complete account deletion, contact support or implement server-side endpoint
      
      navigate(ROUTES.HOME);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      setIsSaving(false);
    }
  };


  if (authLoading || guestLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    navigate(ROUTES.LOGIN);
    return null;
  }

  const sections = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'security', label: 'Security', icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link to={ROUTES.HOME} className="flex items-center space-x-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-base sm:text-lg">M</span>
              </div>
              <span className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">maxed homes</span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link
                to={ROUTES.PROFILE}
                className="hidden md:block text-sm text-gray-700 hover:text-gray-900 font-medium"
              >
                Profile
              </Link>
              <Link
                to={ROUTES.DASHBOARD}
                className="hidden md:block text-sm text-gray-700 hover:text-gray-900 font-medium"
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  signOut();
                  navigate(ROUTES.HOME);
                }}
                className="hidden md:flex items-center text-sm text-red-600 hover:text-red-700 font-medium"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Sign Out
              </button>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-2">
              <Link
                to={ROUTES.PROFILE}
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Profile
              </Link>
              <Link
                to={ROUTES.DASHBOARD}
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  signOut();
                  navigate(ROUTES.HOME);
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-lg"
              >
                <LogOut className="w-4 h-4 inline mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        activeSection === section.id
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Mobile Navigation - Horizontal Scrollable Tabs */}
          <div className="lg:hidden mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Settings</h2>
            <div 
              className="overflow-x-auto -mx-3 sm:-mx-4 px-3 sm:px-4 scrollbar-hide" 
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              } as React.CSSProperties}
            >
              <nav className="flex space-x-2 sm:space-x-3 pb-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0 touch-manipulation ${
                        activeSection === section.id
                          ? 'bg-gray-100 text-gray-900 shadow-sm'
                          : 'text-gray-600 active:bg-gray-50 bg-white border border-gray-200'
                      }`}
                    >
                      <Icon className="w-4 h-4 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm font-medium">{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Success/Error Messages */}
            {success && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs sm:text-sm text-green-800 break-words">{success}</p>
              </div>
            )}

            {error && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs sm:text-sm text-red-800 break-words">{error}</p>
              </div>
            )}

            {/* Account Settings */}
            {activeSection === 'account' && (
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Account Settings</h1>
                
                <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Email Address</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Current Email
                      </label>
                      <input
                        type="email"
                        value={user.email || ''}
                        disabled
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Change Password</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent pr-10"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 touch-manipulation p-1"
                        >
                          {showPasswords.new ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent pr-10"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 touch-manipulation p-1"
                        >
                          {showPasswords.confirm ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                      <button
                        onClick={handlePasswordChange}
                        disabled={isSaving}
                        className="flex items-center justify-center px-4 py-2.5 sm:py-2 text-sm sm:text-base bg-[#1a1a1a] text-white rounded-lg hover:bg-[#1a1a1a]/90 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Updating...' : 'Update Password'}
                      </button>
                      <button
                        onClick={handleRequestPasswordReset}
                        disabled={isSaving}
                        className="px-4 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 touch-manipulation"
                      >
                        Send Reset Email
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-red-200 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-red-900 mb-2">Delete Account</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </button>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                          Type <span className="font-bold">DELETE</span> to confirm
                        </label>
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          placeholder="DELETE"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button
                          onClick={handleDeleteAccount}
                          disabled={isSaving || deleteConfirmText !== 'DELETE'}
                          className="flex items-center justify-center px-4 py-2.5 sm:py-2 text-sm sm:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {isSaving ? 'Deleting...' : 'Confirm Delete'}
                        </button>
                        <button
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteConfirmText('');
                          }}
                          className="px-4 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 touch-manipulation"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Appearance */}
            {activeSection === 'appearance' && (
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Appearance</h1>
                  <button
                    onClick={savePreferences}
                    disabled={isSaving || preferencesLoading}
                    className="flex items-center justify-center px-4 py-2.5 sm:py-2 text-sm sm:text-base bg-[#1a1a1a] text-white rounded-lg hover:bg-[#1a1a1a]/90 disabled:opacity-50 w-full sm:w-auto touch-manipulation"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving || preferencesLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Theme</h3>
                  <div className="space-y-2 sm:space-y-3">
                    <label className="flex items-center p-3 sm:p-4 border-2 rounded-lg cursor-pointer active:bg-gray-50 transition-colors touch-manipulation" style={{ borderColor: theme === 'light' ? '#1a1a1a' : 'transparent' }}>
                      <input
                        type="radio"
                        name="theme"
                        value="light"
                        checked={theme === 'light'}
                        onChange={() => handleThemeChange('light')}
                        className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base text-gray-900">Light</div>
                        <div className="text-xs sm:text-sm text-gray-600">Use light theme</div>
                      </div>
                    </label>
                    <div className="relative group">
                      <label className="flex items-center p-3 sm:p-4 border-2 rounded-lg cursor-not-allowed opacity-60 bg-gray-50 transition-colors" style={{ borderColor: 'transparent' }}>
                        <input
                          type="radio"
                          name="theme"
                          value="dark"
                          checked={false}
                          disabled
                          className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5 cursor-not-allowed"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm sm:text-base text-gray-900">Dark</span>
                            <span className="px-2 py-0.5 text-[10px] sm:text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Coming Soon</span>
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600">Use dark theme</div>
                        </div>
                        <Info className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                      </label>
                      {/* Tooltip - Mobile friendly */}
                      <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-64 max-w-sm p-3 bg-gray-900 text-white text-xs sm:text-sm rounded-lg shadow-lg opacity-0 invisible group-active:opacity-100 group-active:visible sm:group-hover:opacity-100 sm:group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                        <div className="absolute -top-1 left-4 sm:left-6 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                        Dark mode is coming soon! We're working on bringing you a beautiful dark theme experience.
                      </div>
                    </div>
                    <label className="flex items-center p-3 sm:p-4 border-2 rounded-lg cursor-pointer active:bg-gray-50 transition-colors touch-manipulation" style={{ borderColor: theme === 'system' ? '#1a1a1a' : 'transparent' }}>
                      <input
                        type="radio"
                        name="theme"
                        value="system"
                        checked={theme === 'system'}
                        onChange={() => handleThemeChange('system')}
                        className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base text-gray-900">System</div>
                        <div className="text-xs sm:text-sm text-gray-600">Match your device settings</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeSection === 'notifications' && (
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Notifications</h1>
                  <button
                    onClick={savePreferences}
                    disabled={isSaving || preferencesLoading}
                    className="flex items-center justify-center px-4 py-2.5 sm:py-2 text-sm sm:text-base bg-[#1a1a1a] text-white rounded-lg hover:bg-[#1a1a1a]/90 disabled:opacity-50 w-full sm:w-auto touch-manipulation"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving || preferencesLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Email Notifications</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <label className="flex items-center justify-between gap-3 p-2.5 sm:p-3 border border-gray-200 rounded-lg active:bg-gray-50 cursor-pointer touch-manipulation">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base text-gray-900">Booking Updates</div>
                        <div className="text-xs sm:text-sm text-gray-600">Receive updates about your bookings</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.bookingUpdates}
                        onChange={(e) => setNotifications(prev => ({ ...prev, bookingUpdates: e.target.checked }))}
                        className="w-5 h-5 sm:w-5 sm:h-5 text-[#1a1a1a] rounded focus:ring-2 focus:ring-[#1a1a1a] flex-shrink-0"
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 p-2.5 sm:p-3 border border-gray-200 rounded-lg active:bg-gray-50 cursor-pointer touch-manipulation">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base text-gray-900">Promotional Emails</div>
                        <div className="text-xs sm:text-sm text-gray-600">Receive special offers and promotions</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.promotional}
                        onChange={(e) => setNotifications(prev => ({ ...prev, promotional: e.target.checked }))}
                        className="w-5 h-5 sm:w-5 sm:h-5 text-[#1a1a1a] rounded focus:ring-2 focus:ring-[#1a1a1a] flex-shrink-0"
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 p-2.5 sm:p-3 border border-gray-200 rounded-lg active:bg-gray-50 cursor-pointer touch-manipulation">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base text-gray-900">Newsletter</div>
                        <div className="text-xs sm:text-sm text-gray-600">Receive our monthly newsletter</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.newsletter}
                        onChange={(e) => setNotifications(prev => ({ ...prev, newsletter: e.target.checked }))}
                        className="w-5 h-5 sm:w-5 sm:h-5 text-[#1a1a1a] rounded focus:ring-2 focus:ring-[#1a1a1a] flex-shrink-0"
                      />
                    </label>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Email Preferences</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <label className="flex items-center justify-between gap-3 p-2.5 sm:p-3 border border-gray-200 rounded-lg active:bg-gray-50 cursor-pointer touch-manipulation">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base text-gray-900">Booking Confirmations</div>
                        <div className="text-xs sm:text-sm text-gray-600">Receive confirmation emails for bookings</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailPreferences.bookingConfirmations}
                        onChange={(e) => setEmailPreferences(prev => ({ ...prev, bookingConfirmations: e.target.checked }))}
                        className="w-5 h-5 sm:w-5 sm:h-5 text-[#1a1a1a] rounded focus:ring-2 focus:ring-[#1a1a1a] flex-shrink-0"
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 p-2.5 sm:p-3 border border-gray-200 rounded-lg active:bg-gray-50 cursor-pointer touch-manipulation">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base text-gray-900">Payment Receipts</div>
                        <div className="text-xs sm:text-sm text-gray-600">Receive receipts for payments</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailPreferences.paymentReceipts}
                        onChange={(e) => setEmailPreferences(prev => ({ ...prev, paymentReceipts: e.target.checked }))}
                        className="w-5 h-5 sm:w-5 sm:h-5 text-[#1a1a1a] rounded focus:ring-2 focus:ring-[#1a1a1a] flex-shrink-0"
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 p-2.5 sm:p-3 border border-gray-200 rounded-lg active:bg-gray-50 cursor-pointer touch-manipulation">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base text-gray-900">Booking Reminders</div>
                        <div className="text-xs sm:text-sm text-gray-600">Receive reminders before check-in</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailPreferences.bookingReminders}
                        onChange={(e) => setEmailPreferences(prev => ({ ...prev, bookingReminders: e.target.checked }))}
                        className="w-5 h-5 sm:w-5 sm:h-5 text-[#1a1a1a] rounded focus:ring-2 focus:ring-[#1a1a1a] flex-shrink-0"
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 p-2.5 sm:p-3 border border-gray-200 rounded-lg active:bg-gray-50 cursor-pointer touch-manipulation">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base text-gray-900">Special Offers</div>
                        <div className="text-xs sm:text-sm text-gray-600">Receive exclusive deals and discounts</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailPreferences.specialOffers}
                        onChange={(e) => setEmailPreferences(prev => ({ ...prev, specialOffers: e.target.checked }))}
                        className="w-5 h-5 sm:w-5 sm:h-5 text-[#1a1a1a] rounded focus:ring-2 focus:ring-[#1a1a1a] flex-shrink-0"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy */}
            {activeSection === 'privacy' && (
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Privacy</h1>
                  <button
                    onClick={savePreferences}
                    disabled={isSaving || preferencesLoading}
                    className="flex items-center justify-center px-4 py-2.5 sm:py-2 text-sm sm:text-base bg-[#1a1a1a] text-white rounded-lg hover:bg-[#1a1a1a]/90 disabled:opacity-50 w-full sm:w-auto touch-manipulation"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving || preferencesLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Profile Visibility</h3>
                  <div className="space-y-2 sm:space-y-3">
                    <label className="flex items-center p-3 sm:p-4 border-2 rounded-lg cursor-pointer active:bg-gray-50 transition-colors touch-manipulation" style={{ borderColor: privacy.profileVisibility === 'public' ? '#1a1a1a' : 'transparent' }}>
                      <input
                        type="radio"
                        name="profileVisibility"
                        value="public"
                        checked={privacy.profileVisibility === 'public'}
                        onChange={(e) => setPrivacy(prev => ({ ...prev, profileVisibility: e.target.value as 'public' | 'private' }))}
                        className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base text-gray-900">Public</div>
                        <div className="text-xs sm:text-sm text-gray-600">Your profile is visible to other users</div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 sm:p-4 border-2 rounded-lg cursor-pointer active:bg-gray-50 transition-colors touch-manipulation" style={{ borderColor: privacy.profileVisibility === 'private' ? '#1a1a1a' : 'transparent' }}>
                      <input
                        type="radio"
                        name="profileVisibility"
                        value="private"
                        checked={privacy.profileVisibility === 'private'}
                        onChange={(e) => setPrivacy(prev => ({ ...prev, profileVisibility: e.target.value as 'public' | 'private' }))}
                        className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base text-gray-900">Private</div>
                        <div className="text-xs sm:text-sm text-gray-600">Your profile is only visible to you</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Contact Information</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <label className="flex items-center justify-between gap-3 p-2.5 sm:p-3 border border-gray-200 rounded-lg active:bg-gray-50 cursor-pointer touch-manipulation">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base text-gray-900">Show Email Address</div>
                        <div className="text-xs sm:text-sm text-gray-600">Allow others to see your email</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacy.showEmail}
                        onChange={(e) => setPrivacy(prev => ({ ...prev, showEmail: e.target.checked }))}
                        className="w-5 h-5 sm:w-5 sm:h-5 text-[#1a1a1a] rounded focus:ring-2 focus:ring-[#1a1a1a] flex-shrink-0"
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 p-2.5 sm:p-3 border border-gray-200 rounded-lg active:bg-gray-50 cursor-pointer touch-manipulation">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm sm:text-base text-gray-900">Show Phone Number</div>
                        <div className="text-xs sm:text-sm text-gray-600">Allow others to see your phone number</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacy.showPhone}
                        onChange={(e) => setPrivacy(prev => ({ ...prev, showPhone: e.target.checked }))}
                        className="w-5 h-5 sm:w-5 sm:h-5 text-[#1a1a1a] rounded focus:ring-2 focus:ring-[#1a1a1a] flex-shrink-0"
                      />
                    </label>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-2">Data Export</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                    Download a copy of your account data in JSON format.
                  </p>
                  <button
                    onClick={handleExportData}
                    disabled={isSaving}
                    className="flex items-center justify-center px-4 py-2.5 sm:py-2 text-sm sm:text-base bg-[#1a1a1a] text-white rounded-lg hover:bg-[#1a1a1a]/90 disabled:opacity-50 w-full sm:w-auto touch-manipulation"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isSaving ? 'Exporting...' : 'Export My Data'}
                  </button>
                </div>
              </div>
            )}

            {/* Security */}
            {activeSection === 'security' && (
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Security</h1>
                
                <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-2">Password Reset</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                    Request a password reset email if you need to change your password.
                  </p>
                  <button
                    onClick={handleRequestPasswordReset}
                    disabled={isSaving}
                    className="w-full sm:w-auto flex items-center justify-center px-4 py-2.5 sm:py-2 text-sm sm:text-base bg-[#1a1a1a] text-white rounded-lg hover:bg-[#1a1a1a]/90 disabled:opacity-50 touch-manipulation"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Reset Email
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-2">Two-Factor Authentication</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                        Add an extra layer of security to your account with two-factor authentication.
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-[10px] sm:text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Coming Soon</span>
                      </div>
                    </div>
                    <div className="relative group flex-shrink-0">
                      <Info className="w-5 h-5 text-gray-400 cursor-help touch-manipulation" />
                      <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-64 max-w-sm p-3 bg-gray-900 text-white text-xs sm:text-sm rounded-lg shadow-lg opacity-0 invisible group-active:opacity-100 group-active:visible sm:group-hover:opacity-100 sm:group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                        <div className="absolute -top-1 right-4 sm:right-6 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                        Two-factor authentication will be available soon. This feature will help protect your account with an additional security layer.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Settings;

