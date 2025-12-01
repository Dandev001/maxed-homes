# Payment Flow MVP - Minimal Implementation Plan

## Overview

**Core Flow**: Guest pays → marks as paid → admin confirms → guest gets check-in details

This is the minimal MVP slice to ship first. Everything else (expiration, settings, analytics) comes later.

---

## Step 1: Database Changes

### 1.1 Add New Booking Statuses

**File**: `database/migrations/add_payment_statuses.sql`

```sql
-- Add new booking statuses for payment flow
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'awaiting_payment';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'awaiting_confirmation';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'payment_failed';
```

### 1.2 Add Payment Columns to Bookings Table

**File**: `database/migrations/add_payment_fields_to_bookings.sql`

```sql
-- Add payment-related columns to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50), -- 'mtn_momo', 'moov_momo', 'bank_transfer'
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255), -- Transaction ID
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT, -- URL to uploaded receipt in Supabase Storage
ADD COLUMN IF NOT EXISTS payment_confirmed_by VARCHAR(50), -- 'admin' | 'host'
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMP WITH TIME ZONE, -- Deadline for payment
ADD COLUMN IF NOT EXISTS platform_commission DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS host_payout_amount DECIMAL(10,2);

-- Index for payment queries
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status 
ON bookings(status) 
WHERE status IN ('awaiting_payment', 'awaiting_confirmation', 'payment_failed');
```

**Note**: Skip `payment_config` table. Use environment variables for payment details.

---

## Step 2: Update TypeScript Types

### 2.1 Update Booking Status Type

**File**: `src/types/database.ts`

```typescript
export type BookingStatus = 
  | 'pending' 
  | 'awaiting_payment'      // NEW
  | 'awaiting_confirmation' // NEW
  | 'payment_failed'        // NEW
  | 'confirmed' 
  | 'cancelled' 
  | 'completed' 
  | 'expired'
```

### 2.2 Update Booking Interface

**File**: `src/types/database.ts`

Add to `Booking` interface:
```typescript
export interface Booking {
  // ... existing fields
  payment_method?: string | null
  payment_reference?: string | null
  payment_proof_url?: string | null
  payment_confirmed_by?: string | null
  payment_confirmed_at?: string | null
  payment_expires_at?: string | null
  platform_commission?: number
  host_payout_amount?: number | null
}
```

---

## Step 3: Backend - Update Booking Queries

### 3.1 Update `confirm()` Function

**File**: `src/lib/queries/bookings.ts`

Change the `confirm()` function to transition to `awaiting_payment` instead of `confirmed`:

```typescript
// Confirm booking (host/admin approves)
async confirm(id: string): Promise<Booking | null> {
  // Calculate commission (10% default)
  const booking = await this.getById(id)
  if (!booking) return null

  const commissionRate = 0.10
  const platformCommission = booking.total_amount * commissionRate
  const hostPayout = booking.total_amount - platformCommission

  // Set payment expiration (2 hours from now)
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 2)

  const updates: any = {
    status: 'awaiting_payment',
    platform_commission: platformCommission,
    host_payout_amount: hostPayout,
    payment_expires_at: expiresAt.toISOString()
  }

  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logError('Error confirming booking', error, 'bookingQueries')
    return null
  }

  // Clear caches
  cache.delete(cacheKeys.booking(id))
  cache.clearPattern(`bookings:guest:${data.guest_id}`)
  cache.clearPattern(`bookings:property:${data.property_id}`)
  cache.clearPattern('bookings:search:')

  return data
}
```

### 3.2 Add `markAsPaid()` Function

**File**: `src/lib/queries/bookings.ts`

```typescript
// Guest marks payment as completed
async markAsPaid(
  id: string,
  paymentMethod: string,
  paymentReference: string,
  paymentProofUrl?: string
): Promise<Booking | null> {
  const updates: any = {
    status: 'awaiting_confirmation',
    payment_method: paymentMethod,
    payment_reference: paymentReference
  }

  if (paymentProofUrl) {
    updates.payment_proof_url = paymentProofUrl
  }

  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logError('Error marking payment as paid', error, 'bookingQueries')
    return null
  }

  // Clear caches
  cache.delete(cacheKeys.booking(id))
  cache.clearPattern(`bookings:guest:${data.guest_id}`)
  cache.clearPattern('bookings:search:')

  return data
}
```

### 3.3 Add `confirmPayment()` Function

**File**: `src/lib/queries/bookings.ts`

