# Booking Expiration and Status Transition Validation - Implementation Summary

## Overview

This document summarizes the implementation of two critical features for the booking flow:
1. **Automatic Booking Expiration** - Automatically expires bookings that haven't been paid within the deadline
2. **Status Transition Validation** - Enforces valid status transitions to prevent invalid booking state changes

## ✅ Implementation Status: COMPLETE

---

## 1. Status Transition Validation

### What Was Implemented

Added comprehensive validation to ensure bookings can only transition between valid statuses according to the defined flow.

### Files Modified

- `src/lib/queries/bookings.ts`
  - Added `VALID_STATUS_TRANSITIONS` constant defining allowed transitions
  - Added `isValidStatusTransition()` helper function
  - Updated `updateStatus()` to validate transitions before updating
  - Added validation to `confirm()`, `markAsPaid()`, `confirmPayment()`, and `rejectPayment()`

### Valid Status Transitions

| From Status | To Status | Method/Trigger |
|------------|-----------|----------------|
| `pending` | `awaiting_payment` | `confirm()` - Admin approves |
| `pending` | `cancelled` | `cancel()` - Admin/guest cancels |
| `awaiting_payment` | `awaiting_confirmation` | `markAsPaid()` - Guest marks as paid |
| `awaiting_payment` | `expired` | `expireUnpaidBookings()` - System cron |
| `awaiting_payment` | `cancelled` | `cancel()` - Admin/guest cancels |
| `awaiting_confirmation` | `confirmed` | `confirmPayment()` - Admin confirms |
| `awaiting_confirmation` | `payment_failed` | `rejectPayment()` - Admin rejects |
| `awaiting_confirmation` | `cancelled` | `cancel()` - Admin/guest cancels |
| `payment_failed` | `awaiting_payment` | `markAsPaid()` - Guest retries |
| `payment_failed` | `cancelled` | `cancel()` - Admin/guest cancels |
| `confirmed` | `cancelled` | `cancel()` - Admin/guest cancels |
| `confirmed` | `completed` | `updateStatus()` - Stay completed |
| `expired` | `cancelled` | `cancel()` - Can cancel expired bookings |
| Any (except terminal) | `cancelled` | `cancel()` - Cancellation always allowed |

**Terminal States** (no transitions allowed):
- `cancelled`
- `completed`

### Error Handling

When an invalid transition is attempted:
- An error is thrown with a descriptive message
- The error includes the current status and allowed transitions
- The error is logged for debugging
- The booking status is not changed

### Example Error Message

```
Invalid status transition from 'confirmed' to 'pending'. 
Allowed transitions: cancelled, completed
```

---

## 2. Automatic Booking Expiration

### What Was Implemented

A complete system to automatically expire bookings that are in `awaiting_payment` status and have passed their `payment_expires_at` deadline.

### Files Created

1. **Database Function**
   - `database/migrations/create_booking_expiration_function.sql`
   - Creates `expire_unpaid_bookings()` PostgreSQL function
   - Atomically updates bookings from `awaiting_payment` to `expired`
   - Sets `cancelled_at` timestamp
   - Returns count of expired bookings

2. **Supabase Edge Function**
   - `supabase/functions/expire-bookings/index.ts`
   - HTTP endpoint that can be called by cron jobs
   - Calls the database function via RPC
   - Includes fallback direct update method
   - Returns JSON response with expiration results

3. **Backend Query Methods**
   - `src/lib/queries/bookings.ts`
   - Added `expireUnpaidBookings()` method
   - Added `expireUnpaidBookingsDirect()` fallback method
   - Clears relevant caches after expiration

4. **React Hook**
   - `src/hooks/useBookings.ts`
   - Added `useExpireUnpaidBookings()` hook
   - Allows manual triggering from admin dashboard (for testing)

5. **Documentation**
   - `supabase/functions/expire-bookings/README.md`
   - Complete setup and deployment instructions
   - Cron job configuration examples

### How It Works

