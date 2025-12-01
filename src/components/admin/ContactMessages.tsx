import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  X,
  Mail,
  Phone,
  Calendar,
  Eye,
  CheckCircle,
  MessageSquare,
  Archive,
  AlertCircle,
  User
} from 'lucide-react';
import { useAllContactMessages, useUpdateContactMessageStatus } from '../../hooks/useContactMessages';
import { useToast } from '../../contexts/ToastContext';
import type { ContactMessage, ContactMessageStatus } from '../../types/database';
import { Select } from '../ui';
import type { SelectOption } from '../ui';

export default function ContactMessages() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactMessageStatus | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { messages, loading, error, refetch } = useAllContactMessages();
  const { updateStatus, loading: updatingStatus } = useUpdateContactMessageStatus();
  const { success, error: showError } = useToast();

  // Filter messages
  const filteredMessages = useMemo(() => {
    let filtered = messages;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((message) => {
        const fullName = message.full_name.toLowerCase();
        const email = message.email.toLowerCase();
        const subject = message.subject.toLowerCase();
        const messageText = message.message.toLowerCase();
        return (
          fullName.includes(query) ||
          email.includes(query) ||
          subject.includes(query) ||
          messageText.includes(query)
        );
      });
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((message) => message.status === statusFilter);
    }

    return filtered;
  }, [messages, searchQuery, statusFilter]);

  const handleViewDetails = (message: ContactMessage) => {
    setSelectedMessage(message);
    setShowDetailsModal(true);
    // Mark as read if it's new
    if (message.status === 'new') {
      handleUpdateStatus(message.id, 'read');
    }
  };

  const handleUpdateStatus = async (id: string, status: ContactMessageStatus) => {
    try {
      const updated = await updateStatus(id, status);
      success(`Message marked as ${status}`);
      await refetch();
      // Update selected message if it's the one being updated
      if (selectedMessage?.id === id && updated) {
        setSelectedMessage(updated);
      }
    } catch {
      showError('Failed to update message status');
    }
  };

  const clearFilters = () => {
    setStatusFilter('');
    setSearchQuery('');
  };

  const hasActiveFilters = useMemo(() => {
    return statusFilter !== '' || searchQuery.trim().length > 0;
  }, [statusFilter, searchQuery]);

  const statusOptions: ContactMessageStatus[] = ['new', 'read', 'replied', 'archived'];

  const statusSelectOptions: SelectOption[] = [
    { value: '', label: 'All Statuses' },
    ...statusOptions.map(status => ({
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1)
    }))
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: ContactMessageStatus) => {
    const baseClasses = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm';
    switch (status) {
      case 'new':
        return `${baseClasses} bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200/60`;
      case 'read':
        return `${baseClasses} bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border border-gray-200/60`;
      case 'replied':
        return `${baseClasses} bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200/60`;
      case 'archived':
        return `${baseClasses} bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border border-amber-200/60`;
      default:
        return `${baseClasses} bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border border-gray-200/60`;
    }
  };

  // Statistics
  const stats = useMemo(() => {
    return {
      total: messages.length,
      new: messages.filter(m => m.status === 'new').length,
      read: messages.filter(m => m.status === 'read').length,
      replied: messages.filter(m => m.status === 'replied').length,
      archived: messages.filter(m => m.status === 'archived').length
    };
  }, [messages]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Contact Messages</h2>
          <p className="text-gray-500 mt-2 text-sm md:text-base">View and manage contact form submissions</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">New</p>
              <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Read</p>
              <p className="text-2xl font-bold text-gray-600">{stats.read}</p>
            </div>
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
              <Eye className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Replied</p>
              <p className="text-2xl font-bold text-green-600">{stats.replied}</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Archived</p>
              <p className="text-2xl font-bold text-amber-600">{stats.archived}</p>
            </div>
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Archive className="w-5 h-5 text-amber-600" />
            </div>
          </div>
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
              placeholder="Search by name, email, subject, or message..."
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
                {statusFilter ? 1 : 0}
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
                value={statusFilter}
                onChange={(value) => setStatusFilter(value ? (value as ContactMessageStatus) : '')}
                options={statusSelectOptions}
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
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 font-medium">
          Showing <span className="text-gray-900 font-semibold">{filteredMessages.length}</span> of{' '}
          <span className="text-gray-900 font-semibold">{messages.length}</span> messages
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-16 text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-gray-200 border-t-gray-900"></div>
          <p className="mt-5 text-gray-600 font-medium">Loading messages...</p>
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
              <p className="font-semibold">Error loading messages</p>
              <p className="text-red-600 mt-1 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages List */}
      {!loading && !error && (
        <div className="space-y-3">
          {filteredMessages.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-16 text-center">
              <div className="flex flex-col items-center">
                <div className="p-4 bg-gray-100 rounded-2xl mb-4">
                  <Mail className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-semibold text-gray-900">No messages found</p>
                <p className="text-sm text-gray-500 mt-1.5">
                  {hasActiveFilters
                    ? 'Try adjusting your filters'
                    : 'There are no contact messages yet'}
                </p>
              </div>
            </div>
          ) : (
            filteredMessages.map((message) => (
              <div
                key={message.id}
                className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5 hover:shadow-md hover:border-gray-300 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-base font-semibold text-gray-900">{message.full_name}</h3>
                          <span className={getStatusBadge(message.status)}>
                            {message.status}
                          </span>
                        </div>
                        <div className="space-y-1.5 mb-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="truncate">{message.email}</span>
                          </div>
                          {message.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span>{message.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{formatDate(message.created_at)}</span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm font-semibold text-gray-900 mb-1">{message.subject}</p>
                          <p className="text-sm text-gray-600 line-clamp-2">{message.message}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleViewDetails(message)}
                      className="px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 flex items-center gap-2 text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Message Details Modal */}
      {showDetailsModal && selectedMessage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 px-8 py-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Message Details</h3>
                  <p className="text-sm text-white/70 mt-0.5">Contact form submission</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedMessage(null);
                }}
                className="p-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 text-white hover:rotate-90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {/* Sender Information */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-6 border border-gray-200/60">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Sender Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Name</p>
                    <p className="text-base font-semibold text-gray-900">{selectedMessage.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</p>
                    <p className="text-base font-semibold text-gray-900">{selectedMessage.email}</p>
                  </div>
                  {selectedMessage.phone && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phone</p>
                      <p className="text-base font-semibold text-gray-900">{selectedMessage.phone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</p>
                    <span className={getStatusBadge(selectedMessage.status)}>
                      {selectedMessage.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl p-6 border border-blue-200/60">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Message
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Subject</p>
                    <p className="text-base font-semibold text-gray-900">{selectedMessage.subject}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Message</p>
                    <p className="text-sm text-gray-900 bg-white/60 rounded-lg p-4 border border-gray-200 leading-relaxed whitespace-pre-wrap">
                      {selectedMessage.message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50/50 rounded-2xl p-6 border border-purple-200/60">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Timestamps
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Submitted</p>
                    <p className="text-base font-semibold text-gray-900">{formatDate(selectedMessage.created_at)}</p>
                  </div>
                  {selectedMessage.updated_at !== selectedMessage.created_at && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Last Updated</p>
                      <p className="text-base font-semibold text-gray-900">{formatDate(selectedMessage.updated_at)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t-2 border-gray-200">
                {selectedMessage.status === 'new' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedMessage.id, 'read')}
                    disabled={updatingStatus}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                  >
                    <Eye className="w-5 h-5" />
                    Mark as Read
                  </button>
                )}
                {selectedMessage.status !== 'replied' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedMessage.id, 'replied')}
                    disabled={updatingStatus}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Mark as Replied
                  </button>
                )}
                {selectedMessage.status !== 'archived' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedMessage.id, 'archived')}
                    disabled={updatingStatus}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-xl hover:from-amber-700 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                  >
                    <Archive className="w-5 h-5" />
                    Archive
                  </button>
                )}
                {selectedMessage.status === 'archived' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedMessage.id, 'read')}
                    disabled={updatingStatus}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-gray-600 to-slate-600 text-white rounded-xl hover:from-gray-700 hover:to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                  >
                    <X className="w-5 h-5" />
                    Unarchive
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

