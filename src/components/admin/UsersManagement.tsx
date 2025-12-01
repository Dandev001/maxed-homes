import { useState, useMemo } from 'react';
import {
  Search,
  Users,
  UserCheck,
  Mail,
  Phone,
  Calendar,
  Home,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  X,
  Ban,
  CheckCircle,
  AlertTriangle,
  MoreVertical,
  Shield,
  ShieldOff
} from 'lucide-react';
import { useAllGuests, useAllHosts, useGuestBookingCount, useHostPropertyCount, useHostStats, useUpdateHost } from '../../hooks/useUsers';
import { useGuestStats, useUpdateGuest } from '../../hooks/useGuests';
import { useToast } from '../../contexts/ToastContext';
import type { Guest, Host, GuestStatus, HostStatus } from '../../types/database';
import { Select } from '../ui';
import type { SelectOption } from '../ui';

type TabType = 'guests' | 'hosts';

export default function UsersManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('guests');
  const [searchQuery, setSearchQuery] = useState('');
  const [guestPage, setGuestPage] = useState(1);
  const [hostPage, setHostPage] = useState(1);
  const [guestStatusFilter, setGuestStatusFilter] = useState<GuestStatus | ''>('');
  const [hostStatusFilter, setHostStatusFilter] = useState<HostStatus | ''>('');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [selectedHost, setSelectedHost] = useState<Host | null>(null);
  const [showGuestDetails, setShowGuestDetails] = useState(false);
  const [showHostDetails, setShowHostDetails] = useState(false);
  const [actionConfirm, setActionConfirm] = useState<{
    type: 'block' | 'unblock' | 'suspend' | 'activate' | 'verify' | null;
    userType: 'guest' | 'host' | null;
    userId: string | null;
    userName: string | null;
  }>({ type: null, userType: null, userId: null, userName: null });
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  const limit = 20;

  const { updateGuest, loading: updatingGuest } = useUpdateGuest();
  const { updateHost, loading: updatingHost } = useUpdateHost();
  const { success, error: showError } = useToast();

  // Fetch guests
  const { guests, total: totalGuests, totalPages: guestTotalPages, loading: guestsLoading, error: guestsError, refetch: refetchGuests } = useAllGuests(guestPage, limit);
  
  // Fetch hosts
  const { hosts, total: totalHosts, totalPages: hostTotalPages, loading: hostsLoading, error: hostsError, refetch: refetchHosts } = useAllHosts(hostPage, limit);

  // Fetch statistics
  const { stats: guestStats, refetch: refetchGuestStats } = useGuestStats();
  const { stats: hostStats, refetch: refetchHostStats } = useHostStats();

  // Filter guests
  const filteredGuests = useMemo(() => {
    let filtered = guests;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((guest) => {
        const fullName = `${guest.first_name} ${guest.last_name}`.toLowerCase();
        const email = guest.email.toLowerCase();
        return fullName.includes(query) || email.includes(query) || guest.phone?.toLowerCase().includes(query);
      });
    }

    // Apply status filter
    if (guestStatusFilter) {
      filtered = filtered.filter((guest) => guest.status === guestStatusFilter);
    }

    return filtered;
  }, [guests, searchQuery, guestStatusFilter]);

  // Filter hosts
  const filteredHosts = useMemo(() => {
    let filtered = hosts;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((host) => {
        const fullName = `${host.first_name} ${host.last_name}`.toLowerCase();
        const email = host.email.toLowerCase();
        const company = host.company_name?.toLowerCase() || '';
        return fullName.includes(query) || email.includes(query) || company.includes(query) || host.phone?.toLowerCase().includes(query);
      });
    }

    // Apply status filter
    if (hostStatusFilter) {
      filtered = filtered.filter((host) => host.status === hostStatusFilter);
    }

    return filtered;
  }, [hosts, searchQuery, hostStatusFilter]);

  const getGuestStatusBadge = (status: GuestStatus) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold';
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-700`;
      case 'inactive':
        return `${baseClasses} bg-gray-100 text-gray-700`;
      case 'blocked':
        return `${baseClasses} bg-red-100 text-red-700`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  };

  const getHostStatusBadge = (status: HostStatus) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold';
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-700`;
      case 'inactive':
        return `${baseClasses} bg-gray-100 text-gray-700`;
      case 'suspended':
        return `${baseClasses} bg-red-100 text-red-700`;
      case 'pending_verification':
        return `${baseClasses} bg-yellow-100 text-yellow-700`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const guestStatusOptions: SelectOption[] = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'blocked', label: 'Blocked' }
  ];

  const hostStatusOptions: SelectOption[] = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'pending_verification', label: 'Pending Verification' }
  ];

  const handleViewGuest = (guest: Guest) => {
    setSelectedGuest(guest);
    setShowGuestDetails(true);
  };

  const handleViewHost = (host: Host) => {
    setSelectedHost(host);
    setShowHostDetails(true);
  };

  const handleGuestAction = (action: 'block' | 'unblock', guest: Guest) => {
    setActionConfirm({
      type: action,
      userType: 'guest',
      userId: guest.id,
      userName: `${guest.first_name} ${guest.last_name}`
    });
    setShowActionMenu(null);
  };

  const handleHostAction = (action: 'suspend' | 'activate' | 'verify', host: Host) => {
    setActionConfirm({
      type: action,
      userType: 'host',
      userId: host.id,
      userName: `${host.first_name} ${host.last_name}`
    });
    setShowActionMenu(null);
  };

  const confirmAction = async () => {
    if (!actionConfirm.userId || !actionConfirm.type) return;

    try {
      if (actionConfirm.userType === 'guest') {
        const newStatus: GuestStatus = actionConfirm.type === 'block' ? 'blocked' : 'active';
        const result = await updateGuest(actionConfirm.userId, { status: newStatus });
        if (result) {
          success(`Guest ${actionConfirm.type === 'block' ? 'blocked' : 'unblocked'} successfully`);
          refetchGuests();
          refetchGuestStats();
          if (selectedGuest?.id === actionConfirm.userId) {
            setSelectedGuest(result);
          }
        } else {
          showError('Failed to update guest status');
        }
      } else if (actionConfirm.userType === 'host') {
        let updates: any = {};
        if (actionConfirm.type === 'suspend') {
          updates.status = 'suspended';
        } else if (actionConfirm.type === 'activate') {
          updates.status = 'active';
        } else if (actionConfirm.type === 'verify') {
          updates.is_verified = true;
          // If host is pending verification, also activate them
          const host = hosts.find(h => h.id === actionConfirm.userId);
          if (host?.status === 'pending_verification') {
            updates.status = 'active';
          }
        }
        
        const result = await updateHost(actionConfirm.userId, updates);
        if (result) {
          const actionText = actionConfirm.type === 'suspend' ? 'suspended' : actionConfirm.type === 'activate' ? 'activated' : 'verified';
          success(`Host ${actionText} successfully`);
          refetchHosts();
          refetchHostStats();
          if (selectedHost?.id === actionConfirm.userId) {
            setSelectedHost(result);
          }
        } else {
          showError('Failed to update host status');
        }
      }
      setActionConfirm({ type: null, userType: null, userId: null, userName: null });
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to perform action');
    }
  };

  const isLoading = activeTab === 'guests' ? guestsLoading : hostsLoading;
  const error = activeTab === 'guests' ? guestsError : hostsError;
  const isUpdating = updatingGuest || updatingHost;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a1a] tracking-tight">Users Management</h2>
        <p className="text-gray-500 mt-1.5 text-sm">View and manage all guests and hosts on your platform</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Guest Stats */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Total Guests</p>
              <p className="text-3xl font-bold text-[#1a1a1a]">{guestStats?.total || 0}</p>
            </div>
            <div className="w-10 h-10 bg-[#1a1a1a]/5 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-[#1a1a1a]" />
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100 flex gap-3 text-xs text-gray-600">
            <span className="font-medium text-green-600">Active: {guestStats?.active || 0}</span>
            <span className="text-gray-300">•</span>
            <span>Inactive: {guestStats?.inactive || 0}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Blocked Guests</p>
              <p className="text-3xl font-bold text-[#1a1a1a]">{guestStats?.blocked || 0}</p>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>

        {/* Host Stats */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Total Hosts</p>
              <p className="text-3xl font-bold text-[#1a1a1a]">{hostStats?.total || 0}</p>
            </div>
            <div className="w-10 h-10 bg-[#1a1a1a]/5 rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-[#1a1a1a]" />
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100 flex gap-3 text-xs text-gray-600">
            <span className="font-medium text-green-600">Active: {hostStats?.active || 0}</span>
            <span className="text-gray-300">•</span>
            <span className="text-amber-600">Pending: {hostStats?.pending_verification || 0}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Suspended Hosts</p>
              <p className="text-3xl font-bold text-[#1a1a1a]">{hostStats?.suspended || 0}</p>
            </div>
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="border-b border-gray-100">
          <nav className="flex -mb-px">
            <button
              onClick={() => {
                setActiveTab('guests');
                setSearchQuery('');
                setGuestStatusFilter('');
              }}
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition-all duration-200 ${
                activeTab === 'guests'
                  ? 'border-[#1a1a1a] text-[#1a1a1a]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
              }`}
            >
              Guests ({totalGuests})
            </button>
            <button
              onClick={() => {
                setActiveTab('hosts');
                setSearchQuery('');
                setHostStatusFilter('');
              }}
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition-all duration-200 ${
                activeTab === 'hosts'
                  ? 'border-[#1a1a1a] text-[#1a1a1a]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
              }`}
            >
              Hosts ({totalHosts})
            </button>
          </nav>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/30">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={activeTab === 'guests' ? 'Search guests by name, email, or phone...' : 'Search hosts by name, email, company, or phone...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-0 rounded-xl focus:ring-2 focus:ring-[#1a1a1a] focus:ring-offset-0 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
              />
            </div>
            <div className="w-full lg:w-64">
              <Select
                value={activeTab === 'guests' ? guestStatusFilter : hostStatusFilter}
                onChange={(value) => {
                  if (activeTab === 'guests') {
                    setGuestStatusFilter(value as GuestStatus | '');
                  } else {
                    setHostStatusFilter(value as HostStatus | '');
                  }
                }}
                options={activeTab === 'guests' ? guestStatusOptions : hostStatusOptions}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#1a1a1a] border-t-transparent"></div>
              <p className="mt-4 text-sm text-gray-500">Loading {activeTab}...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-red-600 text-sm">Error: {error}</p>
            </div>
          ) : activeTab === 'guests' ? (
            <>
              {filteredGuests.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No guests found</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {filteredGuests.map((guest) => (
                      <GuestCard
                        key={guest.id}
                        guest={guest}
                        onView={() => handleViewGuest(guest)}
                        onBlock={() => handleGuestAction('block', guest)}
                        onUnblock={() => handleGuestAction('unblock', guest)}
                        getStatusBadge={getGuestStatusBadge}
                        formatDate={formatDate}
                        showActionMenu={showActionMenu === guest.id}
                        onToggleActionMenu={() => setShowActionMenu(showActionMenu === guest.id ? null : guest.id)}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {guestTotalPages > 1 && (
                    <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-100">
                      <div className="text-sm text-gray-500">
                        Showing {(guestPage - 1) * limit + 1} to {Math.min(guestPage * limit, totalGuests)} of {totalGuests} guests
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setGuestPage((p) => Math.max(1, p - 1))}
                          disabled={guestPage === 1}
                          className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1a1a1a] hover:text-white hover:border-[#1a1a1a] transition-all duration-200"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setGuestPage((p) => Math.min(guestTotalPages, p + 1))}
                          disabled={guestPage === guestTotalPages}
                          className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1a1a1a] hover:text-white hover:border-[#1a1a1a] transition-all duration-200"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              {filteredHosts.length === 0 ? (
                <div className="text-center py-16">
                  <Home className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No hosts found</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {filteredHosts.map((host) => (
                      <HostCard
                        key={host.id}
                        host={host}
                        onView={() => handleViewHost(host)}
                        onSuspend={() => handleHostAction('suspend', host)}
                        onActivate={() => handleHostAction('activate', host)}
                        onVerify={() => handleHostAction('verify', host)}
                        getStatusBadge={getHostStatusBadge}
                        formatDate={formatDate}
                        showActionMenu={showActionMenu === host.id}
                        onToggleActionMenu={() => setShowActionMenu(showActionMenu === host.id ? null : host.id)}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {hostTotalPages > 1 && (
                    <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-100">
                      <div className="text-sm text-gray-500">
                        Showing {(hostPage - 1) * limit + 1} to {Math.min(hostPage * limit, totalHosts)} of {totalHosts} hosts
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setHostPage((p) => Math.max(1, p - 1))}
                          disabled={hostPage === 1}
                          className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1a1a1a] hover:text-white hover:border-[#1a1a1a] transition-all duration-200"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setHostPage((p) => Math.min(hostTotalPages, p + 1))}
                          disabled={hostPage === hostTotalPages}
                          className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1a1a1a] hover:text-white hover:border-[#1a1a1a] transition-all duration-200"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Guest Details Modal */}
      {showGuestDetails && selectedGuest && (
        <GuestDetailsModal
          guest={selectedGuest}
          onClose={() => {
            setShowGuestDetails(false);
            setSelectedGuest(null);
          }}
          onBlock={() => handleGuestAction('block', selectedGuest)}
          onUnblock={() => handleGuestAction('unblock', selectedGuest)}
          getStatusBadge={getGuestStatusBadge}
          formatDate={formatDate}
        />
      )}

      {/* Host Details Modal */}
      {showHostDetails && selectedHost && (
        <HostDetailsModal
          host={selectedHost}
          onClose={() => {
            setShowHostDetails(false);
            setSelectedHost(null);
          }}
          onSuspend={() => handleHostAction('suspend', selectedHost)}
          onActivate={() => handleHostAction('activate', selectedHost)}
          onVerify={() => handleHostAction('verify', selectedHost)}
          getStatusBadge={getHostStatusBadge}
          formatDate={formatDate}
        />
      )}

      {/* Action Confirmation Modal */}
      {actionConfirm.type && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setActionConfirm({ type: null, userType: null, userId: null, userName: null })}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  actionConfirm.type === 'block' || actionConfirm.type === 'suspend' 
                    ? 'bg-red-50' 
                    : actionConfirm.type === 'verify'
                    ? 'bg-blue-50'
                    : 'bg-green-50'
                }`}>
                  {actionConfirm.type === 'block' || actionConfirm.type === 'suspend' ? (
                    <Ban className="w-6 h-6 text-red-600" />
                  ) : actionConfirm.type === 'verify' ? (
                    <Shield className="w-6 h-6 text-blue-600" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1a1a1a]">
                    {actionConfirm.type === 'block' && 'Block Guest'}
                    {actionConfirm.type === 'unblock' && 'Unblock Guest'}
                    {actionConfirm.type === 'suspend' && 'Suspend Host'}
                    {actionConfirm.type === 'activate' && 'Activate Host'}
                    {actionConfirm.type === 'verify' && 'Verify Host'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">Confirm this action</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Are you sure you want to {actionConfirm.type} <strong>{actionConfirm.userName}</strong>? 
                {actionConfirm.type === 'block' && ' This will prevent them from making bookings.'}
                {actionConfirm.type === 'suspend' && ' This will prevent them from managing properties.'}
                {actionConfirm.type === 'verify' && ' This will mark them as a verified host.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setActionConfirm({ type: null, userType: null, userId: null, userName: null })}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  disabled={isUpdating}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-white transition-all ${
                    actionConfirm.type === 'block' || actionConfirm.type === 'suspend'
                      ? 'bg-red-600 hover:bg-red-700'
                      : actionConfirm.type === 'verify'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-green-600 hover:bg-green-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isUpdating ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Guest Card Component
interface GuestCardProps {
  guest: Guest;
  onView: () => void;
  onBlock: () => void;
  onUnblock: () => void;
  getStatusBadge: (status: GuestStatus) => string;
  formatDate: (date: string) => string;
  showActionMenu: boolean;
  onToggleActionMenu: () => void;
}

function GuestCard({ guest, onView, onBlock, onUnblock, getStatusBadge, formatDate, showActionMenu, onToggleActionMenu }: GuestCardProps) {
  const { count: bookingCount } = useGuestBookingCount(guest.id);
  const isBlocked = guest.status === 'blocked';

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg hover:border-gray-200 transition-all duration-200 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-14 h-14 bg-gradient-to-br from-[#1a1a1a]/5 to-[#1a1a1a]/10 rounded-2xl flex items-center justify-center flex-shrink-0 ring-1 ring-gray-100">
            {guest.profile_image_url ? (
              <img src={guest.profile_image_url} alt={`${guest.first_name} ${guest.last_name}`} className="w-14 h-14 rounded-2xl object-cover" />
            ) : (
              <Users className="w-7 h-7 text-[#1a1a1a]/60" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-2">
              <h3 className="font-semibold text-[#1a1a1a] truncate text-base">
                {guest.first_name} {guest.last_name}
              </h3>
              <span className={getStatusBadge(guest.status)}>
                {guest.status.charAt(0).toUpperCase() + guest.status.slice(1)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span className="truncate">{guest.email}</span>
              </div>
              {guest.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{guest.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(guest.created_at)}</span>
              </div>
              {bookingCount !== null && (
                <div className="flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5" />
                  <span className="font-medium text-[#1a1a1a]">{bookingCount} booking{bookingCount !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onView}
            className="px-5 py-2.5 bg-[#1a1a1a] text-white rounded-xl hover:bg-[#1a1a1a]/90 transition-all duration-200 flex items-center gap-2 text-sm font-medium shadow-sm hover:shadow-md"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
          <div className="relative">
            <button
              onClick={onToggleActionMenu}
              className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>
            {showActionMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={onToggleActionMenu} />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-gray-100 shadow-lg z-20 py-1">
                  {isBlocked ? (
                    <button
                      onClick={onUnblock}
                      className="w-full px-4 py-2.5 text-left text-sm text-green-700 hover:bg-green-50 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Unblock Guest
                    </button>
                  ) : (
                    <button
                      onClick={onBlock}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <Ban className="w-4 h-4" />
                      Block Guest
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Host Card Component
interface HostCardProps {
  host: Host;
  onView: () => void;
  onSuspend: () => void;
  onActivate: () => void;
  onVerify: () => void;
  getStatusBadge: (status: HostStatus) => string;
  formatDate: (date: string) => string;
  showActionMenu: boolean;
  onToggleActionMenu: () => void;
}

function HostCard({ host, onView, onSuspend, onActivate, onVerify, getStatusBadge, formatDate, showActionMenu, onToggleActionMenu }: HostCardProps) {
  const { count: propertyCount } = useHostPropertyCount(host.id);
  const isSuspended = host.status === 'suspended';
  const isActive = host.status === 'active';
  const isPending = host.status === 'pending_verification';

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg hover:border-gray-200 transition-all duration-200 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-14 h-14 bg-gradient-to-br from-[#1a1a1a]/5 to-[#1a1a1a]/10 rounded-2xl flex items-center justify-center flex-shrink-0 ring-1 ring-gray-100">
            {host.profile_image_url ? (
              <img src={host.profile_image_url} alt={`${host.first_name} ${host.last_name}`} className="w-14 h-14 rounded-2xl object-cover" />
            ) : (
              <Home className="w-7 h-7 text-[#1a1a1a]/60" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              <h3 className="font-semibold text-[#1a1a1a] truncate text-base">
                {host.first_name} {host.last_name}
              </h3>
              {host.is_verified && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                  Verified
                </span>
              )}
              <span className={getStatusBadge(host.status)}>
                {host.status === 'pending_verification' ? 'Pending Verification' : host.status.charAt(0).toUpperCase() + host.status.slice(1)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span className="truncate">{host.email}</span>
              </div>
              {host.company_name && (
                <div className="flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5" />
                  <span className="truncate">{host.company_name}</span>
                </div>
              )}
              {host.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{host.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(host.created_at)}</span>
              </div>
              {propertyCount !== null && (
                <div className="flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5" />
                  <span className="font-medium text-[#1a1a1a]">{propertyCount} propert{propertyCount !== 1 ? 'ies' : 'y'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onView}
            className="px-5 py-2.5 bg-[#1a1a1a] text-white rounded-xl hover:bg-[#1a1a1a]/90 transition-all duration-200 flex items-center gap-2 text-sm font-medium shadow-sm hover:shadow-md"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
          <div className="relative">
            <button
              onClick={onToggleActionMenu}
              className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>
            {showActionMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={onToggleActionMenu} />
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-gray-100 shadow-lg z-20 py-1">
                  {!host.is_verified && (
                    <button
                      onClick={onVerify}
                      className="w-full px-4 py-2.5 text-left text-sm text-blue-700 hover:bg-blue-50 transition-colors flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      Verify Host
                    </button>
                  )}
                  {isSuspended ? (
                    <button
                      onClick={onActivate}
                      className="w-full px-4 py-2.5 text-left text-sm text-green-700 hover:bg-green-50 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Activate Host
                    </button>
                  ) : (
                    <button
                      onClick={onSuspend}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <Ban className="w-4 h-4" />
                      Suspend Host
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Guest Details Modal
interface GuestDetailsModalProps {
  guest: Guest;
  onClose: () => void;
  onBlock: () => void;
  onUnblock: () => void;
  getStatusBadge: (status: GuestStatus) => string;
  formatDate: (date: string) => string;
}

function GuestDetailsModal({ guest, onClose, onBlock, onUnblock, getStatusBadge, formatDate }: GuestDetailsModalProps) {
  const { count: bookingCount } = useGuestBookingCount(guest.id);
  const isBlocked = guest.status === 'blocked';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between backdrop-blur-sm bg-white/95">
          <h3 className="text-xl font-bold text-[#1a1a1a]">Guest Details</h3>
          <div className="flex items-center gap-2">
            {isBlocked ? (
              <button
                onClick={onUnblock}
                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Unblock
              </button>
            ) : (
              <button
                onClick={onBlock}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Ban className="w-4 h-4" />
                Block
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-gradient-to-br from-[#1a1a1a]/5 to-[#1a1a1a]/10 rounded-2xl flex items-center justify-center ring-1 ring-gray-100 flex-shrink-0">
              {guest.profile_image_url ? (
                <img src={guest.profile_image_url} alt={`${guest.first_name} ${guest.last_name}`} className="w-20 h-20 rounded-2xl object-cover" />
              ) : (
                <Users className="w-10 h-10 text-[#1a1a1a]/60" />
              )}
            </div>
            <div>
              <h4 className="text-2xl font-bold text-[#1a1a1a]">{guest.first_name} {guest.last_name}</h4>
              <div className="mt-2.5">
                <span className={getStatusBadge(guest.status)}>
                  {guest.status.charAt(0).toUpperCase() + guest.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Email</label>
              <p className="text-[#1a1a1a] font-medium">{guest.email}</p>
            </div>
            {guest.phone && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Phone</label>
                <p className="text-[#1a1a1a] font-medium">{guest.phone}</p>
              </div>
            )}
            {guest.date_of_birth && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Date of Birth</label>
                <p className="text-[#1a1a1a] font-medium">{formatDate(guest.date_of_birth)}</p>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Member Since</label>
              <p className="text-[#1a1a1a] font-medium">{formatDate(guest.created_at)}</p>
            </div>
            {bookingCount !== null && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Total Bookings</label>
                <p className="text-[#1a1a1a] font-medium">{bookingCount}</p>
              </div>
            )}
            {guest.emergency_contact_name && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Emergency Contact</label>
                <p className="text-[#1a1a1a] font-medium">
                  {guest.emergency_contact_name}
                  {guest.emergency_contact_phone && ` - ${guest.emergency_contact_phone}`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Host Details Modal
interface HostDetailsModalProps {
  host: Host;
  onClose: () => void;
  onSuspend: () => void;
  onActivate: () => void;
  onVerify: () => void;
  getStatusBadge: (status: HostStatus) => string;
  formatDate: (date: string) => string;
}

function HostDetailsModal({ host, onClose, onSuspend, onActivate, onVerify, getStatusBadge, formatDate }: HostDetailsModalProps) {
  const { count: propertyCount } = useHostPropertyCount(host.id);
  const isSuspended = host.status === 'suspended';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between backdrop-blur-sm bg-white/95">
          <h3 className="text-xl font-bold text-[#1a1a1a]">Host Details</h3>
          <div className="flex items-center gap-2">
            {!host.is_verified && (
              <button
                onClick={onVerify}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Verify
              </button>
            )}
            {isSuspended ? (
              <button
                onClick={onActivate}
                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Activate
              </button>
            ) : (
              <button
                onClick={onSuspend}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Ban className="w-4 h-4" />
                Suspend
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-gradient-to-br from-[#1a1a1a]/5 to-[#1a1a1a]/10 rounded-2xl flex items-center justify-center ring-1 ring-gray-100 flex-shrink-0">
              {host.profile_image_url ? (
                <img src={host.profile_image_url} alt={`${host.first_name} ${host.last_name}`} className="w-20 h-20 rounded-2xl object-cover" />
              ) : (
                <Home className="w-10 h-10 text-[#1a1a1a]/60" />
              )}
            </div>
            <div>
              <h4 className="text-2xl font-bold text-[#1a1a1a]">
                {host.first_name} {host.last_name}
                {host.is_verified && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    Verified
                  </span>
                )}
              </h4>
              <div className="mt-2.5">
                <span className={getStatusBadge(host.status)}>
                  {host.status === 'pending_verification' ? 'Pending Verification' : host.status.charAt(0).toUpperCase() + host.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Email</label>
              <p className="text-[#1a1a1a] font-medium">{host.email}</p>
            </div>
            {host.phone && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Phone</label>
                <p className="text-[#1a1a1a] font-medium">{host.phone}</p>
              </div>
            )}
            {host.company_name && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Company</label>
                <p className="text-[#1a1a1a] font-medium">{host.company_name}</p>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Member Since</label>
              <p className="text-[#1a1a1a] font-medium">{formatDate(host.created_at)}</p>
            </div>
            {propertyCount !== null && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Total Properties</label>
                <p className="text-[#1a1a1a] font-medium">{propertyCount}</p>
              </div>
            )}
            {host.bio && (
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Bio</label>
                <p className="text-[#1a1a1a] font-medium leading-relaxed">{host.bio}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

