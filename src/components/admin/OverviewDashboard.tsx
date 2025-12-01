import { usePropertyStats } from '../../hooks/useProperties';
import { useBookingStats, useBookingSearch } from '../../hooks/useBookings';
import { useGuestStats } from '../../hooks/useGuests';
import { useHostStats } from '../../hooks/useUsers';
import { useAllContactMessages } from '../../hooks/useContactMessages';
import { useAllProperties } from '../../hooks/useProperties';
import { 
  Home, 
  Calendar, 
  Users, 
  DollarSign, 
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  TrendingUp,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { BookingWithDetails } from '../../types/database';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'indigo';
  loading?: boolean;
  link?: string;
}

function StatCard({ title, value, icon: Icon, color, loading, link }: StatCardProps) {
  const content = (
    <div className={`group relative bg-white rounded-2xl border border-gray-200/60 p-6 hover:border-[#1a1a1a] hover:shadow-sm transition-all duration-300 ${link ? 'cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">{title}</p>
          {loading ? (
            <div className="h-10 w-32 bg-gray-100 rounded animate-pulse"></div>
          ) : (
            <p className="text-3xl font-bold text-[#1a1a1a] tracking-tight">{value}</p>
          )}
        </div>
        <div className="ml-4 p-2.5 rounded-xl bg-[#1a1a1a]/5 flex-shrink-0 group-hover:bg-[#1a1a1a]/10 transition-colors">
          <Icon className="w-5 h-5 text-[#1a1a1a]" />
        </div>
      </div>
      {link && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center text-xs font-medium text-gray-400 group-hover:text-[#1a1a1a] transition-colors">
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      )}
    </div>
  );

  if (link) {
    return <Link to={link} className="block">{content}</Link>;
  }

  return content;
}

export default function OverviewDashboard() {
  const { stats: propertyStats, loading: propertyLoading } = usePropertyStats();
  const { stats: bookingStats, loading: bookingLoading } = useBookingStats();
  const { stats: guestStats, loading: guestLoading } = useGuestStats();
  const { stats: hostStats, loading: hostLoading } = useHostStats();
  const { messages, loading: messagesLoading } = useAllContactMessages();
  
  // Get recent bookings (pending and confirmed)
  const { results: recentBookingsResult, loading: recentBookingsLoading } = useBookingSearch(
    { status: 'pending' },
    1,
    5
  );
  
  // Get recent properties
  const { results: recentPropertiesResult, loading: recentPropertiesLoading } = useAllProperties({
    page: 1,
    limit: 5,
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  const isLoading = propertyLoading || bookingLoading || guestLoading || hostLoading;

  // Calculate active users
  const activeUsers = (guestStats?.active || 0) + (hostStats?.active || 0);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get recent bookings (pending first, then recent confirmed)
  const recentBookings: BookingWithDetails[] = recentBookingsResult?.data || [];
  const newMessages = messages.filter(m => m.status === 'new').length;

  return (
    <div className="space-y-10">
      {/* Welcome Header */}
      <div className="bg-[#1a1a1a] rounded-2xl p-8 md:p-10 text-white">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">Dashboard Overview</h1>
        <p className="text-gray-400 text-sm md:text-base mt-1">
          Welcome back! Here's what's happening on your platform today.
        </p>
      </div>

      {/* Key Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-[#1a1a1a] mb-5 tracking-tight">Key Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Properties"
            value={propertyStats?.total || 0}
            icon={Home}
            color="blue"
            loading={propertyLoading}
            link="/admin?tab=properties"
          />
          <StatCard
            title="Pending Bookings"
            value={bookingStats?.pending || 0}
            icon={Clock}
            color="yellow"
            loading={bookingLoading}
            link="/admin?tab=bookings"
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(bookingStats?.totalRevenue || 0)}
            icon={DollarSign}
            color="green"
            loading={bookingLoading}
            link="/admin?tab=analytics"
          />
          <StatCard
            title="Active Users"
            value={activeUsers}
            icon={Users}
            color="purple"
            loading={guestLoading || hostLoading}
            link="/admin?tab=users"
          />
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200/60 p-5 hover:border-[#1a1a1a]/20 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Confirmed Bookings</p>
              <p className="text-2xl font-bold text-[#1a1a1a]">{bookingStats?.confirmed || 0}</p>
            </div>
            <div className="p-2.5 bg-[#1a1a1a]/5 rounded-xl">
              <CheckCircle className="w-5 h-5 text-[#1a1a1a]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/60 p-5 hover:border-[#1a1a1a]/20 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">New Messages</p>
              <p className="text-2xl font-bold text-[#1a1a1a]">{newMessages}</p>
            </div>
            <div className="p-2.5 bg-[#1a1a1a]/5 rounded-xl">
              <Mail className="w-5 h-5 text-[#1a1a1a]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/60 p-5 hover:border-[#1a1a1a]/20 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Active Properties</p>
              <p className="text-2xl font-bold text-[#1a1a1a]">{propertyStats?.active || 0}</p>
            </div>
            <div className="p-2.5 bg-[#1a1a1a]/5 rounded-xl">
              <Home className="w-5 h-5 text-[#1a1a1a]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/60 p-5 hover:border-[#1a1a1a]/20 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Total Bookings</p>
              <p className="text-2xl font-bold text-[#1a1a1a]">{bookingStats?.total || 0}</p>
            </div>
            <div className="p-2.5 bg-[#1a1a1a]/5 rounded-xl">
              <Calendar className="w-5 h-5 text-[#1a1a1a]" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Bookings */}
        <div className="bg-white rounded-2xl border border-gray-200/60 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-[#1a1a1a] flex items-center gap-2.5 tracking-tight">
              <div className="p-1.5 bg-[#1a1a1a]/5 rounded-lg">
                <Clock className="w-4 h-4 text-[#1a1a1a]" />
              </div>
              Pending Bookings
            </h3>
            <Link
              to="/admin?tab=bookings"
              className="text-xs font-medium text-gray-500 hover:text-[#1a1a1a] flex items-center gap-1.5 transition-colors"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentBookingsLoading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100/50 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No pending bookings</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentBookings.slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl hover:bg-gray-100/50 border border-transparent hover:border-gray-200/60 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a1a1a] truncate">
                      {booking.guest?.first_name} {booking.guest?.last_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{booking.property?.title}</p>
                    <p className="text-xs text-gray-400 mt-1.5">
                      {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm font-bold text-[#1a1a1a]">{formatCurrency(booking.total_amount)}</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100 mt-1.5">
                      Pending
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Properties */}
        <div className="bg-white rounded-2xl border border-gray-200/60 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-[#1a1a1a] flex items-center gap-2.5 tracking-tight">
              <div className="p-1.5 bg-[#1a1a1a]/5 rounded-lg">
                <Home className="w-4 h-4 text-[#1a1a1a]" />
              </div>
              Recent Properties
            </h3>
            <Link
              to="/admin?tab=properties"
              className="text-xs font-medium text-gray-500 hover:text-[#1a1a1a] flex items-center gap-1.5 transition-colors"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentPropertiesLoading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100/50 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : !recentPropertiesResult?.data || recentPropertiesResult.data.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Home className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No properties yet</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentPropertiesResult.data.slice(0, 5).map((property) => (
                <div
                  key={property.id}
                  className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-xl hover:bg-gray-100/50 border border-transparent hover:border-gray-200/60 transition-all"
                >
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={property.images[0].image_url}
                      alt={property.title}
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gray-200/60 flex items-center justify-center flex-shrink-0">
                      <Home className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a1a1a] truncate">{property.title}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {property.city}, {property.state}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
                        property.status === 'active'
                          ? 'bg-green-50 text-green-700 border-green-100'
                          : 'bg-gray-50 text-gray-600 border-gray-100'
                      }`}>
                        {property.status}
                      </span>
                      {property.is_featured && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Messages Alert */}
      {newMessages > 0 && (
        <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#1a1a1a]">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-white/10 rounded-xl">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white tracking-tight">
                  {newMessages} new message{newMessages !== 1 ? 's' : ''} require your attention
                </h3>
                <p className="text-sm text-gray-300 mt-1">
                  Review and respond to contact form submissions
                </p>
              </div>
            </div>
            <Link
              to="/admin?tab=messages"
              className="px-5 py-2.5 bg-white text-[#1a1a1a] rounded-xl hover:bg-gray-100 transition-colors font-medium flex items-center gap-2 text-sm"
            >
              View Messages
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-200/60 p-6">
        <h3 className="text-base font-semibold text-[#1a1a1a] mb-5 tracking-tight">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link
            to="/admin?tab=properties"
            className="flex items-center gap-3 p-4 border border-gray-200/60 rounded-xl hover:border-[#1a1a1a] hover:bg-[#1a1a1a]/5 transition-all group"
          >
            <div className="p-2 bg-[#1a1a1a]/5 rounded-lg group-hover:bg-[#1a1a1a]/10 transition-colors">
              <Home className="w-4 h-4 text-[#1a1a1a]" />
            </div>
            <div>
              <p className="font-semibold text-[#1a1a1a] text-sm">Manage Properties</p>
              <p className="text-xs text-gray-500 mt-0.5">Add, edit, or remove properties</p>
            </div>
          </Link>
          <Link
            to="/admin?tab=bookings"
            className="flex items-center gap-3 p-4 border border-gray-200/60 rounded-xl hover:border-[#1a1a1a] hover:bg-[#1a1a1a]/5 transition-all group"
          >
            <div className="p-2 bg-[#1a1a1a]/5 rounded-lg group-hover:bg-[#1a1a1a]/10 transition-colors">
              <Calendar className="w-4 h-4 text-[#1a1a1a]" />
            </div>
            <div>
              <p className="font-semibold text-[#1a1a1a] text-sm">Manage Bookings</p>
              <p className="text-xs text-gray-500 mt-0.5">Approve or manage bookings</p>
            </div>
          </Link>
          <Link
            to="/admin?tab=analytics"
            className="flex items-center gap-3 p-4 border border-gray-200/60 rounded-xl hover:border-[#1a1a1a] hover:bg-[#1a1a1a]/5 transition-all group"
          >
            <div className="p-2 bg-[#1a1a1a]/5 rounded-lg group-hover:bg-[#1a1a1a]/10 transition-colors">
              <TrendingUp className="w-4 h-4 text-[#1a1a1a]" />
            </div>
            <div>
              <p className="font-semibold text-[#1a1a1a] text-sm">View Analytics</p>
              <p className="text-xs text-gray-500 mt-0.5">See detailed statistics and reports</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

