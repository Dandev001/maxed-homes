# Payment Flow Implementation Plan - Option B (Platform Escrow)

## Overview

This document outlines the step-by-step implementation plan for integrating a manual payment confirmation flow (Option B) into the Maxed Homes booking system. In this flow, guests pay the platform directly via Mobile Money (MoMo) or bank transfer, and the platform holds the funds before distributing to hosts.

**Key Decision**: Guest pays Maxed Homes → Platform confirms payment → Booking confirmed → Platform later pays host (minus commission)

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Database Schema Changes](#database-schema-changes)
3. [Status Flow Updates](#status-flow-updates)
4. [Implementation Steps](#implementation-steps)
5. [UI/UX Changes](#uiux-changes)
6. [Admin Dashboard Updates](#admin-dashboard-updates)
7. [Guest-Facing Features](#guest-facing-features)
8. [Edge Cases & Safeguards](#edge-cases--safeguards)
9. [Testing Checklist](#testing-checklist)
10. [Future Enhancements](#future-enhancements)

---

## Current State Analysis

### Existing Booking Flow
1. Guest selects dates → Creates booking request
2. Booking created with status: `pending`
3. Admin/Host can approve → Status changes to `confirmed`
4. Admin/Host can reject → Status changes to `cancelled`

### Current Booking Statuses
- `pending` - Booking request submitted, awaiting approval
- `confirmed` - Booking approved by host/admin
- `cancelled` - Booking cancelled
- `completed` - Stay completed
- `expired` - Booking request expired

### Current Database Schema (bookings table)
```sql
- id, property_id, guest_id
- check_in_date, check_out_date, guests_count
- base_price, cleaning_fee, security_deposit, taxes, total_amount
- status (booking_status enum)
- special_requests, cancellation_reason, cancelled_at
- created_at, updated_at
```

---

## Database Schema Changes

### Step 1: Update Booking Status Enum

**File**: `database/migrations/add_payment_statuses.sql`

```sql
-- Add new booking statuses for payment flow
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'awaiting_payment';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'awaiting_confirmation';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'payment_failed';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'payment_expired';
```

**New Status Flow**:
- `pending` → `awaiting_payment` → `awaiting_confirmation` → `confirmed`
- Or: `pending` → `awaiting_payment` → `payment_failed` / `payment_expired` → `cancelled`

### Step 2: Add Payment Fields to Bookings Table

**File**: `database/migrations/add_payment_fields_to_bookings.sql`

```sql
-- Add payment-related columns to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50), -- 'mtn_momo', 'moov_momo', 'bank_transfer', 'cash'
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255), -- Transaction ID / reference number
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT, -- URL to uploaded receipt/screenshot in Supabase Storage
ADD COLUMN IF NOT EXISTS payment_confirmed_by VARCHAR(50), -- 'admin' | 'host' | 'system'
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMP WITH TIME ZONE, -- Deadline for payment
ADD COLUMN IF NOT EXISTS platform_commission DECIMAL(10,2) DEFAULT 0, -- Platform's commission amount
ADD COLUMN IF NOT EXISTS host_payout_amount DECIMAL(10,2), -- Amount to be paid to host
ADD COLUMN IF NOT EXISTS host_paid_at TIMESTAMP WITH TIME ZONE, -- When host was paid
ADD COLUMN IF NOT EXISTS payment_notes TEXT; -- Internal notes about payment

-- Add indexes for payment queries
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status 
ON bookings(status) 
WHERE status IN ('awaiting_payment', 'awaiting_confirmation', 'payment_failed', 'payment_expired');

CREATE INDEX IF NOT EXISTS idx_bookings_payment_expires 
ON bookings(payment_expires_at) 
WHERE status = 'awaiting_payment';

-- Add constraint to ensure payment fields are set when status requires payment
ALTER TABLE bookings
ADD CONSTRAINT check_payment_fields 
CHECK (
  (status NOT IN ('awaiting_payment', 'awaiting_confirmation', 'payment_failed')) 
  OR 
  (payment_method IS NOT NULL)
);
```

### Step 3: Create Payment Configuration Table (Optional but Recommended)

**File**: `database/migrations/create_payment_config.sql`

```sql
-- Store platform payment details (MoMo numbers, bank accounts, etc.)
CREATE TABLE IF NOT EXISTS payment_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_method VARCHAR(50) NOT NULL UNIQUE, -- 'mtn_momo', 'moov_momo', 'bank_transfer'
  account_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(255) NOT NULL, -- MoMo number or bank account
  bank_name VARCHAR(255), -- NULL for MoMo, bank name for bank transfers
  is_active BOOLEAN DEFAULT true,
  instructions TEXT, -- Payment instructions for guests
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default payment methods (update with your actual details)
INSERT INTO payment_config (payment_method, account_name, account_number, instructions) VALUES
('mtn_momo', 'Maxed Homes', '+225 XX XX XX XX XX', 'Send money to this MTN MoMo number. Include booking reference in the transaction note.'),
('moov_momo', 'Maxed Homes', '+225 XX XX XX XX XX', 'Send money to this Moov MoMo number. Include booking reference in the transaction note.'),
('bank_transfer', 'Maxed Homes', 'XXXX-XXXX-XXXX-XXXX', 'Transfer to this bank account. Include booking reference in the transfer description.')
ON CONFLICT (payment_method) DO NOTHING;

-- RLS policies (only admins can view/edit)
ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view payment config"
ON payment_config FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user_id = auth.uid() 
    AND admins.status = 'active'
  )
);

CREATE POLICY "Admins can update payment config"
ON payment_config FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user_id = auth.uid() 
    AND admins.status = 'active'
  )
);
```

---

## Status Flow Updates

### New Booking Status Flow

```
1. Guest creates booking
   ↓
   Status: 'pending' (Host/Admin approval needed)

2. Host/Admin approves booking
   ↓
   Status: 'awaiting_payment'
   - payment_expires_at set (e.g., 2 hours from now)
   - Guest receives payment instructions

3. Guest pays offline & marks as paid
   ↓
   Status: 'awaiting_confirmation'
   - payment_method, payment_reference, payment_proof_url set
   - Admin notified

4. Admin verifies payment
   ↓
   Status: 'confirmed'
   - payment_confirmed_by = 'admin'
   - payment_confirmed_at = NOW()
   - Guest receives confirmation email with check-in details
   - Host notified

5. Alternative paths:
   - If payment not received within deadline → Status: 'payment_expired' → 'cancelled'
   - If admin rejects payment → Status: 'payment_failed' → Guest can retry
```

### Status Transition Rules

| From Status | To Status | Trigger | Who |
|------------|-----------|---------|-----|
| `pending` | `awaiting_payment` | Host/Admin approves | Admin/Host |
| `pending` | `cancelled` | Host/Admin rejects | Admin/Host |
| `awaiting_payment` | `awaiting_confirmation` | Guest marks as paid | Guest |
| `awaiting_payment` | `payment_expired` | Payment deadline passed | System (cron) |
| `awaiting_confirmation` | `confirmed` | Admin confirms payment | Admin |
| `awaiting_confirmation` | `payment_failed` | Admin rejects payment | Admin |
| `payment_failed` | `awaiting_payment` | Guest retries payment | Guest |
| `confirmed` | `cancelled` | Booking cancelled | Admin/Guest |
| `confirmed` | `completed` | Stay completed | System/Admin |

---

## Implementation Steps

### Phase 1: Database & Types (Day 1)

#### Step 1.1: Create Migration Files
- [ ] Create `database/migrations/add_payment_statuses.sql`
- [ ] Create `database/migrations/add_payment_fields_to_bookings.sql`
- [ ] Create `database/migrations/create_payment_config.sql`
- [ ] Run migrations in Supabase SQL Editor

#### Step 1.2: Update TypeScript Types
- [ ] Update `src/types/database.ts`:
  - Add new statuses to `BookingStatus` type
  - Add payment fields to `Booking` interface
  - Create `PaymentConfig` interface
  - Update `CreateBookingInput` if needed

#### Step 1.3: Update Supabase Types
- [ ] Regenerate Supabase types: `npx supabase gen types typescript --project-id <your-project-id> > src/lib/supabase.ts`
- [ ] Verify types match new schema

---

### Phase 2: Backend Queries & Hooks (Day 2)

#### Step 2.1: Update Booking Queries
**File**: `src/lib/queries/bookings.ts`

- [ ] Add `markAsPaid()` function:
  ```typescript
  async markAsPaid(
    id: string, 
    paymentMethod: string, 
    paymentReference: string, 
    paymentProofUrl?: string
  ): Promise<Booking | null>
  ```

- [ ] Add `confirmPayment()` function:
  ```typescript
  async confirmPayment(id: string, notes?: string): Promise<Booking | null>
  ```

- [ ] Add `rejectPayment()` function:
  ```typescript
  async rejectPayment(id: string, reason: string): Promise<Booking | null>
  ```

- [ ] Add `retryPayment()` function:
  ```typescript
  async retryPayment(id: string): Promise<Booking | null>
  ```

- [ ] Update `confirm()` function to transition to `awaiting_payment` instead of `confirmed`
- [ ] Add function to get payment config: `getPaymentConfig()`

#### Step 2.2: Create Payment Queries
**File**: `src/lib/queries/payments.ts` (new file)

- [ ] Create payment queries module
- [ ] Add `getPaymentConfig()` function
- [ ] Add `uploadPaymentProof()` function (Supabase Storage)
- [ ] Add `calculateCommission()` helper function

#### Step 2.3: Update Hooks
**File**: `src/hooks/useBookings.ts`

- [ ] Add `useMarkAsPaid()` hook
- [ ] Add `useConfirmPayment()` hook
- [ ] Add `useRejectPayment()` hook
- [ ] Add `useRetryPayment()` hook
- [ ] Update `useConfirmBooking()` to handle new flow

**File**: `src/hooks/usePayments.ts` (new file)

- [ ] Create `usePaymentConfig()` hook
- [ ] Create `useUploadPaymentProof()` hook

---

### Phase 3: Guest-Facing UI (Day 3-4)

#### Step 3.1: Update Booking Confirmation Page
**File**: `src/pages/BookingConfirmation.tsx`

- [ ] Add payment instructions section for `awaiting_payment` status
- [ ] Show payment methods (MoMo numbers, bank details)
- [ ] Display payment deadline countdown
- [ ] Add "I've Paid" button and form
- [ ] Add payment proof upload functionality
- [ ] Show payment status for `awaiting_confirmation`
- [ ] Update status messages for new statuses

#### Step 3.2: Create Payment Form Component
**File**: `src/components/booking/PaymentForm.tsx` (new file)

- [ ] Payment method selector (MTN MoMo, Moov MoMo, Bank Transfer)
- [ ] Transaction reference input
- [ ] Payment proof upload (image)
- [ ] Form validation
- [ ] Submit handler

#### Step 3.3: Create Payment Instructions Component
**File**: `src/components/booking/PaymentInstructions.tsx` (new file)

- [ ] Display platform payment details
- [ ] Show payment amount breakdown
- [ ] Display payment deadline
- [ ] Copy-to-clipboard for payment numbers
- [ ] Instructions for each payment method

#### Step 3.4: Update Booking Page
**File**: `src/pages/Booking.tsx`

- [ ] Remove payment card form (no longer needed for V1)
- [ ] Keep guest information form
- [ ] Update submit flow to create booking with `pending` status
- [ ] Navigate to confirmation page after booking creation

---

### Phase 4: Admin Dashboard Updates (Day 5-6)

#### Step 4.1: Update Bookings Management
**File**: `src/components/admin/BookingsManagement.tsx`

- [ ] Add filter for payment statuses
- [ ] Add "Payment Pending" section
- [ ] Show payment details in booking details modal
- [ ] Add "Confirm Payment" button for `awaiting_confirmation` bookings
- [ ] Add "Reject Payment" button with reason input
- [ ] Display payment proof image in modal
- [ ] Show payment expiration warnings

#### Step 4.2: Create Payment Verification Component
**File**: `src/components/admin/PaymentVerification.tsx` (new file)

- [ ] Display booking details
- [ ] Show payment information (method, reference, proof)
- [ ] Display expected vs received amount
- [ ] Payment proof image viewer
- [ ] Confirm/Reject actions
- [ ] Add internal notes field

#### Step 4.3: Update Booking Details Modal
**File**: `src/components/admin/BookingsManagement.tsx` (existing modal)

- [ ] Add "Payment Information" section
- [ ] Show payment method, reference, proof
- [ ] Display payment timeline (paid at, confirmed at)
- [ ] Show commission breakdown
- [ ] Add payment action buttons

#### Step 4.4: Create Payment Settings Page
**File**: `src/pages/admin/PaymentSettings.tsx` (new file)

- [ ] List payment methods (MoMo numbers, bank accounts)
- [ ] Edit payment details
- [ ] Update payment instructions
- [ ] Enable/disable payment methods
- [ ] Set commission percentage

---

### Phase 5: Status Updates & Notifications (Day 7)

#### Step 5.1: Update Status Badges
**File**: `src/components/admin/BookingsManagement.tsx`

- [ ] Add badge styles for new statuses:
  - `awaiting_payment` - Yellow/Amber
  - `awaiting_confirmation` - Blue
  - `payment_failed` - Red
  - `payment_expired` - Gray

#### Step 5.2: Add Email Notifications (Optional for V1)
- [ ] Email guest when booking moves to `awaiting_payment`
- [ ] Email admin when payment marked as paid (`awaiting_confirmation`)
- [ ] Email guest when payment confirmed (`confirmed`)
- [ ] Email guest when payment rejected (`payment_failed`)

#### Step 5.3: Add Toast Notifications
- [ ] Success toast when payment marked as paid
- [ ] Success toast when payment confirmed
- [ ] Error toast when payment rejected
- [ ] Warning toast when payment deadline approaching

---

### Phase 6: Payment Expiration & Automation (Day 8)

#### Step 6.1: Create Payment Expiration Function
**File**: `database/migrations/create_payment_expiration_function.sql`

```sql
-- Function to expire unpaid bookings
CREATE OR REPLACE FUNCTION expire_unpaid_bookings()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE bookings
  SET 
    status = 'payment_expired',
    updated_at = NOW()
  WHERE 
    status = 'awaiting_payment'
    AND payment_expires_at IS NOT NULL
    AND payment_expires_at < NOW();
END;
$$;
```

#### Step 6.2: Set Up Cron Job (Supabase Edge Function or External)
- [ ] Create Supabase Edge Function to run expiration check
- [ ] Schedule to run every 15-30 minutes
- [ ] Or use external cron service (e.g., cron-job.org) to call API endpoint

#### Step 6.3: Add Expiration Warnings
- [ ] Show countdown timer on booking confirmation page
- [ ] Send reminder email 30 minutes before expiration (optional)

---

### Phase 7: Commission & Payout Tracking (Day 9)

#### Step 7.1: Calculate Commission on Booking Creation
**File**: `src/lib/queries/bookings.ts`

- [ ] Add `calculateCommission()` helper:
  ```typescript
  function calculateCommission(totalAmount: number, commissionRate: number = 0.10): {
    commission: number;
    hostPayout: number;
  }
  ```

- [ ] Update `create()` to calculate commission
- [ ] Store `platform_commission` and `host_payout_amount` in booking

#### Step 7.2: Add Payout Tracking (Future)
- [ ] Create `host_payouts` table (for future implementation)
- [ ] Track when hosts are paid
- [ ] Add payout history in admin dashboard

---

## UI/UX Changes

### Guest Experience Flow

1. **Booking Creation** (`/booking/:id`)
   - Fill guest information
   - No payment form (removed)
   - Submit → Booking created with `pending` status

2. **Booking Confirmation** (`/booking-confirmation/:id`)
   - If `pending`: "Awaiting host approval"
   - If `awaiting_payment`: 
     - Show payment instructions
     - Display payment methods
     - Show amount and deadline
     - "I've Paid" button
   - If `awaiting_confirmation`:
     - "Payment submitted, awaiting verification"
     - Show payment details submitted
   - If `confirmed`:
     - Show check-in details
     - Property address, contact info
     - Access instructions

3. **Payment Form Modal** (when "I've Paid" clicked)
   - Payment method selector
   - Transaction reference input
   - Upload receipt/screenshot
   - Submit → Status changes to `awaiting_confirmation`

### Admin Experience Flow

1. **Bookings Dashboard** (`/admin/bookings`)
   - Filter by payment status
   - See bookings awaiting payment confirmation
   - Click booking → View details

2. **Payment Verification**
   - View payment proof image
   - Verify transaction reference
   - Check amount matches
   - Confirm or reject payment
   - Add internal notes

3. **Payment Settings** (`/admin/payment-settings`)
   - Manage payment methods
   - Update MoMo numbers
   - Edit payment instructions
   - Set commission rate

---

## Admin Dashboard Updates

### New Sections

1. **Payment Pending Queue**
   - List of bookings in `awaiting_confirmation`
   - Quick actions: Confirm, Reject, View Details
   - Sort by oldest first (FIFO)

2. **Payment Statistics**
   - Total pending payments
   - Total confirmed payments (today/week/month)
   - Average payment confirmation time
   - Payment failure rate

3. **Payment Details in Booking Modal**
   - Payment method used
   - Transaction reference
   - Payment proof image
   - Payment timeline
   - Commission breakdown

---

## Guest-Facing Features

### Payment Instructions Display

```
┌─────────────────────────────────────┐
│  Payment Required                   │
│  Amount: XOF 150,000                │
│  Deadline: 2 hours                  │
│                                     │
│  Payment Methods:                   │
│  • MTN MoMo: +225 XX XX XX XX XX    │
│  • Moov MoMo: +225 XX XX XX XX XX   │
│  • Bank Transfer: XXXX-XXXX-XXXX    │
│                                     │
│  [I've Paid] Button                 │
└─────────────────────────────────────┘
```

### Payment Form

```
┌─────────────────────────────────────┐
│  Confirm Payment                    │
│                                     │
│  Payment Method: [Dropdown]         │
│  • MTN MoMo                         │
│  • Moov MoMo                        │
│  • Bank Transfer                    │
│                                     │
│  Transaction Reference: [Input]     │
│                                     │
│  Upload Receipt: [File Upload]      │
│                                     │
│  [Cancel] [Submit Payment]          │
└─────────────────────────────────────┘
```

---

## Edge Cases & Safeguards

### 1. Guest Claims Payment But Didn't Pay
**Solution**: Admin must verify before confirming. Payment proof required.

### 2. Payment Expires
**Solution**: Automatic expiration after deadline. Booking cancelled, dates freed.

### 3. Admin Rejects Payment
**Solution**: Status changes to `payment_failed`. Guest can retry with new payment.

### 4. Duplicate Payment References
**Solution**: Check for duplicate `payment_reference` before confirming. Alert admin if duplicate found.

### 5. Amount Mismatch
**Solution**: Admin can see expected vs received amount. Add notes if partial payment.

### 6. Payment Proof Upload Fails
**Solution**: Allow booking to proceed without proof, but flag for admin review.

### 7. Multiple Payment Attempts
**Solution**: Track payment attempts. Limit retries (e.g., max 3 attempts).

### 8. Host Payment Tracking
**Solution**: Store `host_paid_at` when host is paid. Create separate payout system later.

---

## Testing Checklist

### Database
- [ ] Migration runs successfully
- [ ] New statuses added to enum
- [ ] Payment fields added to bookings table
- [ ] Indexes created
- [ ] Constraints work correctly
- [ ] Payment config table created

### Backend
- [ ] `markAsPaid()` function works
- [ ] `confirmPayment()` function works
- [ ] `rejectPayment()` function works
- [ ] Status transitions are correct
- [ ] Payment proof uploads to Supabase Storage
- [ ] Commission calculation is correct

### Guest Flow
- [ ] Booking creation works
- [ ] Payment instructions display correctly
- [ ] Payment form submits successfully
- [ ] Payment proof uploads
- [ ] Status updates reflect in UI
- [ ] Countdown timer works
- [ ] Expiration handling works

### Admin Flow
- [ ] Payment queue displays correctly
- [ ] Payment verification works
- [ ] Payment proof displays
- [ ] Confirm payment works
- [ ] Reject payment works
- [ ] Payment settings page works
- [ ] Filters work correctly

### Edge Cases
- [ ] Payment expiration works
- [ ] Duplicate reference detection
- [ ] Retry payment works
- [ ] Error handling for failed uploads
- [ ] Validation works correctly

---

## Future Enhancements

### Phase 2 Features (Post-V1)

1. **Automated Payment Verification**
   - Integrate with MoMo APIs to verify transactions
   - Auto-confirm payments when verified

2. **Host Payout System**
   - Automated payouts to hosts
   - Payout schedule (weekly/monthly)
   - Payout history and tracking

3. **Payment Gateway Integration**
   - Add card payments via gateway
   - Webhook handling for automatic confirmation

4. **SMS Notifications**
   - SMS when payment required
   - SMS when payment confirmed
   - SMS reminders before expiration

5. **Payment Analytics**
   - Payment success rate
   - Average payment time
   - Payment method preferences
   - Revenue tracking

6. **Refund System**
   - Handle cancellations with refunds
   - Refund tracking and processing

---

## Configuration

### Environment Variables

Add to `.env`:
```env
# Payment Settings
VITE_PAYMENT_DEADLINE_HOURS=2
VITE_PLATFORM_COMMISSION_RATE=0.10
VITE_MAX_PAYMENT_RETRIES=3

# Supabase Storage
VITE_SUPABASE_STORAGE_BUCKET=payment-proofs
```

### Payment Configuration

Update payment details in `payment_config` table:
- MTN MoMo number
- Moov MoMo number
- Bank account details
- Payment instructions

---

## Rollout Plan

### Week 1: Development
- Days 1-2: Database & Types
- Days 3-4: Backend & Hooks
- Days 5-6: UI Components
- Day 7: Testing & Bug Fixes

### Week 2: Testing & Refinement
- Internal testing
- User acceptance testing
- Bug fixes
- Documentation

### Week 3: Deployment
- Deploy to staging
- Final testing
- Deploy to production
- Monitor for issues

---

## Support & Maintenance

### Monitoring
- Track payment confirmation times
- Monitor payment failure rates
- Watch for expired payments
- Track commission calculations

### Common Issues
1. **Payment proof not uploading**: Check Supabase Storage bucket permissions
2. **Status not updating**: Check RLS policies
3. **Expiration not working**: Verify cron job is running
4. **Commission wrong**: Check calculation logic

---

## Notes

- This is a manual payment flow. No real-time payment verification.
- Admin must manually verify each payment.
- Suitable for low-volume MVP. Scale with automation later.
- Keep payment details secure. Use environment variables.
- Consider legal requirements for holding funds (escrow).

---

## Questions & Decisions Needed

1. **Payment Deadline**: How long should guests have to pay? (Suggested: 2 hours)
2. **Commission Rate**: What percentage does platform take? (Suggested: 10%)
3. **Payment Methods**: Which methods to support initially? (MTN MoMo, Moov MoMo, Bank Transfer)
4. **Expiration Handling**: Auto-cancel or allow extension? (Suggested: Auto-cancel)
5. **Retry Limit**: How many payment attempts allowed? (Suggested: 3)
6. **Host Payout**: When to pay hosts? (Suggested: After check-in or weekly)

---

**Last Updated**: [Current Date]
**Version**: 1.0
**Status**: Planning Phase

