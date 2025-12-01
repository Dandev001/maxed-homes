import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search,
  Filter,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
  X,
  ArrowLeft,
  Home,
  Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useGuestByEmail } from '../hooks/useGuests';
import { useGuestBookings } from '../hooks/useBookings';
import { useCancelBooking } from '../hooks/useBookings';
import { ROUTES } from '../constants';
import type { BookingWithDetails } from '../types/database';
import type { BookingStatus } from '../types/database';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  // Get guest record for the authenticated user by email
  const { guest, loading: guestLoading } = useGuestByEmail(user?.email || '');
  
  // Fetch bookings if guest exists
  const { bookings, loading: bookingsLoading, error: bookingsError, refetch: refetchBookings } = useGuestBookings(
    guest?.id || '',
    100
  );
  
  const { cancelBooking, loading: cancelLoading } = useCancelBooking();
  const { success: showSuccess, error: showError } = useToast();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  
  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [showFilters, setShowFilters] = useState(false);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId, 'Cancelled by user');
      await refetchBookings();
      showSuccess('Booking cancelled successfully');
    } catch {
      showError('Failed to cancel booking. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (!bookings) return null;

    const now = new Date();
    const total = bookings.length;
    const upcoming = bookings.filter(b => {
      const checkIn = new Date(b.check_in_date);
      return checkIn >= now && (b.status === 'confirmed' || b.status === 'awaiting_payment' || b.status === 'awaiting_confirmation');
    }).length;
    const pending = bookings.filter(b => 
      b.status === 'pending' || b.status === 'awaiting_payment' || b.status === 'awaiting_confirmation'
    ).length;
    const completed = bookings.filter(b => b.status === 'completed').length;
    const totalSpent = bookings
      .filter(b => b.status === 'confirmed' || b.status === 'completed')
      .reduce((sum, b) => sum + b.total_amount, 0);

    return { total, upcoming, pending, completed, totalSpent };
  }, [bookings]);

  // Filter and sort bookings
  const filteredBookings = useMemo(() => {
    if (!bookings) return [];

    let filtered = [...bookings];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(booking =>
        booking.property?.title?.toLowerCase().includes(query) ||
        booking.property?.city?.toLowerCase().includes(query) ||
        booking.id.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(booking => {
        const checkIn = new Date(booking.check_in_date);
        if (timeFilter === 'upcoming') {
          return checkIn >= now;
        } else {
          return checkIn < now;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.check_in_date).getTime() - new Date(a.check_in_date).getTime();
        case 'amount':
          return b.total_amount - a.total_amount;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [bookings, searchQuery, statusFilter, timeFilter, sortBy]);

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: typeof CheckCircle; label: string }> = {
      confirmed: { 
        bg: 'bg-green-50', 
        text: 'text-green-700', 
        icon: CheckCircle,
        label: 'Confirmed'
      },
      pending: { 
        bg: 'bg-amber-50', 
        text: 'text-amber-700', 
        icon: Clock,
        label: 'Pending'
      },
      awaiting_payment: { 
        bg: 'bg-yellow-50', 
        text: 'text-yellow-700', 
        icon: AlertCircle,
        label: 'Awaiting Payment'
      },
      awaiting_confirmation: { 
        bg: 'bg-blue-50', 
        text: 'text-blue-700', 
        icon: Clock,
        label: 'Awaiting Confirmation'
      },
      payment_failed: { 
        bg: 'bg-red-50', 
        text: 'text-red-700', 
        icon: XCircle,
        label: 'Payment Failed'
      },
      cancelled: { 
        bg: 'bg-gray-100', 
        text: 'text-gray-700', 
        icon: XCircle,
        label: 'Cancelled'
      },
      completed: { 
        bg: 'bg-blue-50', 
        text: 'text-blue-700', 
        icon: CheckCircle,
        label: 'Completed'
      },
      expired: { 
        bg: 'bg-gray-100', 
        text: 'text-gray-600', 
        icon: XCircle,
        label: 'Expired'
      },
    };

    return configs[status] || configs.pending;
  };

  // Show loading only while auth is loading
  if (authLoading || guestLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-400 text-sm font-normal">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Button Navbar */}
      <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => navigate(ROUTES.HOME)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="h-6 w-px bg-gray-200"></div>
              <Link
                to={ROUTES.HOME}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link
                to={ROUTES.PROPERTIES}
                className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100/50 rounded-lg transition-all"
              >
                <span className="hidden sm:inline">Properties</span>
                <span className="sm:hidden">Browse</span>
              </Link>
              <Link
                to={ROUTES.PROFILE}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100/50 rounded-lg transition-all"
                aria-label="Profile"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 pb-20 md:pb-10">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 mb-2 tracking-tight">My Bookings</h1>
          <p className="text-sm sm:text-base text-gray-500 font-normal">Manage and track all your reservations</p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1">Total</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1">Upcoming</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">{stats.upcoming}</p>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1">Pending</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">{stats.pending}</p>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1">Completed</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">{stats.completed}</p>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1">Total Spent</p>
              <p className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{formatCurrency(stats.totalSpent)}</p>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by property, city, or booking ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm sm:text-base placeholder:text-gray-400"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 sm:py-3 border rounded-xl font-medium text-sm sm:text-base transition-all flex items-center justify-center space-x-2 ${
                showFilters || statusFilter !== 'all' || timeFilter !== 'all'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as BookingStatus | 'all')}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm sm:text-base"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="awaiting_payment">Awaiting Payment</option>
                    <option value="awaiting_confirmation">Awaiting Confirmation</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="expired">Expired</option>
                    <option value="payment_failed">Payment Failed</option>
                  </select>
                </div>

                {/* Time Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Time Period
                  </label>
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value as 'all' | 'upcoming' | 'past')}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm sm:text-base"
                  >
                    <option value="all">All Time</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="past">Past</option>
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'status')}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm sm:text-base"
                  >
                    <option value="date">Date (Newest)</option>
                    <option value="amount">Amount (High to Low)</option>
                    <option value="status">Status</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bookings List */}
        {bookingsLoading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-500 text-sm font-normal">Loading your bookings...</p>
          </div>
        ) : bookingsError ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-600 mb-4 font-normal">{bookingsError}</p>
            <button
              onClick={() => refetchBookings()}
              className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all text-sm font-medium"
            >
              Try again
            </button>
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {filteredBookings.map((booking: BookingWithDetails) => {
              const statusConfig = getStatusConfig(booking.status);
              const StatusIcon = statusConfig.icon;
              const canCancel = booking.status === 'pending' || booking.status === 'confirmed' || booking.status === 'awaiting_payment';

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Left Section */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 truncate">
                              {booking.property?.title || 'Property'}
                            </h3>
                            <div className="flex items-center text-sm text-gray-500 mb-3">
                              <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />
                              <span className="truncate">{booking.property?.city}, {booking.property?.state}</span>
                            </div>
                          </div>
                          <div className={`inline-flex items-center space-x-1.5 px-3 py-1.5 ${statusConfig.bg} rounded-full ml-4 flex-shrink-0`}>
                            <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.text}`} />
                            <span className={`text-xs font-medium ${statusConfig.text} uppercase tracking-wide`}>
                              {statusConfig.label}
                            </span>
                          </div>
                        </div>

                        {/* Booking Details Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                          <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                            <p className="text-xs text-gray-500 font-medium mb-1">Check-in</p>
                            <p className="text-sm font-medium text-gray-900">{formatDate(booking.check_in_date)}</p>
                          </div>
                          <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                            <p className="text-xs text-gray-500 font-medium mb-1">Check-out</p>
                            <p className="text-sm font-medium text-gray-900">{formatDate(booking.check_out_date)}</p>
                          </div>
                          <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                            <p className="text-xs text-gray-500 font-medium mb-1">Guests</p>
                            <p className="text-sm font-medium text-gray-900 flex items-center">
                              <Users className="w-3.5 h-3.5 mr-1" />
                              {booking.guests_count}
                            </p>
                          </div>
                          <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                            <p className="text-xs text-gray-500 font-medium mb-1">Total</p>
                            <p className="text-sm font-medium text-gray-900">{formatCurrency(booking.total_amount)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Right Section - Actions */}
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:ml-6 lg:min-w-[140px]">
                        <Link
                          to={ROUTES.BOOKING_CONFIRMATION.replace(':id', booking.id)}
                          className="px-4 py-2.5 bg-[#1a1a1a] text-white rounded-xl hover:bg-gray-800 transition-all text-sm font-medium flex items-center justify-center space-x-2 shadow-sm hover:shadow-md"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </Link>
                        {canCancel && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={cancellingId === booking.id || cancelLoading}
                            className="px-4 py-2.5 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                          >
                            <X className="w-4 h-4" />
                            <span>{cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 sm:p-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-sm sm:text-base text-gray-500 mb-6 font-normal max-w-md mx-auto">
              {searchQuery || statusFilter !== 'all' || timeFilter !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'Start exploring our properties and book your next stay!'}
            </p>
            {(!searchQuery && statusFilter === 'all' && timeFilter === 'all') && (
              <Link
                to={ROUTES.PROPERTIES}
                className="inline-block px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-medium text-sm sm:text-base shadow-sm hover:shadow-md"
              >
                Browse Properties
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
