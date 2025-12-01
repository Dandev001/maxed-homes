import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  CheckCircle, 
  Calendar, 
  Users, 
  MapPin, 
  Download, 
  Printer, 
  ArrowLeft, 
  Home,
  Mail,
  Phone,
  FileText,
  AlertCircle,
  Clock,
  XCircle,
  Upload,
  X,
  Clipboard
} from 'lucide-react';
import { useBooking, useMarkAsPaid } from '../hooks/useBookings';
import { useUploadPaymentProof } from '../hooks/usePayments';
import { usePaymentConfig } from '../hooks/usePaymentConfig';
import { useToast } from '../contexts/ToastContext';
import { ROUTES } from '../constants';
import PropertyLoader from '../components/ui/PropertyLoader';

const BookingConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const { id: bookingId } = useParams<{ id: string }>();
  const { booking, loading, error, refetch } = useBooking(bookingId || '');
  const receiptRef = useRef<HTMLDivElement>(null);
  const paymentReferenceInputRef = useRef<HTMLInputElement>(null);
  const { success, error: showError } = useToast();
  
  // Fetch payment config from backend (secure - prevents tampering)
  const { paymentConfigs, loading: paymentConfigLoading } = usePaymentConfig();
  
  // Payment form state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const { markAsPaid, loading: markingPaid } = useMarkAsPaid();
  const { uploadProof, loading: uploading } = useUploadPaymentProof();

  // Lock body scroll when payment modal is open
  useEffect(() => {
    if (showPaymentForm) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Lock body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // Restore scroll position when modal closes
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showPaymentForm]);

  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    if (isNaN(date.getTime())) {
      return new Date(dateString).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      });
    }
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Print receipt
  const handlePrint = () => {
    if (!receiptRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = receiptRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Booking Receipt - ${booking?.property?.title || 'Maxed Homes'}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              color: #1a1a1a;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e5e7eb;
            }
            .header h1 {
              font-size: 28px;
              font-weight: 600;
              margin: 0 0 10px 0;
            }
            .status {
              display: inline-block;
              padding: 6px 16px;
              background: #10b981;
              color: white;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 500;
              margin-top: 10px;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 15px;
              color: #1a1a1a;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            .info-item {
              margin-bottom: 12px;
            }
            .info-label {
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            .info-value {
              font-size: 16px;
              color: #1a1a1a;
              font-weight: 500;
            }
            .price-breakdown {
              background: #f9fafb;
              padding: 20px;
              border-radius: 8px;
              margin-top: 20px;
            }
            .price-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .price-row:last-child {
              border-bottom: none;
            }
            .price-total {
              font-size: 20px;
              font-weight: 700;
              margin-top: 10px;
              padding-top: 10px;
              border-top: 2px solid #1a1a1a;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }
            @media print {
              body {
                padding: 20px;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Download receipt as PDF (using browser print to PDF)
  const handleDownload = () => {
    handlePrint();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <PropertyLoader />
          <p className="text-gray-400 mt-6 text-sm font-light">Loading booking confirmation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl sm:text-2xl font-light text-gray-900 mb-3">Booking not found</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-8 font-light leading-relaxed">
            {error || 'The booking you are looking for does not exist or has been removed.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(ROUTES.PROPERTIES)}
              className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all text-sm font-medium shadow-sm hover:shadow-md"
            >
              Browse Properties
            </button>
            <button
              onClick={() => navigate(ROUTES.HOME)}
              className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium shadow-sm hover:shadow-md"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const property = booking.property;
  const guest = booking.guest;

  // Get status-specific UI elements
  const getStatusConfig = () => {
    switch (booking.status) {
      case 'confirmed':
        return {
          icon: CheckCircle,
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          title: 'Booking Confirmed!',
          message: `Your reservation has been confirmed. A confirmation email has been sent to ${guest.email}`,
          badgeBg: 'bg-green-50',
          badgeText: 'text-green-700',
          badgeIcon: CheckCircle,
          badgeIconColor: 'text-green-600'
        };
      case 'pending':
        return {
          icon: Clock,
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          title: 'Booking Request Submitted!',
          message: `Your booking request has been submitted and is awaiting host approval. We'll notify you at ${guest.email} once the host responds.`,
          badgeBg: 'bg-yellow-50',
          badgeText: 'text-yellow-700',
          badgeIcon: Clock,
          badgeIconColor: 'text-yellow-600'
        };
      case 'cancelled':
        return {
          icon: XCircle,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          title: 'Booking Cancelled',
          message: `This booking has been cancelled. If you have any questions, please contact support.`,
          badgeBg: 'bg-red-50',
          badgeText: 'text-red-700',
          badgeIcon: XCircle,
          badgeIconColor: 'text-red-600'
        };
      case 'completed':
        return {
          icon: CheckCircle,
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          title: 'Stay Completed!',
          message: `Thank you for staying with us! We hope you enjoyed your time at ${property.title}.`,
          badgeBg: 'bg-blue-50',
          badgeText: 'text-blue-700',
          badgeIcon: CheckCircle,
          badgeIconColor: 'text-blue-600'
        };
      case 'expired':
        return {
          icon: AlertCircle,
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          title: 'Booking Expired',
          message: `This booking request has expired. Please submit a new booking request if you'd like to stay at this property.`,
          badgeBg: 'bg-gray-50',
          badgeText: 'text-gray-700',
          badgeIcon: AlertCircle,
          badgeIconColor: 'text-gray-600'
        };
      case 'awaiting_payment':
        return {
          icon: Clock,
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          title: 'Payment Required',
          message: 'Please complete your payment to confirm your booking.',
          badgeBg: 'bg-yellow-50',
          badgeText: 'text-yellow-700',
          badgeIcon: Clock,
          badgeIconColor: 'text-yellow-600',
          showPaymentInstructions: true
        };
      case 'awaiting_confirmation':
        return {
          icon: Clock,
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          title: 'Payment Submitted',
          message: 'Your payment has been submitted and is awaiting verification. We\'ll notify you once confirmed.',
          badgeBg: 'bg-blue-50',
          badgeText: 'text-blue-700',
          badgeIcon: Clock,
          badgeIconColor: 'text-blue-600'
        };
      case 'payment_failed':
        return {
          icon: AlertCircle,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          title: 'Payment Rejected',
          message: 'Your payment was not verified. Please contact support or try again.',
          badgeBg: 'bg-red-50',
          badgeText: 'text-red-700',
          badgeIcon: AlertCircle,
          badgeIconColor: 'text-red-600'
        };
      default:
        return {
          icon: CheckCircle,
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          title: 'Booking Details',
          message: `Booking information for ${guest.email}`,
          badgeBg: 'bg-gray-50',
          badgeText: 'text-gray-700',
          badgeIcon: CheckCircle,
          badgeIconColor: 'text-gray-600'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;
  const BadgeIcon = statusConfig.badgeIcon;

  // Convert payment configs to display format
  // Payment details are fetched from backend to prevent frontend tampering
  const paymentMethods = paymentConfigs.reduce((acc, config) => {
    const methodName = config.payment_method === 'mtn_momo' 
      ? 'MTN MoMo' 
      : config.payment_method === 'moov_momo'
      ? 'Moov MoMo'
      : 'Bank Transfer';
    
    acc[config.payment_method] = {
      name: methodName,
      number: config.account_number,
      bankName: config.bank_name,
      instructions: config.instructions,
    };
    return acc;
  }, {} as Record<string, { name: string; number: string; bankName?: string | null; instructions?: string | null }>);

  // Handle paste transaction reference
  const handlePasteReference = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Paste button clicked');
    
    try {
      // Use Clipboard API - requires HTTPS or localhost
      if (navigator.clipboard && navigator.clipboard.readText) {
        console.log('Clipboard API available, reading...');
        const text = await navigator.clipboard.readText();
        console.log('Clipboard text:', text);
        if (text && text.trim()) {
          setPaymentReference(text.trim());
          success('Transaction reference pasted!');
          return;
        } else {
          showError('Clipboard is empty. Please copy a transaction reference first.');
          return;
        }
      } else {
        console.log('Clipboard API not available');
      }
    } catch (error: any) {
      console.error('Clipboard API error:', error);
      console.error('Error name:', error?.name);
      console.error('Error message:', error?.message);
      
      // If Clipboard API fails, focus the input field for manual paste
      if (paymentReferenceInputRef.current) {
        paymentReferenceInputRef.current.focus();
        // Select any existing text so user can replace it
        paymentReferenceInputRef.current.setSelectionRange(0, paymentReferenceInputRef.current.value.length);
      }
      
      // Show appropriate error message
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        showError('Clipboard access denied. Input focused - please paste with Ctrl+V (or Cmd+V on Mac).');
      } else if (error.name === 'NotFoundError') {
        showError('Clipboard is empty. Please copy a transaction reference first.');
      } else {
        showError(`Unable to access clipboard: ${error.message || 'Unknown error'}. Input focused - please paste with Ctrl+V (or Cmd+V on Mac).`);
      }
      return;
    }
    
    // Fallback if Clipboard API is not available
    if (paymentReferenceInputRef.current) {
      paymentReferenceInputRef.current.focus();
      paymentReferenceInputRef.current.setSelectionRange(0, paymentReferenceInputRef.current.value.length);
      showError('Clipboard API not available. Input focused - please paste with Ctrl+V (or Cmd+V on Mac).');
    }
  };

  // Handle payment form submission
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !paymentMethod || !paymentReference) return;

    try {
      let proofUrl: string | undefined;
      
      if (paymentProof) {
        proofUrl = await uploadProof(paymentProof, booking.id);
        if (!proofUrl) {
          showError('Failed to upload proof. Please try again.');
          return;
        }
      }

      await markAsPaid(booking.id, paymentMethod, paymentReference, proofUrl);
      success('Payment submitted successfully! Awaiting verification.');
      setShowPaymentForm(false);
      setPaymentMethod('');
      setPaymentReference('');
      setPaymentProof(null);
      // Refetch booking to update status
      refetch();
    } catch (error) {
      showError('Failed to submit payment. Please try again.');
    }
  };

  // Payment Instructions Component
  const PaymentInstructions = () => {
    const deadline = booking?.payment_expires_at 
      ? new Date(booking.payment_expires_at)
      : null;

    return (
      <div className="bg-gradient-to-br from-amber-50/50 to-yellow-50/50 border border-amber-100/50 rounded-3xl p-6 sm:p-8 mb-8 shadow-sm">
        <div className="flex items-start gap-4 sm:gap-5">
          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-amber-100/50 rounded-2xl flex items-center justify-center">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-light text-gray-900 mb-2 sm:mb-3">Payment Required</h3>
            <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-5 font-light leading-relaxed">
              Please complete your payment to confirm your booking.
            </p>
            
            <div className="mb-4 sm:mb-5">
              <div className="inline-flex items-center px-4 py-2 bg-white/80 rounded-xl border border-amber-200/50">
                <span className="text-sm text-gray-600 mr-2">Amount:</span>
                <span className="text-lg font-medium text-gray-900">{formatCurrency(booking?.total_amount || 0)}</span>
              </div>
            </div>
            
            {deadline && (
              <div className="mb-4 sm:mb-5 p-3 sm:p-4 bg-white/60 rounded-xl border border-amber-200/30">
                <p className="text-xs sm:text-sm font-medium text-amber-900 flex items-center">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  <span>Deadline: {deadline.toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </p>
              </div>
            )}

            <div className="space-y-2.5 sm:space-y-3 mb-5 sm:mb-6">
              <p className="text-xs sm:text-sm font-medium text-gray-700 uppercase tracking-wide">Payment Methods</p>
              {paymentConfigLoading ? (
                <div className="text-sm text-gray-500 text-center py-4">Loading payment details...</div>
              ) : Object.keys(paymentMethods).length === 0 ? (
                <div className="text-sm text-amber-700 text-center py-4 bg-amber-50 rounded-xl border border-amber-200">
                  Payment details are being updated. Please contact support.
                </div>
              ) : (
                Object.entries(paymentMethods).map(([key, method]) => (
                  <div key={key} className="bg-white/80 p-3 sm:p-4 rounded-xl border border-amber-200/30">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2">
                      <span className="text-sm sm:text-base text-gray-700 font-medium">{method.name}</span>
                      <span className="text-sm font-mono text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg">{method.number}</span>
                    </div>
                    {method.bankName && (
                      <p className="text-xs text-gray-600 mt-1">Bank: {method.bankName}</p>
                    )}
                    {method.instructions && (
                      <p className="text-xs text-gray-600 mt-1.5">{method.instructions}</p>
                    )}
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowPaymentForm(true)}
              className="w-full bg-gray-900 text-white py-3 sm:py-3.5 rounded-xl font-medium hover:bg-gray-800 transition-all text-sm sm:text-base shadow-sm hover:shadow-md"
            >
              I've Paid
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Payment Form Modal
  const PaymentFormModal = () => {
    if (!showPaymentForm) return null;

    const modalContent = (
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
        onClick={(e) => {
          // Close modal when clicking backdrop
          if (e.target === e.currentTarget) {
            setShowPaymentForm(false);
            setPaymentMethod('');
            setPaymentReference('');
            setPaymentProof(null);
          }
        }}
      >
        <div 
          className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative shadow-2xl border border-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setShowPaymentForm(false);
              setPaymentMethod('');
              setPaymentReference('');
              setPaymentProof(null);
            }}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 hover:bg-gray-100 rounded-xl transition-colors z-10"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
          
          <h3 className="text-xl sm:text-2xl font-light text-gray-900 mb-6 sm:mb-8 pr-8">Confirm Payment</h3>
          
          <form onSubmit={handlePaymentSubmit} className="space-y-5 sm:space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide mb-2.5">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all bg-white text-sm sm:text-base"
                required
              >
                <option value="">Select method</option>
                <option value="mtn_momo">MTN MoMo</option>
                <option value="moov_momo">Moov MoMo</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide mb-2.5">
                Transaction Reference *
              </label>
              <div className="relative">
                <input
                  ref={paymentReferenceInputRef}
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Enter transaction ID"
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all text-sm sm:text-base placeholder:text-gray-400"
                  required
                />
                <button
                  type="button"
                  onClick={handlePasteReference}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all z-10 cursor-pointer"
                  title="Paste transaction reference"
                  aria-label="Paste transaction reference"
                >
                  <Clipboard className="w-4 h-4 pointer-events-none" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide mb-2.5">
                Upload Receipt <span className="text-gray-400 normal-case">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm sm:text-base file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                />
                {paymentProof && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center">
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    {paymentProof.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPaymentForm(false);
                  setPaymentMethod('');
                  setPaymentReference('');
                  setPaymentProof(null);
                }}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm sm:text-base font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={markingPaid || uploading}
                className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base font-medium shadow-sm hover:shadow-md"
              >
                {markingPaid || uploading ? 'Submitting...' : 'Submit Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );

    // Use portal to render modal at body level for proper z-index stacking
    return typeof document !== 'undefined' 
      ? createPortal(modalContent, document.body)
      : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Minimal Header */}
      <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-100/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <button
              onClick={() => navigate(ROUTES.HOME)}
              className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Home</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownload}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100/50 rounded-lg transition-all"
                aria-label="Download"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={handlePrint}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100/50 rounded-lg transition-all"
                aria-label="Print"
              >
                <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-16">
        {/* Status Header - Minimalistic */}
        <div className="text-center mb-8 sm:mb-12">
          <div className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 ${statusConfig.iconBg} rounded-2xl mb-4 sm:mb-6 shadow-sm`}>
            <StatusIcon className={`w-7 h-7 sm:w-8 sm:h-8 ${statusConfig.iconColor}`} />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light text-gray-900 mb-2 sm:mb-3 tracking-tight">
            {statusConfig.title}
          </h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {statusConfig.message}
          </p>
        </div>

        {/* Payment Instructions - Redesigned */}
        {booking?.status === 'awaiting_payment' && <PaymentInstructions />}

        {/* Main Card - Sleek & Modern */}
        <div ref={receiptRef} className="bg-white rounded-3xl shadow-sm border border-gray-100/80 overflow-hidden">
          {/* Card Header - Minimal */}
          <div className="px-6 sm:px-8 lg:px-10 pt-8 sm:pt-10 pb-6 sm:pb-8 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-light text-gray-900 tracking-tight mb-1">MAXED HOMES</h2>
                <p className="text-xs sm:text-sm text-gray-400 font-light">Booking Confirmation</p>
              </div>
              <div className={`inline-flex items-center space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 ${statusConfig.badgeBg} rounded-full w-fit`}>
                <BadgeIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${statusConfig.badgeIconColor}`} />
                <span className={`text-xs font-medium ${statusConfig.badgeText} uppercase tracking-wide`}>
                  {booking.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4 font-mono">
              ID: {booking.id}
            </p>
          </div>

          {/* Card Content */}
          <div className="px-6 sm:px-8 lg:px-10 py-6 sm:py-8 space-y-8 sm:space-y-10">
            {/* Property Information - Clean Grid */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4 sm:mb-6">Property</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg sm:text-xl font-light text-gray-900 mb-2">{property.title}</h4>
                  <div className="flex items-start text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-1.5 mt-0.5 flex-shrink-0" />
                    <span className="leading-relaxed">{property.address}, {property.city}, {property.state} {property.zip_code || ''}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Details - Modern Cards */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4 sm:mb-6">Booking Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-gray-50/50 rounded-2xl p-4 sm:p-5 border border-gray-100">
                  <div className="flex items-center text-gray-400 mb-3">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-xs font-medium uppercase tracking-wide">Check-in</span>
                  </div>
                  <div className="text-base sm:text-lg font-light text-gray-900 mb-1">
                    {formatDate(booking.check_in_date)}
                  </div>
                  {property.check_in_time && (
                    <div className="text-xs text-gray-500 font-light">
                      After {property.check_in_time}
                    </div>
                  )}
                </div>
                <div className="bg-gray-50/50 rounded-2xl p-4 sm:p-5 border border-gray-100">
                  <div className="flex items-center text-gray-400 mb-3">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-xs font-medium uppercase tracking-wide">Check-out</span>
                  </div>
                  <div className="text-base sm:text-lg font-light text-gray-900 mb-1">
                    {formatDate(booking.check_out_date)}
                  </div>
                  {property.check_out_time && (
                    <div className="text-xs text-gray-500 font-light">
                      Before {property.check_out_time}
                    </div>
                  )}
                </div>
                <div className="bg-gray-50/50 rounded-2xl p-4 sm:p-5 border border-gray-100">
                  <div className="flex items-center text-gray-400 mb-3">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="text-xs font-medium uppercase tracking-wide">Guests</span>
                  </div>
                  <div className="text-base sm:text-lg font-light text-gray-900 mb-1">
                    {booking.guests_count} {booking.guests_count === 1 ? 'guest' : 'guests'}
                  </div>
                  <div className="text-xs text-gray-500 font-light">
                    {booking.total_nights} {booking.total_nights === 1 ? 'night' : 'nights'}
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Information - Minimal */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4 sm:mb-6">Guest</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <div className="text-xs text-gray-400 mb-1.5">Name</div>
                  <div className="text-base sm:text-lg font-light text-gray-900">
                    {guest.first_name} {guest.last_name}
                  </div>
                </div>
                <div>
                  <div className="flex items-center text-xs text-gray-400 mb-1.5">
                    <Mail className="w-3.5 h-3.5 mr-1.5" />
                    <span>Email</span>
                  </div>
                  <div className="text-base sm:text-lg font-light text-gray-900 break-all">{guest.email}</div>
                </div>
                {guest.phone && (
                  <div>
                    <div className="flex items-center text-xs text-gray-400 mb-1.5">
                      <Phone className="w-3.5 h-3.5 mr-1.5" />
                      <span>Phone</span>
                    </div>
                    <div className="text-base sm:text-lg font-light text-gray-900">{guest.phone}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Special Requests - Subtle */}
            {booking.special_requests && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4 sm:mb-6">Special Requests</h3>
                <div className="bg-gray-50/50 rounded-2xl p-4 sm:p-5 border border-gray-100">
                  <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap leading-relaxed font-light">
                    {booking.special_requests}
                  </p>
                </div>
              </div>
            )}

            {/* Price Breakdown - Clean Design */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4 sm:mb-6">Price Breakdown</h3>
              <div className="bg-gray-50/50 rounded-2xl p-5 sm:p-6 border border-gray-100">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center text-sm sm:text-base">
                    <span className="text-gray-600 font-light">
                      {formatCurrency(property.price_per_night)} × {booking.total_nights} {booking.total_nights === 1 ? 'night' : 'nights'}
                    </span>
                    <span className="text-gray-900 font-medium">
                      {formatCurrency(booking.base_price)}
                    </span>
                  </div>
                  {booking.cleaning_fee > 0 && (
                    <div className="flex justify-between items-center text-sm sm:text-base">
                      <span className="text-gray-600 font-light">Cleaning fee</span>
                      <span className="text-gray-900 font-medium">
                        {formatCurrency(booking.cleaning_fee)}
                      </span>
                    </div>
                  )}
                  {booking.taxes > 0 && (
                    <div className="flex justify-between items-center text-sm sm:text-base">
                      <span className="text-gray-600 font-light">Taxes</span>
                      <span className="text-gray-900 font-medium">
                        {formatCurrency(booking.taxes)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <span className="text-base sm:text-lg font-medium text-gray-900">Total</span>
                    <span className="text-xl sm:text-2xl font-light text-gray-900">
                      {formatCurrency(booking.total_amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Deposit - Subtle Notice */}
            {booking.security_deposit > 0 && (
              <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-4 sm:p-5">
                <div className="flex items-start">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Security Deposit
                    </p>
                    <p className="text-sm text-blue-700/80 font-light leading-relaxed">
                      A security deposit of {formatCurrency(booking.security_deposit)} will be held 
                      and released after your stay, provided there are no damages.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer - Minimal */}
            <div className="pt-6 sm:pt-8 border-t border-gray-100 text-center">
              <p className="text-xs sm:text-sm text-gray-400 font-light mb-1">
                Thank you for choosing Maxed Homes
              </p>
              <p className="text-xs text-gray-400/60 font-light">
                Confirmed on {formatDate(booking.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons - Modern & Responsive */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md mx-auto">
          <button
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="px-6 py-3 sm:py-3.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all text-sm font-medium flex items-center justify-center space-x-2 shadow-sm hover:shadow-md"
          >
            <FileText className="w-4 h-4" />
            <span>My Bookings</span>
          </button>
          <button
            onClick={() => navigate(ROUTES.PROPERTIES)}
            className="px-6 py-3 sm:py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium flex items-center justify-center space-x-2 shadow-sm hover:shadow-md"
          >
            <Home className="w-4 h-4" />
            <span>Browse Properties</span>
          </button>
        </div>
      </div>

      {/* Payment Form Modal */}
      <PaymentFormModal />
    </div>
  );
};

export default BookingConfirmation;

