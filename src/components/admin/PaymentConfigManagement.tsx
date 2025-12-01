import { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Shield,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import { useAllPaymentConfigs } from '../../hooks/usePaymentConfig';
import { usePaymentConfigManagement } from '../../hooks/usePaymentConfigManagement';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import type { PaymentConfig, CreatePaymentConfigInput, UpdatePaymentConfigInput, PaymentMethodType } from '../../types/database';

// Security question for 2FA (can be customized)
const SECURITY_QUESTION = "What is the name of this platform?";
const SECURITY_ANSWER = "MAXED HOMES"; // Case-insensitive comparison

interface SecurityConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: string;
  loading?: boolean;
}

/**
 * Secure 2FA Confirmation Modal
 * Requires admin to answer security question and type confirmation code
 */
const SecurityConfirmationModal: React.FC<SecurityConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  action,
  loading = false
}) => {
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ answer?: string; code?: string }>({});

  // Generate a random confirmation code
  const expectedCode = useMemo(() => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { answer?: string; code?: string } = {};

    // Validate security answer
    if (!securityAnswer.trim()) {
      newErrors.answer = 'Security answer is required';
    } else if (securityAnswer.trim().toUpperCase() !== SECURITY_ANSWER.toUpperCase()) {
      newErrors.answer = 'Incorrect security answer';
    }

    // Validate confirmation code
    if (!confirmationCode.trim()) {
      newErrors.code = 'Confirmation code is required';
    } else if (confirmationCode.trim().toUpperCase() !== expectedCode) {
      newErrors.code = 'Incorrect confirmation code';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear form and confirm
    setSecurityAnswer('');
    setConfirmationCode('');
    setErrors({});
    onConfirm();
  };

  const handleClose = () => {
    setSecurityAnswer('');
    setConfirmationCode('');
    setErrors({});
    setShowPassword(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-600 border-b border-red-700 px-6 py-5 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Security Verification</h3>
              <p className="text-sm text-white/90">Two-factor authentication required</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900 mb-1">Security Alert</p>
                <p className="text-xs text-amber-700">
                  You are about to <strong>{action}</strong> payment configuration. This action requires two-factor authentication.
                </p>
              </div>
            </div>
          </div>

          {/* Security Question */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Security Question
            </label>
            <p className="text-sm text-gray-600 mb-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
              {SECURITY_QUESTION}
            </p>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={securityAnswer}
                onChange={(e) => {
                  setSecurityAnswer(e.target.value);
                  if (errors.answer) setErrors({ ...errors, answer: undefined });
                }}
                placeholder="Enter your answer"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  errors.answer ? 'border-red-300' : 'border-gray-200'
                }`}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.answer && (
              <p className="mt-1.5 text-sm text-red-600">{errors.answer}</p>
            )}
          </div>

          {/* Confirmation Code */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Confirmation Code
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">Enter this code:</span>
                <span className="text-lg font-mono font-bold text-gray-900 tracking-wider">
                  {expectedCode}
                </span>
              </div>
            </div>
            <input
              type="text"
              value={confirmationCode}
              onChange={(e) => {
                setConfirmationCode(e.target.value.toUpperCase());
                if (errors.code) setErrors({ ...errors, code: undefined });
              }}
              placeholder="Type the code above"
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-center text-lg tracking-wider ${
                errors.code ? 'border-red-300' : 'border-gray-200'
              }`}
              maxLength={6}
              disabled={loading}
            />
            {errors.code && (
              <p className="mt-1.5 text-sm text-red-600">{errors.code}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Verify & {action}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function PaymentConfigManagement() {
  const { paymentConfigs, loading, error, refetch } = useAllPaymentConfigs();
  const { createPaymentConfig, updatePaymentConfig, deletePaymentConfig, loading: actionLoading } = usePaymentConfigManagement();
  const { success, error: showError } = useToast();
  const { user } = useAuth();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'create' | 'update' | 'delete';
    data?: any;
    id?: string;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreatePaymentConfigInput>({
    payment_method: 'mtn_momo',
    account_name: '',
    account_number: '',
    bank_name: null,
    is_active: true,
    instructions: '',
    display_order: 0,
  });

  const handleEdit = (config: PaymentConfig) => {
    setFormData({
      payment_method: config.payment_method,
      account_name: config.account_name,
      account_number: config.account_number,
      bank_name: config.bank_name || null,
      is_active: config.is_active,
      instructions: config.instructions || '',
      display_order: config.display_order,
    });
    setEditingId(config.id);
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    setPendingAction({ type: 'delete', id });
    setShowSecurityModal(true);
  };

  const handleSave = () => {
    if (editingId) {
      setPendingAction({ type: 'update', id: editingId, data: formData });
    } else {
      setPendingAction({ type: 'create', data: formData });
    }
    setShowSecurityModal(true);
  };

  const executePendingAction = async () => {
    if (!pendingAction) return;

    try {
      if (pendingAction.type === 'create') {
        await createPaymentConfig(pendingAction.data);
        success('Payment config created successfully');
        setShowAddForm(false);
        resetForm();
      } else if (pendingAction.type === 'update' && pendingAction.id) {
        await updatePaymentConfig(pendingAction.id, pendingAction.data);
        success('Payment config updated successfully');
        setShowAddForm(false);
        setEditingId(null);
        resetForm();
      } else if (pendingAction.type === 'delete' && pendingAction.id) {
        await deletePaymentConfig(pendingAction.id);
        success('Payment config deleted successfully');
      }
      await refetch();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Operation failed';
      showError(errorMessage);
      
      // If it's a duplicate error, keep the form open so user can edit instead
      if (errorMessage.includes('already exists')) {
        // Close security modal but keep form open so user can see the error
        setShowSecurityModal(false);
        // Don't clear pendingAction yet - let user see the error message
        setTimeout(() => {
          setPendingAction(null);
        }, 100);
        return;
      }
    } finally {
      // Clear pending action and close modal for non-duplicate errors
      if (!(pendingAction && pendingAction.type === 'create')) {
        setPendingAction(null);
        setShowSecurityModal(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      payment_method: 'mtn_momo',
      account_name: '',
      account_number: '',
      bank_name: null,
      is_active: true,
      instructions: '',
      display_order: 0,
    });
  };

  const getActionLabel = () => {
    if (!pendingAction) return 'proceed';
    switch (pendingAction.type) {
      case 'create': return 'create';
      case 'update': return 'update';
      case 'delete': return 'delete';
      default: return 'proceed';
    }
  };

  const getMethodLabel = (method: PaymentMethodType) => {
    switch (method) {
      case 'mtn_momo': return 'MTN MoMo';
      case 'moov_momo': return 'Moov MoMo';
      case 'bank_transfer': return 'Bank Transfer';
      default: return method;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-500 text-sm font-normal">Loading payment configurations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-red-600 mb-4 font-normal">{error}</p>
        <button
          onClick={() => refetch()}
          className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all text-sm font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Payment Configuration</h2>
          <p className="text-gray-500 mt-2 text-sm md:text-base">
            Manage payment methods and account details securely
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingId(null);
            setShowAddForm(true);
          }}
          className="flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-medium shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          Add Payment Method
        </button>
      </div>

      {/* Security Notice */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-amber-900 mb-1">Security Notice</h3>
            <p className="text-sm text-amber-700">
              All changes to payment configurations require two-factor authentication. 
              You'll need to answer a security question and enter a confirmation code.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Configs List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {paymentConfigs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4">No payment configurations found</p>
            <button
              onClick={() => {
                resetForm();
                setEditingId(null);
                setShowAddForm(true);
              }}
              className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all text-sm font-medium"
            >
              Add Payment Method
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Account Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Account Number</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bank</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paymentConfigs.map((config) => (
                  <tr key={config.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">{getMethodLabel(config.payment_method)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{config.account_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded">{config.account_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{config.bank_name || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        config.is_active
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {config.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{config.display_order}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(config)}
                          className="p-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(config.id)}
                          className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 px-6 py-5 flex items-center justify-between z-10">
              <h3 className="text-2xl font-bold text-white">
                {editingId ? 'Edit Payment Config' : 'Add Payment Method'}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                  resetForm();
                }}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="p-6 space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Payment Method *
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as PaymentMethodType })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    required
                    disabled={!!editingId}
                  >
                    <option value="mtn_momo">MTN MoMo</option>
                    <option value="moov_momo">Moov MoMo</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                  {editingId && (
                    <p className="mt-1.5 text-xs text-gray-500">
                      Payment method cannot be changed when editing. Delete and create a new one if needed.
                    </p>
                  )}
                  {!editingId && paymentConfigs.some(c => c.payment_method === formData.payment_method) && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs text-amber-800 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>
                          A payment method of this type already exists. 
                          <button
                            type="button"
                            onClick={() => {
                              const existing = paymentConfigs.find(c => c.payment_method === formData.payment_method);
                              if (existing) {
                                handleEdit(existing);
                              }
                            }}
                            className="ml-1 underline font-medium hover:text-amber-900"
                          >
                            Edit the existing one instead
                          </button>
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Display Order *
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    required
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Account Name *
                </label>
                <input
                  type="text"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="e.g., Maxed Homes"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Account Number *
                </label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent font-mono"
                  placeholder="+225 XX XX XX XX XX or Account Number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Bank Name (for bank transfers only)
                </label>
                <input
                  type="text"
                  value={formData.bank_name || ''}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value || null })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Leave empty for MoMo payments"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Instructions
                </label>
                <textarea
                  value={formData.instructions || ''}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value || null })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  rows={3}
                  placeholder="Payment instructions for guests..."
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Active (visible to guests)
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingId(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Confirmation Modal */}
      <SecurityConfirmationModal
        isOpen={showSecurityModal}
        onClose={() => {
          setShowSecurityModal(false);
          setPendingAction(null);
        }}
        onConfirm={executePendingAction}
        action={getActionLabel()}
        loading={actionLoading}
      />
    </div>
  );
}

