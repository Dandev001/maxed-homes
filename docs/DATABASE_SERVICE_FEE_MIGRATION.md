# Database Service Fee Migration (Future Enhancement)

## Current Situation

The database constraint requires:
```sql
CONSTRAINT valid_booking_amount CHECK (total_amount = base_price + cleaning_fee + taxes)
```

But our pricing calculation includes a service fee:
```
total_amount = base_price + cleaning_fee + serviceFee + taxes
```

## Current Workaround

We're combining `serviceFee + taxes` into the `taxes` field when saving to the database. This works but isn't ideal because:
- Service fee and taxes are stored together (can't query them separately)
- Less transparent for accounting/reporting

## Future Migration

To properly support service fees, we should:

### 1. Add service_fee column to bookings table

```sql
ALTER TABLE bookings
ADD COLUMN service_fee DECIMAL(10,2) DEFAULT 0 CHECK (service_fee >= 0);
```

### 2. Update the constraint

```sql
-- Drop old constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS valid_booking_amount;

-- Add new constraint
ALTER TABLE bookings
ADD CONSTRAINT valid_booking_amount 
CHECK (total_amount = base_price + cleaning_fee + service_fee + taxes);
```

### 3. Update CreateBookingInput type

```typescript
export interface CreateBookingInput {
  // ... existing fields
  service_fee?: number
}
```

### 4. Update booking creation code

Remove the workaround and send `service_fee` separately:
```typescript
const booking = await createBooking({
  // ... other fields
  service_fee: pricing.serviceFee,
  taxes: pricing.taxes, // Now just taxes, not combined
  total_amount: pricing.totalAmount,
});
```

## Migration Script

```sql
-- Migration: Add service_fee column to bookings table
-- File: database/migrations/add_service_fee_to_bookings.sql

BEGIN;

-- Add service_fee column
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS service_fee DECIMAL(10,2) DEFAULT 0 CHECK (service_fee >= 0);

-- Update existing bookings: extract service fee from taxes
-- Assuming service fee was 12% of base_price, we need to calculate it
-- This is a one-time migration for existing data
UPDATE bookings
SET service_fee = ROUND(base_price * 0.12, 2),
    taxes = taxes - ROUND(base_price * 0.12, 2)
WHERE service_fee = 0 AND taxes > 0;

-- Drop old constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS valid_booking_amount;

-- Add new constraint
ALTER TABLE bookings
ADD CONSTRAINT valid_booking_amount 
CHECK (total_amount = base_price + cleaning_fee + service_fee + taxes);

COMMIT;
```

## When to Apply

- When you need to track service fees separately for accounting
- When you need to report on service fee revenue
- When you want cleaner data separation

For now, the workaround is sufficient for MVP.

