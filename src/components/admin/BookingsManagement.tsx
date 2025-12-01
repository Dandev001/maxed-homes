import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Home,
  MapPin,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Ban,
  AlertCircle
} from 'lucide-react';
import { useBookingSearch } from '../../hooks/useBookings';
import { useConfirmBooking, useCancelBooking, useUpdateBookingStatus, useConfirmPayment, useRejectPayment } from '../../hooks/useBookings';
import { useAllProperties } from '../../hooks/useProperties';
import { useToast } from '../../contexts/ToastContext';
import type { BookingWithDetails, BookingFilters, BookingStatus } from '../../types/database';
import { Select } from '../ui';
import type { SelectOption } from '../ui';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';

export default function BookingsManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<BookingFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'created_at' | 'total_amount' | 'status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Get properties for filter dropdown
  const { results: propertiesResult } = useAllProperties({
    page: 1,
    limit: 1000, // Get all properties for filter
    filters: { status: 'active' }
  });

  // Fetch bookings with filters (no guest_id filter for admin view)
  // The hook automatically triggers search when filters or currentPage changes
  const { results, loading, error, search } = useBookingSearch(filters, currentPage, 20);

  const { confirmBooking, loading: confirming } = useConfirmBooking();
  const { cancelBooking, loading: cancelling } = useCancelBooking();
  const { updateStatus, loading: updatingStatus } = useUpdateBookingStatus();
  const { confirmPayment, loading: confirmingPayment } = useConfirmPayment();
  const { rejectPayment, loading: rejectingPayment } = useRejectPayment();
  const { success, error: showError } = useToast();

  // Filter and sort bookings (client-side for guest name/email search and sorting)
  const filteredBookings = useMemo(() => {
    if (!results?.data) return [];

    let filtered = results.data;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((booking) => {
        const guestName = `${booking.guest?.first_name || ''} ${booking.guest?.last_name || ''}`.toLowerCase();
        const guestEmail = booking.guest?.email?.toLowerCase() || '';
        return guestName.includes(query) || guestEmail.includes(query);
      });
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortBy) {
        case 'total_amount':
          aValue = a.total_amount;
          bValue = b.total_amount;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [results?.data, searchQuery, sortBy, sortOrder]);

  const handleApprove = async (bookingId: string) => {
    if (!confirm('Are you sure you want to approve this booking?')) return;

    setActionLoading(bookingId);
    try {
      await confirmBooking(bookingId);
      success('Booking approved successfully');
      search(filters, currentPage);
    } catch {
      showError('Failed to approve booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (bookingId: string) => {
    const reason = prompt('Please provide a reason for rejecting this booking:');
    if (!reason || !confirm('Are you sure you want to reject this booking?')) return;

    setActionLoading(bookingId);
    try {
      await updateStatus(bookingId, 'cancelled', reason);
      
      // Send rejection email to guest (non-blocking)
      try {
        const { bookingQueries } = await import('../../lib/queries/bookings');
        const { bookingToEmailData } = await import('../../lib/email/helpers');
        const { sendBookingRejectedEmail } = await import('../../lib/email');
        const { logError } = await import('../../utils/logger');
        
        const bookingWithDetails = await bookingQueries.getById(bookingId);
        if (bookingWithDetails) {
          const emailData = bookingToEmailData(bookingWithDetails);
          // Include the rejection reason in the email data
          emailData.cancellationReason = reason;
          sendBookingRejectedEmail(emailData).catch(err => {
            logError('Failed to send booking rejected email', err, 'BookingsManagement');
          });
        }
      } catch (emailError) {
        // Don't fail the rejection if email fails
        console.error('Error sending rejection email:', emailError);
      }
      
      success('Booking rejected successfully');
      search(filters, currentPage);
    } catch {
      showError('Failed to reject booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (bookingId: string) => {
    const reason = prompt('Please provide a reason for cancelling this booking:');
    if (!reason || !confirm('Are you sure you want to cancel this booking?')) return;

    setActionLoading(bookingId);
    try {
      await cancelBooking(bookingId, reason);
      success('Booking cancelled successfully');
      search(filters, currentPage);
    } catch {
      showError('Failed to cancel booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setCurrentPage(1);
  };

  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).length > 0 || searchQuery.trim().length > 0;
  }, [filters, searchQuery]);

  const statusOptions: BookingStatus[] = [
    'pending', 
    'awaiting_payment', 
    'awaiting_confirmation', 
    'payment_failed',
    'confirmed', 
    'cancelled', 
    'completed', 
    'expired'
  ];

  const statusSelectOptions: SelectOption[] = [
    { value: '', label: 'All Statuses' },
    ...statusOptions.map(status => ({
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1)
    }))
  ];

  const propertySelectOptions: SelectOption[] = [
    { value: '', label: 'All Properties' },
    ...(propertiesResult?.data || []).map(property => ({
      value: property.id,
      label: property.title
    }))
  ];

  const sortBySelectOptions: SelectOption[] = [
    { value: 'created_at', label: 'Date Created' },
    { value: 'total_amount', label: 'Total Amount' },
    { value: 'status', label: 'Status' }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusBadge = (status: BookingStatus) => {
    const baseClasses = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm';
    switch (status) {
      case 'confirmed':
        return `${baseClasses} bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200/60`;
      case 'pending':
        return `${baseClasses} bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border border-amber-200/60`;
      case 'awaiting_payment':
        return `${baseClasses} bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border border-yellow-200/60`;
      case 'awaiting_confirmation':
        return `${baseClasses} bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200/60`;
      case 'payment_failed':
        return `${baseClasses} bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200/60`;
      case 'cancelled':
        return `${baseClasses} bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200/60`;
      case 'completed':
        return `${baseClasses} bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200/60`;
      case 'expired':
        return `${baseClasses} bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border border-gray-200/60`;
      default:
        return `${baseClasses} bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border border-gray-200/60`;
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedBooking) return;
    if (!confirm('Are you sure you want to confirm this payment?')) return;

    setActionLoading(selectedBooking.id);
    try {
      await confirmPayment(selectedBooking.id);
      success('Payment confirmed successfully');
      search(filters, currentPage);
      setShowDetailsModal(false);
    } catch {
      showError('Failed to confirm payment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedBooking) return;
    const reason = prompt('Please provide a reason for rejecting this payment:');
    if (!reason || !confirm('Are you sure you want to reject this payment?')) return;

    setActionLoading(selectedBooking.id);
    try {
      await rejectPayment(selectedBooking.id, reason);
      success('Payment rejected');
      search(filters, currentPage);
      setShowDetailsModal(false);
    } catch {
      showError('Failed to reject payment');
    } finally {
      setActionLoading(null);
    }
  };

  const isLoading = loading || confirming || cancelling || updatingStatus || confirmingPayment || rejectingPayment;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Bookings Management</h2>
          <p className="text-gray-500 mt-2 text-sm md:text-base">View and manage all bookings across your platform</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5 space-y-5">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by guest name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-200 bg-gray-50/50 hover:bg-white"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-5 py-3 border rounded-xl transition-all duration-200 font-medium ${
              showFilters || hasActiveFilters
                ? 'bg-gray-900 text-white border-gray-900 shadow-lg'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 px-2.5 py-0.5 bg-white/20 text-white rounded-full text-xs font-semibold">
                {Object.keys(filters).length + (searchQuery ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="pt-5 border-t border-gray-200/60 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-200">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2.5">Status</label>
              <Select
                value={filters.status || ''}
                onChange={(value) =>
                  setFilters({ ...filters, status: value ? (value as BookingStatus) : undefined })
                }
                options={statusSelectOptions}
              />
            </div>

            {/* Property Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2.5">Property</label>
              <Select
                value={filters.property_id || ''}
                onChange={(value) =>
                  setFilters({ ...filters, property_id: value || undefined })
                }
                options={propertySelectOptions}
              />
            </div>

            {/* Check-in Date From */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2.5">Check-in From</label>
              <input
                type="date"
                value={filters.check_in_date_from || ''}
                onChange={(e) =>
                  setFilters({ ...filters, check_in_date_from: e.target.value || undefined })
                }
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-200 bg-gray-50/50 hover:bg-white"
              />
            </div>

            {/* Check-in Date To */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2.5">Check-in To</label>
              <input
                type="date"
                value={filters.check_in_date_to || ''}
                onChange={(e) =>
                  setFilters({ ...filters, check_in_date_to: e.target.value || undefined })
                }
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all duration-200 bg-gray-50/50 hover:bg-white"
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2.5">Sort By</label>
              <Select
                value={sortBy}
                onChange={(value) => setSortBy(value as typeof sortBy)}
                options={sortBySelectOptions}
              />
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2.5">Order</label>
              <Select
                value={sortOrder}
                onChange={(value) => setSortOrder(value as typeof sortOrder)}
                options={[
                  { value: 'desc', label: 'Descending' },
                  { value: 'asc', label: 'Ascending' }
                ]}
              />
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      {results && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 font-medium">
            Showing <span className="text-gray-900 font-semibold">{filteredBookings.length}</span> of{' '}
            <span className="text-gray-900 font-semibold">{results.total}</span> bookings
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-16 text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-gray-200 border-t-gray-900"></div>
          <p className="mt-5 text-gray-600 font-medium">Loading bookings...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/60 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 text-red-800">
            <div className="p-2 bg-red-100 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold">Error loading bookings</p>
              <p className="text-red-600 mt-1 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bookings Table */}
      {!loading && !error && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50 border-b border-gray-200/60">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Guest
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Guests
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="p-4 bg-gray-100 rounded-2xl mb-4">
                          <Calendar className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-lg font-semibold text-gray-900">No bookings found</p>
                        <p className="text-sm text-gray-500 mt-1.5">
                          {hasActiveFilters
                            ? 'Try adjusting your filters'
                            : 'There are no bookings yet'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50/50 transition-all duration-150 group">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group-hover:from-gray-200 group-hover:to-gray-300 transition-all duration-200">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {booking.guest?.first_name} {booking.guest?.last_name}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">{booking.guest?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm font-semibold text-gray-900">
                          {booking.property?.title || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {booking.property?.city}, {booking.property?.state}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(booking.check_in_date)}
                            </div>
                            <div className="text-xs text-gray-500">
                              to {formatDate(booking.check_out_date)}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {booking.total_nights} night{booking.total_nights !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
                          <User className="w-3.5 h-3.5" />
                          {booking.guests_count}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {formatCurrency(booking.total_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={getStatusBadge(booking.status)}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(booking)}
                            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {booking.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(booking.id)}
                                disabled={isLoading || actionLoading === booking.id}
                                className="p-2 text-green-600 hover:text-white hover:bg-green-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(booking.id)}
                                disabled={isLoading || actionLoading === booking.id}
                                className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {booking.status === 'confirmed' && (
                            <button
                              onClick={() => handleCancel(booking.id)}
                              disabled={isLoading || actionLoading === booking.id}
                              className="p-2 text-orange-600 hover:text-white hover:bg-orange-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                              title="Cancel"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {results && results.total_pages > 1 && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-50/50 px-6 py-4 border-t border-gray-200/60 flex items-center justify-between">
              <div className="text-sm text-gray-600 font-medium">
                Page <span className="text-gray-900 font-semibold">{results.page}</span> of{' '}
                <span className="text-gray-900 font-semibold">{results.total_pages}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={!results.has_prev || loading}
                  className="p-2.5 rounded-xl border border-gray-200 hover:bg-white hover:border-gray-300 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(results.total_pages, p + 1))}
                  disabled={!results.has_next || loading}
                  className="p-2.5 rounded-xl border border-gray-200 hover:bg-white hover:border-gray-300 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 px-8 py-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Booking Details</h3>
                  <p className="text-sm text-white/70 mt-0.5">Complete booking information</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedBooking(null);
                }}
                className="p-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 text-white hover:rotate-90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Guest Information */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-6 border border-gray-200/60">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Guest Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Name</p>
                    <p className="text-base font-semibold text-gray-900">
                      {selectedBooking.guest?.first_name} {selectedBooking.guest?.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</p>
                    <p className="text-base font-semibold text-gray-900">{selectedBooking.guest?.email}</p>
                  </div>
                  {selectedBooking.guest?.phone && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phone</p>
                      <p className="text-base font-semibold text-gray-900">{selectedBooking.guest.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Property Information */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl p-6 border border-blue-200/60">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Property Information
                </h4>
                <div className="space-y-3">
                  <p className="text-lg font-bold text-gray-900">{selectedBooking.property?.title}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {selectedBooking.property?.address}, {selectedBooking.property?.city},{' '}
                    {selectedBooking.property?.state} {selectedBooking.property?.zip_code}
                  </p>
                  {selectedBooking.property && (
                    <Link
                      to={`${ROUTES.PROPERTIES}/${selectedBooking.property.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                    >
                      View Property <Eye className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Booking Dates */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50/50 rounded-2xl p-6 border border-purple-200/60">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Booking Dates
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Check-in</p>
                    <p className="text-base font-bold text-gray-900">
                      {formatDate(selectedBooking.check_in_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Check-out</p>
                    <p className="text-base font-bold text-gray-900">
                      {formatDate(selectedBooking.check_out_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Total Nights</p>
                    <p className="text-base font-bold text-gray-900">
                      {selectedBooking.total_nights} night{selectedBooking.total_nights !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Guests</p>
                    <p className="text-base font-bold text-gray-900">{selectedBooking.guests_count}</p>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-gradient-to-br from-emerald-50 to-green-50/50 rounded-2xl p-6 border border-emerald-200/60">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Price Breakdown
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Base Price</span>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(selectedBooking.base_price)}</span>
                  </div>
                  {selectedBooking.cleaning_fee > 0 && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600">Cleaning Fee</span>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(selectedBooking.cleaning_fee)}</span>
                    </div>
                  )}
                  {selectedBooking.security_deposit > 0 && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600">Security Deposit</span>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(selectedBooking.security_deposit)}</span>
                    </div>
                  )}
                  {selectedBooking.taxes > 0 && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600">Taxes</span>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(selectedBooking.taxes)}</span>
                    </div>
                  )}
                  <div className="border-t-2 border-gray-300 pt-3 mt-2 flex justify-between items-center">
                    <span className="text-base font-bold text-gray-900">Total Amount</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(selectedBooking.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Status and Dates */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-2xl p-6 border border-amber-200/60">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Status & Dates
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Status</p>
                    <span className={getStatusBadge(selectedBooking.status)}>
                      {selectedBooking.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Created</p>
                    <p className="text-base font-semibold text-gray-900">
                      {formatDate(selectedBooking.created_at)}
                    </p>
                  </div>
                  {selectedBooking.cancelled_at && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Cancelled At</p>
                      <p className="text-base font-semibold text-gray-900">
                        {formatDate(selectedBooking.cancelled_at)}
                      </p>
                    </div>
                  )}
                  {selectedBooking.cancellation_reason && (
                    <div className="col-span-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Cancellation Reason</p>
                      <p className="text-sm font-medium text-gray-900 bg-white/60 rounded-lg p-3 border border-gray-200">
                        {selectedBooking.cancellation_reason}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Verification Section */}
              {selectedBooking.status === 'awaiting_confirmation' && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl p-6 border-2 border-blue-300/60">
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Payment Verification Required
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Payment Method</p>
                      <p className="text-base font-semibold text-gray-900">
                        {selectedBooking.payment_method ? 
                          selectedBooking.payment_method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
                          'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Transaction Reference</p>
                      <p className="text-base font-mono text-gray-900 bg-white/60 rounded-lg p-3 border border-gray-200">
                        {selectedBooking.payment_reference || 'N/A'}
                      </p>
                    </div>
                    
                    {selectedBooking.payment_proof_url && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Payment Proof</p>
                        <img
                          src={selectedBooking.payment_proof_url}
                          alt="Payment proof"
                          className="w-full max-w-md rounded-lg border-2 border-gray-200 shadow-sm"
                        />
                      </div>
                    )}
                    
                    <div className="flex gap-3 pt-4 border-t border-blue-200/60">
                      <button
                        onClick={handleConfirmPayment}
                        disabled={isLoading || actionLoading === selectedBooking.id}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Confirm Payment
                      </button>
                      <button
                        onClick={handleRejectPayment}
                        disabled={isLoading || actionLoading === selectedBooking.id}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                      >
                        <XCircle className="w-5 h-5" />
                        Reject Payment
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Special Requests */}
              {selectedBooking.special_requests && (
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50/50 rounded-2xl p-6 border border-indigo-200/60">
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Special Requests
                  </h4>
                  <p className="text-sm text-gray-900 bg-white/60 rounded-lg p-4 border border-gray-200 leading-relaxed">
                    {selectedBooking.special_requests}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t-2 border-gray-200">
                {selectedBooking.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleApprove(selectedBooking.id);
                        setShowDetailsModal(false);
                      }}
                      disabled={isLoading || actionLoading === selectedBooking.id}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedBooking.id);
                        setShowDetailsModal(false);
                      }}
                      disabled={isLoading || actionLoading === selectedBooking.id}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject
                    </button>
                  </>
                )}
                {selectedBooking.status === 'confirmed' && (
                  <button
                    onClick={() => {
                      handleCancel(selectedBooking.id);
                      setShowDetailsModal(false);
                    }}
                    disabled={isLoading || actionLoading === selectedBooking.id}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                  >
                    <Ban className="w-5 h-5" />
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