1. **Booking Approval**: When admin approves a booking via `confirm()`:
   - Status changes to `awaiting_payment`
   - `payment_expires_at` is set (default: 2 hours from approval)
   - Guest receives payment instructions

2. **Expiration Check**: The cron job calls the edge function:
   - Finds all bookings where:
     - `status = 'awaiting_payment'`
     - `payment_expires_at IS NOT NULL`
     - `payment_expires_at < NOW()`
   - Updates them to `status = 'expired'`
   - Sets `cancelled_at = NOW()`

3. **Result**: Expired bookings:
   - Cannot transition to other statuses (except `cancelled`)
   - Are visible in booking history
   - Can be cancelled by admin/guest

### Setup Instructions

#### Step 1: Run Database Migration

```sql
-- Run the migration file
\i database/migrations/create_booking_expiration_function.sql
```

Or execute the SQL directly in Supabase SQL Editor.

#### Step 2: Deploy Edge Function

```bash
supabase functions deploy expire-bookings
```

#### Step 3: Set Up Cron Job

**Option A: Supabase pg_cron (if available)**

```sql
SELECT cron.schedule(
  'expire-unpaid-bookings',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/expire-bookings',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_ANON_KEY'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

**Option B: External Cron Service**

Use [cron-job.org](https://cron-job.org) or similar:
- URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/expire-bookings`
- Method: POST
- Headers: `Authorization: Bearer YOUR_ANON_KEY`
- Schedule: Every 15-30 minutes

**Option C: Manual Testing**

```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/expire-bookings' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

### Response Format

**Success:**
```json
{
  "success": true,
  "expired": 3,
  "message": "Expired 3 booking(s)",
  "method": "rpc_function"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message",
  "details": "Stack trace"
}
```

---

## Testing

### Test Status Transition Validation

1. Try to transition a booking from `confirmed` to `pending` - should fail
2. Try to transition from `pending` to `awaiting_payment` via `confirm()` - should succeed
3. Try to transition from `awaiting_payment` to `awaiting_confirmation` via `markAsPaid()` - should succeed
4. Try to cancel from any status - should always succeed

### Test Booking Expiration

1. Create a booking and approve it (status: `awaiting_payment`)
2. Manually set `payment_expires_at` to a past date in the database
3. Call the expiration function (manually or via cron)
4. Verify booking status changed to `expired`
5. Verify `cancelled_at` is set

---

## Benefits

### Status Transition Validation

- ✅ Prevents invalid booking states
- ✅ Ensures data integrity
- ✅ Provides clear error messages
- ✅ Makes the booking flow predictable
- ✅ Easier to debug issues

### Automatic Expiration

- ✅ Automatically frees up property availability
- ✅ Prevents bookings from staying in limbo
- ✅ Improves user experience (clear status)
- ✅ Reduces manual admin work
- ✅ Ensures payment deadlines are enforced

---

## Future Enhancements

1. **Email Notifications for Expiration**
   - Send email to guest when booking expires
   - Notify admin of expired bookings

2. **Expiration Reminders**
   - Send reminder email 30 minutes before expiration
   - Show countdown timer on booking confirmation page

3. **Configurable Expiration Times**
   - Allow different expiration times per property
   - Admin-configurable default expiration time

4. **Expiration Analytics**
   - Track expiration rates
   - Identify patterns (e.g., properties with high expiration rates)

---

## Notes

- The expiration function is idempotent - safe to run multiple times
- Expired bookings can still be viewed in booking history
- Expired bookings can be cancelled (but not reactivated)
- The expiration function uses the service role key to bypass RLS
- All status transitions are logged for audit purposes

---

## Related Files

- `src/lib/queries/bookings.ts` - Core booking query functions
- `src/hooks/useBookings.ts` - React hooks for booking operations
- `database/migrations/create_booking_expiration_function.sql` - Database function
- `supabase/functions/expire-bookings/index.ts` - Edge function
- `docs/PAYMENT_FLOW_IMPLEMENTATION_PLAN.md` - Payment flow documentation
- `docs/BOOKING_FLOW_ANALYSIS.md` - Original analysis document