```typescript
// Admin confirms payment received
async confirmPayment(id: string, notes?: string): Promise<Booking | null> {
  const updates: any = {
    status: 'confirmed',
    payment_confirmed_by: 'admin', // TODO: Get actual admin ID from auth
    payment_confirmed_at: new Date().toISOString()
  }

  if (notes) {
    updates.payment_notes = notes
  }

  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logError('Error confirming payment', error, 'bookingQueries')
    return null
  }

  // Clear caches
  cache.delete(cacheKeys.booking(id))
  cache.clearPattern(`bookings:guest:${data.guest_id}`)
  cache.clearPattern(`bookings:property:${data.property_id}`)
  cache.clearPattern('bookings:search:')

  return data
}
```

### 3.4 Add `rejectPayment()` Function

**File**: `src/lib/queries/bookings.ts`

```typescript
// Admin rejects payment
async rejectPayment(id: string, reason: string): Promise<Booking | null> {
  const updates: any = {
    status: 'payment_failed',
    payment_notes: reason
  }

  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logError('Error rejecting payment', error, 'bookingQueries')
    return null
  }

  // Clear caches
  cache.delete(cacheKeys.booking(id))
  cache.clearPattern(`bookings:guest:${data.guest_id}`)
  cache.clearPattern('bookings:search:')

  return data
}
```

### 3.5 Add Payment Proof Upload Helper

**File**: `src/lib/queries/payments.ts` (new file)

