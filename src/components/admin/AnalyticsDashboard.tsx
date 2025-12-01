import { usePropertyStats } from '../../hooks/useProperties';
import { useBookingStats, useRevenueOverTime } from '../../hooks/useBookings';
import { useGuestStats } from '../../hooks/useGuests';
import { useHostStats } from '../../hooks/useUsers';
import { 
  Home, 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  Star,
  UserCheck
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'indigo';
  loading?: boolean;
  showGraph?: boolean;
  graphData?: Array<{ date: string; revenue: number }>;
  graphLoading?: boolean;
}

// Mini Graph Component
function MiniGraph({ data, loading }: { data: Array<{ date: string; revenue: number }>; loading?: boolean }) {
  if (loading || !data || data.length === 0) {
    return (
      <div className="h-10 w-full bg-gray-100 rounded animate-pulse"></div>
    );
  }

  const width = 120;
  const height = 36;
  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Calculate max value for scaling (add 10% padding at top)
  const maxValue = Math.max(...data.map(d => d.revenue), 1) * 1.1;
  const minValue = 0;
  const range = maxValue - minValue || 1;

  // Generate points for the line
  const points = data.map((item, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
    const y = padding + chartHeight - ((item.revenue - minValue) / range) * chartHeight;
    return { x, y, value: item.revenue };
  });

  // Create smooth path using quadratic curves
  const pathData = points.map((point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const prevPoint = points[index - 1];
    const midX = (prevPoint.x + point.x) / 2;
    return `Q ${prevPoint.x} ${prevPoint.y}, ${midX} ${(prevPoint.y + point.y) / 2} T ${point.x} ${point.y}`;
  }).join(' ');

  // Create area path (for gradient fill)
  const areaPath = `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <div className="mt-2 -mb-1">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <path
          d={areaPath}
          fill="url(#revenueGradient)"
        />
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke="rgb(99, 102, 241)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Points - only show first, middle, and last */}
        {points.map((point, index) => {
          if (index === 0 || index === points.length - 1 || index === Math.floor(points.length / 2)) {
            return (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="1.5"
                fill="rgb(99, 102, 241)"
              />
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, loading, showGraph, graphData, graphLoading }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-600',
    green: 'bg-emerald-500/10 text-emerald-600',
    yellow: 'bg-amber-500/10 text-amber-600',
    purple: 'bg-purple-500/10 text-purple-600',
    red: 'bg-red-500/10 text-red-600',
    indigo: 'bg-indigo-500/10 text-indigo-600',
  };

  return (
    <div className="group relative bg-white rounded-xl border border-gray-100 p-6 hover:border-gray-200 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{title}</p>
          {loading ? (
            <div className="h-9 w-32 bg-gray-100 rounded-md animate-pulse"></div>
          ) : (
            <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
          )}
        </div>
        <div className={`ml-4 p-3 rounded-xl ${colorClasses[color]} flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {showGraph && (
        <div className="mt-3">
          <MiniGraph data={graphData || []} loading={graphLoading} />
        </div>
      )}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const { stats: propertyStats, loading: propertyLoading } = usePropertyStats();
  const { stats: bookingStats, loading: bookingLoading } = useBookingStats();
  const { stats: guestStats, loading: guestLoading } = useGuestStats();
  const { stats: hostStats, loading: hostLoading } = useHostStats();
  const { data: revenueData, loading: revenueLoading } = useRevenueOverTime(7);

  const isLoading = propertyLoading || bookingLoading || guestLoading || hostLoading;

  // Calculate active users (active guests + active hosts)
  const activeUsers = (guestStats?.active || 0) + (hostStats?.active || 0);
  const totalUsers = (guestStats?.total || 0) + (hostStats?.total || 0);

  // Format revenue
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Properties"
          value={propertyStats?.total || 0}
          icon={Home}
          color="blue"
          loading={propertyLoading}
        />
        <StatCard
          title="Active Properties"
          value={propertyStats?.active || 0}
          icon={CheckCircle}
          color="green"
          loading={propertyLoading}
        />
        <StatCard
          title="Featured Properties"
          value={propertyStats?.featured || 0}
          icon={Star}
          color="yellow"
          loading={propertyLoading}
        />
        <StatCard
          title="Total Bookings"
          value={bookingStats?.total || 0}
          icon={Calendar}
          color="purple"
          loading={bookingLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Pending Bookings"
          value={bookingStats?.pending || 0}
          icon={Clock}
          color="yellow"
          loading={bookingLoading}
        />
        <StatCard
          title="Confirmed Bookings"
          value={bookingStats?.confirmed || 0}
          icon={CheckCircle}
          color="green"
          loading={bookingLoading}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(bookingStats?.totalRevenue || 0)}
          icon={DollarSign}
          color="indigo"
          loading={bookingLoading}
          showGraph={true}
          graphData={revenueData}
          graphLoading={revenueLoading}
        />
        <StatCard
          title="Active Users"
          value={activeUsers}
          icon={UserCheck}
          color="blue"
          loading={guestLoading || hostLoading}
        />
      </div>

      {/* Detailed Stats Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Bookings Breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 hover:border-gray-200 transition-colors">
          <h3 className="text-base font-semibold text-gray-900 mb-5 flex items-center">
            <div className="p-2 bg-purple-500/10 rounded-lg mr-3">
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
            Bookings Overview
          </h3>
          {bookingLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-11 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <div className="p-1.5 bg-emerald-500/10 rounded-md mr-3">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Confirmed</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {bookingStats?.confirmed || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <div className="p-1.5 bg-amber-500/10 rounded-md mr-3">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Pending</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {bookingStats?.pending || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <div className="p-1.5 bg-blue-500/10 rounded-md mr-3">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Completed</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {bookingStats?.completed || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <div className="p-1.5 bg-red-500/10 rounded-md mr-3">
                    <XCircle className="w-3.5 h-3.5 text-red-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Cancelled</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {bookingStats?.cancelled || 0}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Properties Breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 hover:border-gray-200 transition-colors">
          <h3 className="text-base font-semibold text-gray-900 mb-5 flex items-center">
            <div className="p-2 bg-blue-500/10 rounded-lg mr-3">
              <Home className="w-4 h-4 text-blue-600" />
            </div>
            Properties Overview
          </h3>
          {propertyLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-11 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <div className="p-1.5 bg-emerald-500/10 rounded-md mr-3">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {propertyStats?.active || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <div className="p-1.5 bg-gray-500/10 rounded-md mr-3">
                    <XCircle className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Inactive</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {propertyStats?.inactive || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <div className="p-1.5 bg-amber-500/10 rounded-md mr-3">
                    <Star className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Featured</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {propertyStats?.featured || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <div className="p-1.5 bg-indigo-500/10 rounded-md mr-3">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Total</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {propertyStats?.total || 0}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Users Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Guests */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 hover:border-gray-200 transition-colors">
          <h3 className="text-base font-semibold text-gray-900 mb-5 flex items-center">
            <div className="p-2 bg-indigo-500/10 rounded-lg mr-3">
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            Guests Overview
          </h3>
          {guestLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-11 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-sm font-medium text-gray-700">Total Guests</span>
                <span className="text-sm font-bold text-gray-900">
                  {guestStats?.total || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-sm font-medium text-gray-700">Active</span>
                <span className="text-sm font-bold text-emerald-600">
                  {guestStats?.active || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-sm font-medium text-gray-700">Inactive</span>
                <span className="text-sm font-bold text-gray-500">
                  {guestStats?.inactive || 0}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Hosts */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 hover:border-gray-200 transition-colors">
          <h3 className="text-base font-semibold text-gray-900 mb-5 flex items-center">
            <div className="p-2 bg-teal-500/10 rounded-lg mr-3">
              <Users className="w-4 h-4 text-teal-600" />
            </div>
            Hosts Overview
          </h3>
          {hostLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-11 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-sm font-medium text-gray-700">Total Hosts</span>
                <span className="text-sm font-bold text-gray-900">
                  {hostStats?.total || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-sm font-medium text-gray-700">Active</span>
                <span className="text-sm font-bold text-emerald-600">
                  {hostStats?.active || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-sm font-medium text-gray-700">Pending Verification</span>
                <span className="text-sm font-bold text-amber-600">
                  {hostStats?.pending_verification || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-sm font-medium text-gray-700">Suspended</span>
                <span className="text-sm font-bold text-red-600">
                  {hostStats?.suspended || 0}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

