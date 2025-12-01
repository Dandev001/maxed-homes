import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { User, Calendar, Save, Lock, LogOut, Luggage, MessageSquare, Settings, Heart, Star, MapPin, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useGuestByEmail, useUpdateGuest } from '../hooks/useGuests';
import { useGuestBookings } from '../hooks/useBookings';
import { useGuestReviews } from '../hooks/useReviews';
import { supabase } from '../lib/supabase';
import { updatePassword, getAuthErrorMessage } from '../lib/auth';
import { sanitizeString, sanitizePhone } from '../utils/sanitize';
import { logError } from '../utils/logger';
import { ROUTES } from '../constants';

const Profile = () => {
  const navigate = useNavigate();
  const { user, refreshAuth, loading: authLoading, signOut } = useAuth();
  const { guest, error: guestError, refetch: refetchGuest } = useGuestByEmail(user?.email || '');
  const { updateGuest, loading: updateGuestLoading } = useUpdateGuest();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'about';

  // Get bookings for past trips
  const { bookings, loading: bookingsLoading } = useGuestBookings(guest?.id || '', 50);
  
  // Get reviews written by the guest
  const { reviews: guestReviews, loading: reviewsLoading } = useGuestReviews(guest?.id || '');

  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Form state - initialize with user data, update when guest loads
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
  });

  // Update form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.user_metadata?.full_name || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  // Update form data when guest data is available
  useEffect(() => {
    if (guest) {
      setFormData(prev => ({
        ...prev,
        phone: guest.phone || '',
        firstName: guest.first_name || '',
        lastName: guest.last_name || '',
      }));
    }
  }, [guest]);

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isProfileDropdownOpen || isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen, isMenuOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      // Update user metadata (full name)
      // Sanitize full name before updating
      const sanitizedFullName = sanitizeString(formData.fullName.trim());
      if (sanitizedFullName !== user.user_metadata?.full_name) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            full_name: sanitizedFullName,
          },
        });

        if (updateError) {
          setError(getAuthErrorMessage(updateError));
          setIsSaving(false);
          return;
        }
      }

      // Update guest record
      if (guest) {
        const updates: {
          first_name?: string;
          last_name?: string;
          phone?: string;
        } = {};

        // Sanitize inputs before updating
        if (formData.firstName !== guest.first_name) {
          updates.first_name = sanitizeString(formData.firstName.trim());
        }
        if (formData.lastName !== guest.last_name) {
          updates.last_name = sanitizeString(formData.lastName.trim());
        }
        if (formData.phone !== guest.phone) {
          updates.phone = formData.phone.trim() ? sanitizePhone(formData.phone.trim()) : undefined;
        }

        if (Object.keys(updates).length > 0) {
          await updateGuest(guest.id, updates);
        }
      } else if (user.id) {
        // Create guest record if it doesn't exist
        // Sanitize inputs before creating
        const { error: createError } = await supabase.from('guests').insert({
          id: user.id,
          email: user.email || '',
          first_name: sanitizeString(formData.firstName.trim()),
          last_name: sanitizeString(formData.lastName.trim()),
          phone: formData.phone.trim() ? sanitizePhone(formData.phone.trim()) : undefined,
          status: 'active',
        });

        if (createError) {
          logError('Error creating guest', createError, 'Profile');
        }
      }

      // Refresh auth and guest data
      await refreshAuth();
      await refetchGuest();

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
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
        setIsEditingPassword(false);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Calculate profile completion percentage
  const profileCompletion = useMemo(() => {
    if (!user || !guest) return 0;
    let completed = 0;
    const total = 6;
    
    if (user.user_metadata?.full_name) completed++;
    if (guest.first_name) completed++;
    if (guest.last_name) completed++;
    if (guest.phone) completed++;
    if (user.email) completed++;
    if (guest.date_of_birth) completed++;
    
    return Math.round((completed / total) * 100);
  }, [user, guest]);

  // Check if profile is complete enough
  const isProfileComplete = profileCompletion >= 80;

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  const handleSignOut = async () => {
    await signOut();
    setIsProfileDropdownOpen(false);
    navigate(ROUTES.HOME);
  };

  // Only show loading if auth is still loading or user is not available
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const displayName = getUserDisplayName();
  const initials = getUserInitials();

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Hidden on mobile */}
      <header className="hidden md:block sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link to={ROUTES.HOME} className="flex items-center space-x-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-base sm:text-lg">M</span>
              </div>
              <span className="text-lg sm:text-xl font-semibold text-gray-900">maxed homes</span>
            </Link>

            {/* Right side - Switch to hosting and profile */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link
                to={ROUTES.DASHBOARD}
                className="hidden md:block text-sm text-gray-700 hover:text-gray-900 font-medium"
              >
                Switch to hosting
              </Link>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-[#1a1a1a] rounded-full text-white text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  {initials}
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 sm:w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      to={ROUTES.PROFILE}
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <User className="w-4 h-4 mr-2 flex-shrink-0" />
                      Profile
                    </Link>
                    <Link
                      to={ROUTES.DASHBOARD}
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                      Dashboard
                    </Link>
                    <Link
                      to={ROUTES.FAVORITES}
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Heart className="w-4 h-4 mr-2 flex-shrink-0" />
                      Favorites
                    </Link>
                    <Link
                      to={ROUTES.SETTINGS}
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="w-4 h-4 mr-2 flex-shrink-0" />
                      Settings
                    </Link>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4 mr-2 flex-shrink-0" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Tab Navigation - Shown on mobile and tablet, hidden on desktop (where sidebar shows) */}
        <div className="lg:hidden mb-6">
          <div className="flex space-x-2 border-b border-gray-200">
            <button
              onClick={() => setSearchParams({ tab: 'about' })}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'about'
                  ? 'border-[#1a1a1a] text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="w-6 h-6 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white text-xs font-medium">
                {initials}
              </div>
              <span>About</span>
            </button>
            <button
              onClick={() => setSearchParams({ tab: 'trips' })}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'trips'
                  ? 'border-[#1a1a1a] text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Luggage className="w-5 h-5" />
              <span>Trips</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Sidebar - Desktop Only */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile</h2>
              <nav className="space-y-1">
                <button
                  onClick={() => setSearchParams({ tab: 'about' })}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'about'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {initials}
                  </div>
                  <span className="font-medium">About me</span>
                </button>
                <button
                  onClick={() => setSearchParams({ tab: 'trips' })}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'trips'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Luggage className="w-5 h-5" />
                  <span className="font-medium">Past trips</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {activeTab === 'about' && (
              <div className="space-y-6 sm:space-y-8">
                {/* About me Header */}
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">About me</h1>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {/* Success/Error Messages */}
                {success && (
                  <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-green-800">{success}</p>
                  </div>
                )}

                {(error || guestError) && (
                  <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-red-800">{error || guestError}</p>
                  </div>
                )}

                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                  {/* Profile Card */}
                  <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full lg:w-auto lg:flex-shrink-0">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                        {initials}
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">{displayName}</h3>
                      <p className="text-xs sm:text-sm text-gray-500">Guest</p>
                    </div>
                  </div>

                  {/* Profile Information Display */}
                  {!isEditing && (
                    <div className="flex-1 space-y-4 sm:space-y-6">
                      {/* Profile Completion Indicator */}
                      {!isProfileComplete && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs sm:text-sm font-semibold text-blue-900">Profile Completion</h3>
                            <span className="text-xs sm:text-sm font-medium text-blue-700">{profileCompletion}%</span>
                          </div>
                          <div className="w-full bg-blue-200 rounded-full h-2 mb-2 sm:mb-3">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${profileCompletion}%` }}
                            />
                          </div>
                          <p className="text-xs text-blue-700 mb-2 sm:mb-3">
                            Complete your profile to help hosts and guests get to know you better.
                          </p>
                          <button
                            onClick={() => setIsEditing(true)}
                            className="text-xs sm:text-sm text-blue-700 hover:text-blue-900 font-medium underline"
                          >
                            Complete profile →
                          </button>
                        </div>
                      )}

                      {/* Profile Details */}
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Full Name</h3>
                          <p className="text-sm sm:text-base text-gray-900 break-words">
                            {formData.fullName || <span className="text-gray-400 italic">Not set</span>}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Email</h3>
                          <p className="text-sm sm:text-base text-gray-900 break-all">{formData.email}</p>
                        </div>
                        {(formData.firstName || formData.lastName) && (
                          <div>
                            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Name</h3>
                            <p className="text-sm sm:text-base text-gray-900">
                              {formData.firstName} {formData.lastName}
                            </p>
                          </div>
                        )}
                        {formData.phone && (
                          <div>
                            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Phone</h3>
                            <p className="text-sm sm:text-base text-gray-900">{formData.phone}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Edit Form */}
                  {isEditing && (
                    <div className="flex-1 bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="fullName" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                            Full Name
                          </label>
                          <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent"
                            placeholder="John Doe"
                          />
                        </div>

                        <div>
                          <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            disabled
                            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                          />
                          <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="firstName" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                              First Name
                            </label>
                            <input
                              type="text"
                              id="firstName"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent"
                              placeholder="John"
                            />
                          </div>

                          <div>
                            <label htmlFor="lastName" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                              Last Name
                            </label>
                            <input
                              type="text"
                              id="lastName"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent"
                              placeholder="Doe"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="phone" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent"
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                          <button
                            onClick={handleSaveProfile}
                            disabled={isSaving || updateGuestLoading}
                            className="flex-1 sm:flex-initial flex items-center justify-center px-4 py-2.5 bg-[#1a1a1a] text-white text-sm sm:text-base rounded-lg hover:bg-[#1a1a1a]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {(isSaving || updateGuestLoading) ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditing(false);
                              setError(null);
                              setFormData({
                                fullName: user?.user_metadata?.full_name || '',
                                email: user?.email || '',
                                phone: guest?.phone || '',
                                firstName: guest?.first_name || '',
                                lastName: guest?.last_name || '',
                              });
                            }}
                            className="flex-1 sm:flex-initial px-4 py-2.5 border border-gray-300 text-gray-700 text-sm sm:text-base rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="my-8">
                  <hr className="border-t border-gray-200" />
                </div>

                {/* Reviews Section */}
                <div className="mt-6 sm:mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Reviews I've written</h3>
                      {guestReviews.length > 0 && (
                        <span className="text-xs sm:text-sm text-gray-500">({guestReviews.length})</span>
                      )}
                    </div>
                  </div>
                  
                  {reviewsLoading ? (
                    <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      </div>
                    </div>
                  ) : guestReviews.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {guestReviews.map((review) => {
                        const property = (review as any).property;
                        const propertyTitle = property?.title || 'Property';
                        const propertyCity = property?.city || '';
                        const propertyState = property?.state || '';
                        const propertyId = review.property_id;
                        const firstImage = property?.images?.[0]?.url;
                        
                        return (
                          <div key={review.id} className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                              {/* Property Image */}
                              {firstImage && (
                                <div className="w-full sm:w-28 md:w-32 h-40 sm:h-28 md:h-32 flex-shrink-0">
                                  <Link to={`/properties/${propertyId}`}>
                                    <img
                                      src={firstImage}
                                      alt={propertyTitle}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  </Link>
                                </div>
                              )}
                              
                              {/* Review Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                                  <div className="flex-1 min-w-0">
                                    <Link
                                      to={`/properties/${propertyId}`}
                                      className="text-base sm:text-lg font-semibold text-gray-900 hover:text-[#1a1a1a] transition-colors flex items-center gap-2 group"
                                    >
                                      <span className="truncate">{propertyTitle}</span>
                                      <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                    </Link>
                                    {(propertyCity || propertyState) && (
                                      <div className="flex items-center text-xs sm:text-sm text-gray-500 mt-1">
                                        <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                                        <span className="truncate">{propertyCity}{propertyCity && propertyState ? ', ' : ''}{propertyState}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-1 sm:ml-4 flex-shrink-0">
                                    {renderStars(review.rating)}
                                  </div>
                                </div>
                                
                                {review.title && (
                                  <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-1.5 sm:mb-2">{review.title}</h4>
                                )}
                                
                                {review.comment && (
                                  <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-3">{review.comment}</p>
                                )}
                                
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
                                  <span>
                                    {new Date(review.created_at).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full w-fit ${
                                    review.status === 'approved' 
                                      ? 'bg-green-100 text-green-800'
                                      : review.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {review.status}
                                  </span>
                                </div>
                                
                                {review.host_response && (
                                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                                    <p className="text-xs font-medium text-gray-700 mb-1">Host Response:</p>
                                    <p className="text-xs sm:text-sm text-gray-600">{review.host_response}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-6 sm:p-8">
                      <div className="text-center py-6 sm:py-8">
                        <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-xs sm:text-sm text-gray-600 mb-2">No reviews yet</p>
                        <p className="text-xs text-gray-500">Start writing reviews after your trips!</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="my-8">
                  <hr className="border-t border-gray-200" />
                </div>

                {/* Change Password Section */}
                <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                      <Lock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Change Password
                    </h3>
                    {!isEditingPassword && (
                      <button
                        onClick={() => setIsEditingPassword(true)}
                        className="text-xs sm:text-sm text-[#1a1a1a] hover:underline font-medium self-start sm:self-auto"
                      >
                        Change Password
                      </button>
                    )}
                  </div>

                  {isEditingPassword ? (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="newPassword" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          id="newPassword"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent"
                          placeholder="Enter new password"
                        />
                      </div>

                      <div>
                        <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent"
                          placeholder="Confirm new password"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                          onClick={handleChangePassword}
                          disabled={isSaving}
                          className="flex-1 sm:flex-initial flex items-center justify-center px-4 py-2.5 bg-[#1a1a1a] text-white text-sm sm:text-base rounded-lg hover:bg-[#1a1a1a]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {isSaving ? 'Updating...' : 'Update Password'}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingPassword(false);
                            setError(null);
                            setPasswordData({
                              currentPassword: '',
                              newPassword: '',
                              confirmPassword: '',
                            });
                          }}
                          className="flex-1 sm:flex-initial px-4 py-2.5 border border-gray-300 text-gray-700 text-sm sm:text-base rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-gray-600">
                      Click "Change Password" to update your account password.
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'trips' && (
              <div className="space-y-6 sm:space-y-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Past trips</h1>
                {bookingsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : bookings && bookings.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {bookings.map((booking) => {
                      const property = booking.property as any;
                      const propertyTitle = property?.title || 'Property';
                      const propertyId = property?.id || '';
                      const propertyCity = property?.city || '';
                      const propertyState = property?.state || '';
                      const propertyImages = property?.images || [];
                      const firstImage = propertyImages[0]?.url;
                      
                      return (
                        <div key={booking.id} className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-shadow">
                          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            {/* Property Image */}
                            {firstImage && (
                              <div className="w-full sm:w-36 md:w-40 h-48 sm:h-36 md:h-40 flex-shrink-0">
                                <Link to={`/properties/${propertyId}`}>
                                  <img
                                    src={firstImage}
                                    alt={propertyTitle}
                                    className="w-full h-full object-cover rounded-lg hover:opacity-90 transition-opacity"
                                  />
                                </Link>
                              </div>
                            )}
                            
                            {/* Booking Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                                <div className="flex-1 min-w-0">
                                  <Link
                                    to={`/properties/${propertyId}`}
                                    className="text-base sm:text-lg font-semibold text-gray-900 hover:text-[#1a1a1a] transition-colors flex items-center gap-2 group"
                                  >
                                    <span className="truncate">{propertyTitle}</span>
                                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                  </Link>
                                  {(propertyCity || propertyState) && (
                                    <div className="flex items-center text-xs sm:text-sm text-gray-500 mt-1">
                                      <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                                      <span className="truncate">{propertyCity}{propertyCity && propertyState ? ', ' : ''}{propertyState}</span>
                                    </div>
                                  )}
                                </div>
                                <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap self-start sm:self-auto ${
                                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                  booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {booking.status}
                                </span>
                              </div>
                              
                              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3">
                                <div className="flex items-center">
                                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 flex-shrink-0" />
                                  <span className="truncate">{formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}</span>
                                </div>
                                <div className="flex items-center">
                                  <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 flex-shrink-0" />
                                  {booking.number_of_guests} {booking.number_of_guests === 1 ? 'guest' : 'guests'}
                                </div>
                              </div>
                              
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 pt-3 border-t border-gray-100">
                                <span className="text-base sm:text-lg font-semibold text-gray-900">
                                  {booking.total_price ? new Intl.NumberFormat('fr-FR', {
                                    style: 'currency',
                                    currency: 'XOF',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  }).format(booking.total_price) : new Intl.NumberFormat('fr-FR', {
                                    style: 'currency',
                                    currency: 'XOF',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  }).format(0)}
                                </span>
                                <Link
                                  to={`/properties/${propertyId}`}
                                  className="text-xs sm:text-sm text-[#1a1a1a] hover:underline font-medium self-start sm:self-auto"
                                >
                                  View Property →
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center">
                    <Luggage className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No trips yet</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-4">Start exploring properties and book your first trip!</p>
                    <Link
                      to={ROUTES.PROPERTIES}
                      className="inline-block px-5 sm:px-6 py-2.5 sm:py-3 bg-[#1a1a1a] text-white text-sm sm:text-base rounded-lg hover:bg-[#1a1a1a]/90 transition-colors font-medium"
                    >
                      Browse Properties
                    </Link>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Profile;
