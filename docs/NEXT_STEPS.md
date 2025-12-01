# Next Steps - Booking Flow Implementation

## ✅ Recently Completed

1. **Status Transition Validation** - All booking status changes now validate transitions
2. **Automatic Booking Expiration** - System to expire unpaid bookings via cron job

## 🔧 Immediate Next Steps

### 1. Fix Pricing Calculation Inconsistency ⚠️ **CRITICAL**

**Issue**: Two different pricing calculations are being used:

- **RequestBookingModal.tsx** (used in PropertyDetail):
  - Base price + Cleaning fee
  - Taxes: 10% of (base + cleaning)
  - **No service fee**
  - Total = base + cleaning + taxes

- **Booking.tsx** (standalone booking page):
  - Base price + Cleaning fee
  - Service fee: 12% of base price
  - Taxes: 8% of (base + cleaning + service)
  - Total = base + cleaning + service + taxes

**Action Required**:
1. Decide on the correct pricing formula (which one is correct?)
2. Create a shared pricing calculation utility function
3. Update both components to use the same calculation
4. Ensure consistency across the entire booking flow

**Recommended Solution**:
```typescript
// src/lib/utils/pricing.ts
export function calculateBookingPricing(
  pricePerNight: number,
  nights: number,
  cleaningFee: number,
  serviceFeeRate: number = 0.12,
  taxRate: number = 0.08
) {
  const basePrice = pricePerNight * nights
  const serviceFee = Math.round(basePrice * serviceFeeRate)
  const subtotal = basePrice + cleaningFee + serviceFee
  const taxes = Math.round(subtotal * taxRate)
  const totalAmount = subtotal + taxes
  
  return {
    basePrice,
    cleaningFee,
    serviceFee,
    taxes,
    totalAmount
  }
}
```

### 2. Deploy Database Migration

**Action Required**:
```sql
-- Run this in Supabase SQL Editor
\i database/migrations/create_booking_expiration_function.sql
```

Or execute the SQL from `database/migrations/create_booking_expiration_function.sql` directly.

### 3. Deploy Edge Function

**Action Required**:
```bash
supabase functions deploy expire-bookings
```

### 4. Set Up Cron Job

**Action Required**: Choose one method:

**Option A: External Cron Service** (Recommended for MVP)
- Use [cron-job.org](https://cron-job.org) or similar
- URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/expire-bookings`
- Method: POST
- Headers: `Authorization: Bearer YOUR_ANON_KEY`
- Schedule: Every 15-30 minutes

**Option B: Supabase pg_cron** (if available on your plan)
```sql
SELECT cron.schedule(
  'expire-unpaid-bookings',
  '*/15 * * * *',
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

### 5. Update BOOKING_FLOW_ANALYSIS.md

**Action Required**: The analysis document is outdated. Update it to reflect:
- ✅ Payment flow is implemented
- ✅ Email notifications are implemented
- ✅ Booking expiration is implemented
- ✅ Status validation is implemented
- ⚠️ Pricing inconsistency needs fixing

## 🧪 Testing Checklist

### Test Status Transitions
- [ ] Try invalid transition (e.g., `confirmed` → `pending`) - should fail
- [ ] Test all valid transitions work correctly
- [ ] Verify error messages are clear

### Test Booking Expiration
- [ ] Create a booking and approve it
- [ ] Manually set `payment_expires_at` to past date in database
- [ ] Call expiration function (manually or wait for cron)
- [ ] Verify booking status changed to `expired`
- [ ] Verify `cancelled_at` is set

### Test Pricing Consistency
- [ ] Create booking via RequestBookingModal - note the total
- [ ] Create booking via Booking.tsx - note the total
- [ ] Verify they match (after fixing inconsistency)
- [ ] Test with different property prices and cleaning fees

## 📋 Future Enhancements (Post-MVP)

### High Priority
1. **Email Notifications for Expiration**
   - Send email to guest when booking expires
   - Notify admin of expired bookings

2. **Expiration Reminders**
   - Send reminder email 30 minutes before expiration
   - Show countdown timer on booking confirmation page

3. **Booking Modification**
   - Allow guests to modify dates/guests after booking
   - Recalculate pricing on modification

### Medium Priority
4. **Booking Analytics**
   - Track expiration rates
   - Identify patterns (properties with high expiration rates)
   - Revenue tracking per property

5. **Payment Retry Flow**
   - Better UX for payment_failed → awaiting_payment retry
   - Clear instructions for retrying payment

### Low Priority
6. **Booking Activity Log**
   - Audit trail of all status changes
   - Who changed what and when

7. **Automatic Booking Completion**
   - Mark bookings as `completed` after check-out date
   - Trigger post-stay emails

## 🚀 Deployment Checklist

Before going to production:

- [ ] Fix pricing calculation inconsistency
- [ ] Deploy database migration
- [ ] Deploy edge function
- [ ] Set up cron job
- [ ] Test all status transitions
- [ ] Test booking expiration
- [ ] Test email notifications
- [ ] Verify pricing consistency
- [ ] Update documentation
- [ ] Set up monitoring/alerts for expiration function
- [ ] Test error handling and edge cases

## 📝 Documentation Updates Needed

- [ ] Update `BOOKING_FLOW_ANALYSIS.md` to reflect current state
- [ ] Add pricing calculation documentation
- [ ] Document status transition rules
- [ ] Create deployment guide
- [ ] Add troubleshooting guide

## 🎯 Priority Order

1. **Fix pricing inconsistency** (affects user experience and revenue)
2. **Deploy expiration system** (database + edge function + cron)
3. **Test everything thoroughly**
4. **Update documentation**
5. **Plan future enhancements**

---

**Current Status**: Booking flow is ~95% complete. Main remaining item is pricing consistency fix.