```typescript
import { supabase } from '../supabase'
import { logError } from '../../utils/logger'

export const paymentQueries = {
  // Upload payment proof to Supabase Storage
  async uploadPaymentProof(file: File, bookingId: string): Promise<string | null> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${bookingId}-${Date.now()}.${fileExt}`
    const filePath = `payment-proofs/${fileName}`

    const { data, error } = await supabase.storage
      .from('payment-proofs') // Create this bucket in Supabase
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      logError('Error uploading payment proof', error, 'paymentQueries')
      return null
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(filePath)

    return publicUrl
  }
}
```

---

## Step 4: Update Hooks

### 4.1 Add New Hooks

**File**: `src/hooks/useBookings.ts`

```typescript
// Hook for marking payment as paid
export const useMarkAsPaid = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const markAsPaid = useCallback(async (
    id: string,
    paymentMethod: string,
    paymentReference: string,
    paymentProofUrl?: string
  ) => {
    setLoading(true)
    setError(null)

    try {
      const booking = await bookingQueries.markAsPaid(id, paymentMethod, paymentReference, paymentProofUrl)
      return booking
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark payment as paid'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { markAsPaid, loading, error }
}

// Hook for confirming payment (admin)
export const useConfirmPayment = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirmPayment = useCallback(async (id: string, notes?: string) => {
    setLoading(true)
    setError(null)

    try {
      const booking = await bookingQueries.confirmPayment(id, notes)
      return booking
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to confirm payment'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { confirmPayment, loading, error }
}

// Hook for rejecting payment (admin)
export const useRejectPayment = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rejectPayment = useCallback(async (id: string, reason: string) => {
    setLoading(true)
    setError(null)

    try {
      const booking = await bookingQueries.rejectPayment(id, reason)
      return booking
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject payment'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { rejectPayment, loading, error }
}
```

### 4.2 Add Payment Upload Hook

**File**: `src/hooks/usePayments.ts` (new file)

```typescript
import { useState, useCallback } from 'react'
import { paymentQueries } from '../lib/queries/payments'

export const useUploadPaymentProof = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadProof = useCallback(async (file: File, bookingId: string) => {
    setLoading(true)
    setError(null)

    try {
      const url = await paymentQueries.uploadPaymentProof(file, bookingId)
      return url
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload payment proof'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return { uploadProof, loading, error }
}
```

---

## Step 5: Guest UI - Booking Confirmation Page

### 5.1 Update Booking Confirmation Page

**File**: `src/pages/BookingConfirmation.tsx`

Add payment instructions section and payment form:

```typescript
// Add these imports
import { useMarkAsPaid } from '../hooks/useBookings'
import { useUploadPaymentProof } from '../hooks/usePayments'
import { Upload, CheckCircle, Clock, AlertCircle } from 'lucide-react'

// Add state for payment form
const [showPaymentForm, setShowPaymentForm] = useState(false)
const [paymentMethod, setPaymentMethod] = useState('')
const [paymentReference, setPaymentReference] = useState('')
const [paymentProof, setPaymentProof] = useState<File | null>(null)
const { markAsPaid, loading: markingPaid } = useMarkAsPaid()
const { uploadProof, loading: uploading } = useUploadPaymentProof()

// Add payment instructions component
const PaymentInstructions = () => {
  // Get payment details from env or constants
  const paymentMethods = {
    mtn_momo: { name: 'MTN MoMo', number: import.meta.env.VITE_MTN_MOMO_NUMBER || '+225 XX XX XX XX XX' },
    moov_momo: { name: 'Moov MoMo', number: import.meta.env.VITE_MOOV_MOMO_NUMBER || '+225 XX XX XX XX XX' },
    bank_transfer: { name: 'Bank Transfer', number: import.meta.env.VITE_BANK_ACCOUNT || 'XXXX-XXXX-XXXX' }
  }

  const deadline = booking?.payment_expires_at 
    ? new Date(booking.payment_expires_at)
    : null

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-6">
      <div className="flex items-start gap-4">
        <Clock className="w-6 h-6 text-yellow-600 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Required</h3>
          <p className="text-sm text-gray-700 mb-4">
            Please complete your payment to confirm your booking. Amount: {formatCurrency(booking?.total_amount || 0)}
          </p>
          
          {deadline && (
            <p className="text-sm font-medium text-yellow-800 mb-4">
              Deadline: {deadline.toLocaleString()}
            </p>
          )}

          <div className="space-y-2 mb-4">
            <p className="text-sm font-medium text-gray-900">Payment Methods:</p>
            {Object.entries(paymentMethods).map(([key, method]) => (
              <div key={key} className="flex items-center justify-between bg-white p-3 rounded-lg">
                <span className="text-sm text-gray-700">{method.name}</span>
                <span className="text-sm font-mono text-gray-900">{method.number}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowPaymentForm(true)}
            className="w-full bg-[#1a1a1a] text-white py-3 rounded-lg font-medium hover:bg-[#1a1a1a]/90 transition-colors"
          >
            I've Paid
          </button>
        </div>
      </div>
    </div>
  )
}

// Add payment form modal
const PaymentFormModal = () => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!booking || !paymentMethod || !paymentReference) return

    try {
      let proofUrl: string | undefined
      
      if (paymentProof) {
        proofUrl = await uploadProof(paymentProof, booking.id)
        if (!proofUrl) {
          alert('Failed to upload proof. Please try again.')
          return
        }
      }

      await markAsPaid(booking.id, paymentMethod, paymentReference, proofUrl)
      setShowPaymentForm(false)
      // Refetch booking to update status
      window.location.reload()
    } catch (error) {
      alert('Failed to submit payment. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Confirm Payment</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent"
              required
            >
              <option value="">Select method</option>
              <option value="mtn_momo">MTN MoMo</option>
              <option value="moov_momo">Moov MoMo</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Reference *
            </label>
            <input
              type="text"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="Enter transaction ID"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Receipt (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowPaymentForm(false)}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={markingPaid || uploading}
              className="flex-1 px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#1a1a1a]/90 disabled:opacity-50"
            >
              {markingPaid || uploading ? 'Submitting...' : 'Submit Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Update status config to handle new statuses
const getStatusConfig = () => {
  switch (booking?.status) {
    case 'awaiting_payment':
      return {
        icon: Clock,
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
        title: 'Payment Required',
        message: 'Please complete your payment to confirm your booking.',
        showPaymentInstructions: true
      }
    case 'awaiting_confirmation':
      return {
        icon: Clock,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        title: 'Payment Submitted',
        message: 'Your payment has been submitted and is awaiting verification. We\'ll notify you once confirmed.',
        showPaymentInstructions: false
      }
    case 'payment_failed':
      return {
        icon: AlertCircle,
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        title: 'Payment Rejected',
        message: 'Your payment was not verified. Please contact support or try again.',
        showPaymentInstructions: false
      }
    // ... existing cases
  }
}

// In the render, conditionally show payment instructions
{booking?.status === 'awaiting_payment' && <PaymentInstructions />}
{showPaymentForm && <PaymentFormModal />}
```

---

## Step 6: Admin UI - Payment Verification

### 6.1 Update Bookings Management

**File**: `src/components/admin/BookingsManagement.tsx`

Add filter/tab for `awaiting_confirmation`:

```typescript
// Add to status filter options
const statusOptions: BookingStatus[] = [
  'pending', 
  'awaiting_payment', 
  'awaiting_confirmation',  // NEW
  'payment_failed',         // NEW
  'confirmed', 
  'cancelled', 
  'completed', 
  'expired'
]

// Add payment verification section in the booking details modal
{selectedBooking.status === 'awaiting_confirmation' && (
  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
      Payment Verification Required
    </h4>
    
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Payment Method</p>
        <p className="text-base font-semibold text-gray-900">
          {selectedBooking.payment_method || 'N/A'}
        </p>
      </div>
      
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Transaction Reference</p>
        <p className="text-base font-mono text-gray-900">
          {selectedBooking.payment_reference || 'N/A'}
        </p>
      </div>
      
      {selectedBooking.payment_proof_url && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Payment Proof</p>
          <img
            src={selectedBooking.payment_proof_url}
            alt="Payment proof"
            className="w-full max-w-md rounded-lg border border-gray-200"
          />
        </div>
      )}
      
      <div className="flex gap-3 pt-4">
        <button
          onClick={handleConfirmPayment}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          Confirm Payment
        </button>
        <button
          onClick={handleRejectPayment}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          Reject Payment
        </button>
      </div>
    </div>
  </div>
)}
```

### 6.2 Add Payment Action Handlers

**File**: `src/components/admin/BookingsManagement.tsx`

```typescript
// Add hooks
const { confirmPayment, loading: confirmingPayment } = useConfirmPayment()
const { rejectPayment, loading: rejectingPayment } = useRejectPayment()

// Add handlers
const handleConfirmPayment = async () => {
  if (!selectedBooking) return
  if (!confirm('Are you sure you want to confirm this payment?')) return

  setActionLoading(selectedBooking.id)
  try {
    await confirmPayment(selectedBooking.id)
    success('Payment confirmed successfully')
    search(filters, currentPage)
    setShowDetailsModal(false)
  } catch (err) {
    showError('Failed to confirm payment')
  } finally {
    setActionLoading(null)
  }
}

const handleRejectPayment = async () => {
  if (!selectedBooking) return
  const reason = prompt('Please provide a reason for rejecting this payment:')
  if (!reason || !confirm('Are you sure you want to reject this payment?')) return

  setActionLoading(selectedBooking.id)
  try {
    await rejectPayment(selectedBooking.id, reason)
    success('Payment rejected')
    search(filters, currentPage)
    setShowDetailsModal(false)
  } catch (err) {
    showError('Failed to reject payment')
  } finally {
    setActionLoading(null)
  }
}
```

---

## Step 7: Environment Variables

**File**: `.env`

```env
# Payment Details (update with your actual numbers)
VITE_MTN_MOMO_NUMBER=+225 XX XX XX XX XX
VITE_MOOV_MOMO_NUMBER=+225 XX XX XX XX XX
VITE_BANK_ACCOUNT=XXXX-XXXX-XXXX-XXXX

# Payment Settings
VITE_PAYMENT_DEADLINE_HOURS=2
VITE_PLATFORM_COMMISSION_RATE=0.10
```

---

## Step 8: Supabase Storage Setup

1. Go to Supabase Dashboard → Storage
2. Create bucket: `payment-proofs`
3. Set bucket to **Public** (or configure RLS policies)
4. Allow file uploads (images only recommended)

---

## Implementation Checklist

### Database
- [ ] Run migration: `add_payment_statuses.sql`
- [ ] Run migration: `add_payment_fields_to_bookings.sql`
- [ ] Create Supabase Storage bucket: `payment-proofs`

### Backend
- [ ] Update `BookingStatus` type
- [ ] Update `Booking` interface
- [ ] Update `confirm()` function
- [ ] Add `markAsPaid()` function
- [ ] Add `confirmPayment()` function
- [ ] Add `rejectPayment()` function
- [ ] Create `paymentQueries.ts` with upload function

### Hooks
- [ ] Add `useMarkAsPaid()` hook
- [ ] Add `useConfirmPayment()` hook
- [ ] Add `useRejectPayment()` hook
- [ ] Add `useUploadPaymentProof()` hook

### Guest UI
- [ ] Update `BookingConfirmation.tsx` with payment instructions
- [ ] Add payment form modal
- [ ] Handle `awaiting_payment` status
- [ ] Handle `awaiting_confirmation` status
- [ ] Handle `payment_failed` status

### Admin UI
- [ ] Add `awaiting_confirmation` filter
- [ ] Add payment verification section in booking modal
- [ ] Add "Confirm Payment" button
- [ ] Add "Reject Payment" button
- [ ] Display payment proof image

### Configuration
- [ ] Add environment variables
- [ ] Update `.env.example`

---

## What's NOT in MVP (Add Later)

- ❌ Payment expiration cron job
- ❌ Payment settings page
- ❌ Payment statistics/analytics
- ❌ Payment config table
- ❌ Host payout tracking
- ❌ Email/SMS notifications
- ❌ Payment retry flow

---

## Testing Flow

1. **Create Booking**: Guest creates booking → Status: `pending`
2. **Admin Approves**: Admin approves → Status: `awaiting_payment`
3. **Guest Pays**: Guest marks as paid → Status: `awaiting_confirmation`
4. **Admin Confirms**: Admin confirms payment → Status: `confirmed`
5. **Guest Sees Details**: Guest sees check-in details on confirmation page

---

**That's it! Ship this MVP first, then add the rest later.**

