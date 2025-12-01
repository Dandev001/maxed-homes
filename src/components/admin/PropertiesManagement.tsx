import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  StarOff, 
  Eye,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Home,
  MapPin,
  DollarSign,
  Calendar
} from 'lucide-react';
import { useAllProperties } from '../../hooks/useProperties';
import { useDeleteProperty, useUpdateProperty } from '../../hooks/useProperties';
import { useToast } from '../../contexts/ToastContext';
import type { PropertyWithImages, PropertyFilters, PropertyStatus } from '../../types/database';
import PropertyForm from './PropertyForm';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { Select } from '../ui';
import type { SelectOption } from '../ui';

export default function PropertiesManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'created_at' | 'price_per_night' | 'title'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyWithImages | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const statusUpdateRef = useRef<string | null>(null);

  const { results, loading, error, refetch } = useAllProperties({
    query: searchQuery,
    filters,
    sort_by: sortBy,
    sort_order: sortOrder,
    page: currentPage,
    limit: 24
  });

  // Refetch when filters change after a status update
  useEffect(() => {
    if (statusUpdateRef.current && filters.status) {
      // Small delay to ensure filter state has fully propagated
      const timer = setTimeout(() => {
        refetch();
        statusUpdateRef.current = null;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [filters.status, refetch]);

  const { deleteProperty, loading: deleting } = useDeleteProperty();
  const { updateProperty, loading: updating } = useUpdateProperty();
  const { success, error: showError } = useToast();

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteProperty(id);
      if (result) {
        success('Property deleted successfully');
        setDeleteConfirm(null);
        refetch();
      } else {
        showError('Failed to delete property. Please check your admin permissions and try again.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete property';
      showError(`Failed to delete property: ${errorMessage}`);
    }
  };

  const handleToggleFeatured = async (property: PropertyWithImages) => {
    try {
      await updateProperty(property.id, { is_featured: !property.is_featured });
      success(`Property ${property.is_featured ? 'removed from' : 'added to'} featured`);
      refetch();
    } catch (err) {
      showError('Failed to update property');
    }
  };

  const handleStatusChange = async (property: PropertyWithImages, status: PropertyStatus) => {
    try {
      await updateProperty(property.id, { status });
      success(`Property status updated to ${status}`);
      
      // Refetch to get updated data
      statusUpdateRef.current = property.id;
      refetch();
    } catch (err) {
      showError('Failed to update property status');
      statusUpdateRef.current = null;
    }
  };

  const handleEdit = (property: PropertyWithImages) => {
    setEditingProperty(property);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProperty(null);
    refetch();
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setCurrentPage(1);
  };

  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).length > 0 || searchQuery.trim().length > 0;
  }, [filters, searchQuery]);

  const propertyTypes = ['house', 'apartment', 'condo', 'townhouse', 'villa', 'studio'];
  const statusOptions: PropertyStatus[] = ['active', 'inactive', 'maintenance', 'sold'];

  // Select options
  const statusSelectOptions: SelectOption[] = [
    { value: '', label: 'All Statuses' },
    ...statusOptions.map(status => ({
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1)
    }))
  ];

  const featuredSelectOptions: SelectOption[] = [
    { value: '', label: 'All' },
    { value: 'true', label: 'Featured' },
    { value: 'false', label: 'Not Featured' }
  ];

  const propertyTypeSelectOptions: SelectOption[] = [
    { value: '', label: 'All Types' },
    ...propertyTypes.map(type => ({
      value: type,
      label: type.charAt(0).toUpperCase() + type.slice(1)
    }))
  ];

  const sortBySelectOptions: SelectOption[] = [
    { value: 'created_at', label: 'Date Created' },
    { value: 'price_per_night', label: 'Price' },
    { value: 'title', label: 'Title' }
  ];

  const statusChangeSelectOptions: SelectOption[] = statusOptions.map(status => ({
    value: status,
    label: status.charAt(0).toUpperCase() + status.slice(1)
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h2 className="text-4xl font-bold text-[#1a1a1a] tracking-tight mb-2">Properties</h2>
          <p className="text-sm text-gray-500 font-light">
            Manage and organize all properties on the platform
          </p>
        </div>
        <button
          onClick={() => {
            setEditingProperty(null);
            setShowForm(true);
          }}
          className="inline-flex items-center px-6 py-3 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#1a1a1a]/90 transition-all duration-200 font-medium text-sm tracking-wide"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Property
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-11 pr-4 py-3 border-0 border-b-2 border-gray-100 focus:border-[#1a1a1a] transition-all duration-200 bg-transparent placeholder:text-gray-400 text-sm focus:outline-none"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-5 py-3 rounded-lg transition-all duration-200 font-medium text-sm ${
              showFilters || hasActiveFilters
                ? 'bg-[#1a1a1a] text-white'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 px-2 py-0.5 bg-white/20 text-white rounded text-xs font-medium">
                {Object.keys(filters).length + (searchQuery ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
            {/* Status Filter */}
            <Select
              label="Status"
              value={filters.status || ''}
              onChange={(value) => {
                setFilters({ ...filters, status: value ? (value as PropertyStatus) : undefined });
                setCurrentPage(1);
              }}
              options={statusSelectOptions}
              placeholder="All Statuses"
            />

            {/* Featured Filter */}
            <Select
              label="Featured"
              value={filters.is_featured === undefined ? '' : filters.is_featured ? 'true' : 'false'}
              onChange={(value) => {
                setFilters({
                  ...filters,
                  is_featured: value === '' ? undefined : value === 'true'
                });
                setCurrentPage(1);
              }}
              options={featuredSelectOptions}
              placeholder="All"
            />

            {/* Property Type Filter */}
            <Select
              label="Type"
              value={filters.property_type || ''}
              onChange={(value) => {
                setFilters({ ...filters, property_type: value || undefined });
                setCurrentPage(1);
              }}
              options={propertyTypeSelectOptions}
              placeholder="All Types"
            />

            {/* City Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                City
              </label>
              <input
                type="text"
                placeholder="Filter by city"
                value={filters.city || ''}
                onChange={(e) => {
                  setFilters({ ...filters, city: e.target.value || undefined });
                  setCurrentPage(1);
                }}
                className="w-full px-0 py-2 border-0 border-b-2 border-gray-100 focus:border-[#1a1a1a] transition-all duration-200 bg-transparent focus:outline-none text-sm"
              />
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex items-end md:col-span-2 lg:col-span-4">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-[#1a1a1a] transition-colors duration-200"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sort */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5" />
            Sort
          </label>
          <Select
            value={sortBy}
            onChange={(value) => setSortBy(value as 'created_at' | 'price_per_night' | 'title')}
            options={sortBySelectOptions}
            size="md"
            className="min-w-[160px]"
          />
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 hover:bg-gray-50 rounded-lg transition-all duration-200 text-gray-500 hover:text-[#1a1a1a]"
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Results */}
      {loading && !results ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-[#1a1a1a]"></div>
          <p className="mt-4 text-sm text-gray-400 font-light">Loading properties...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50/50 border border-red-100 rounded-lg p-6">
          <p className="text-sm text-red-600 font-medium">Error: {error}</p>
        </div>
      ) : results && results.data.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-100">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-4">
            <Home className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium text-sm mb-2">No properties found</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-sm text-[#1a1a1a] hover:underline font-medium"
            >
              Clear filters to see all properties
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {results?.data.map((property) => {
              const primaryImage = property.images?.find(img => img.is_primary) || property.images?.[0];
              return (
                <div
                  key={property.id}
                  className="bg-white rounded-2xl border border-[#1a1a1a]/30 hover:border-[#1a1a1a]/50 transition-all duration-200 group relative overflow-hidden"
                >
                  {/* Image */}
                  <div className="relative h-48 bg-[#1a1a1a]/10 overflow-hidden">
                    {primaryImage ? (
                      <img
                        src={primaryImage.image_url}
                        alt={primaryImage.alt_text || property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Home className="w-10 h-10" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex gap-2">
                      {property.is_featured && (
                        <span className="px-2.5 py-1 bg-yellow-500 text-white text-xs font-medium rounded-2xl bg-opacity-80">
                          ⭐ Featured
                        </span>
                      )}
                      <span className={`px-2.5 py-1 text-white text-xs font-medium rounded-2xl bg-opacity-70 ${
                        property.status === 'active' ? 'bg-green-600' :
                        property.status === 'inactive' ? 'bg-gray-500' :
                        property.status === 'maintenance' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}>
                        {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h4 className="font-semibold text-[#1a1a1a] mb-2 line-clamp-1 text-base">
                      {property.title}
                    </h4>
                    <div className="flex items-center text-xs text-gray-400 mb-3">
                      <MapPin className="w-3.5 h-3.5 mr-1" />
                      <span>{property.city}, {property.state}</span>
                    </div>
                    <div className="flex items-baseline mb-4">
                      <p className="text-xl font-bold text-[#1a1a1a]">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'XOF',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(property.price_per_night)}
                      </p>
                      <span className="text-xs text-gray-400 ml-1">/night</span>
                    </div>

                    {/* Quick Info */}
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 text-xs text-gray-500">
                      <span className="font-medium">{property.property_type}</span>
                      {property.bedrooms && (
                        <span>• {property.bedrooms} beds</span>
                      )}
                      {property.bathrooms && (
                        <span>• {property.bathrooms} baths</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <Link
                        to={`${ROUTES.PROPERTIES}/${property.id}`}
                        target="_blank"
                        className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all duration-200"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        View
                      </Link>
                      <button
                        onClick={() => handleEdit(property)}
                        className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-all duration-200"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1.5" />
                        Edit
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleToggleFeatured(property)}
                        disabled={updating}
                        className={`px-3 py-2 text-xs font-medium border rounded-lg transition-all duration-200 disabled:opacity-50 ${
                          property.is_featured
                            ? 'border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        title={property.is_featured ? 'Remove from featured' : 'Add to featured'}
                      >
                        {property.is_featured ? (
                          <Star className="w-3.5 h-3.5 mx-auto text-yellow-500 fill-yellow-500" />
                        ) : (
                          <StarOff className="w-3.5 h-3.5 mx-auto" />
                        )}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(property.id)}
                        disabled={deleting}
                        className="px-3 py-2 text-xs font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200 disabled:opacity-50"
                        title="Delete property"
                      >
                        <Trash2 className="w-3.5 h-3.5 mx-auto" />
                      </button>
                      <Select
                        value={property.status}
                        onChange={(value) => handleStatusChange(property, value as PropertyStatus)}
                        disabled={updating}
                        options={statusChangeSelectOptions}
                        size="sm"
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {results && results.total_pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-lg border border-gray-100 px-6 py-4">
              <div className="text-xs text-gray-500 font-light">
                Showing <span className="font-medium text-[#1a1a1a]">{(currentPage - 1) * (results.limit || 24) + 1}</span> to{' '}
                <span className="font-medium text-[#1a1a1a]">{Math.min(currentPage * (results.limit || 24), results.total)}</span> of{' '}
                <span className="font-medium text-[#1a1a1a]">{results.total}</span> properties
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={!results.has_prev || loading}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-medium text-[#1a1a1a] min-w-[80px] text-center">
                  Page {currentPage} of {results.total_pages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(results.total_pages, p + 1))}
                  disabled={!results.has_next || loading}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-[#1a1a1a]">Delete Property</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Are you sure you want to delete this property? This action cannot be undone and all associated data will be permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-5 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="px-5 py-2.5 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#1a1a1a]/90 transition-all duration-200 disabled:opacity-50 font-medium text-sm"
              >
                {deleting ? 'Deleting...' : 'Delete Property'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Property Form Modal */}
      {showForm && (
        <PropertyForm
          property={editingProperty}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}

