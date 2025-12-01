# Payment Details Security Fix

## 🔒 Security Issue Identified

**Problem**: Payment details (MTN MoMo, Moov MoMo, bank account numbers) were hardcoded in the frontend code using environment variables. This is a **critical security vulnerability** because:

1. **Frontend code can be modified**: A hacker could modify the JavaScript code in the browser to display their own payment numbers
2. **Environment variables are exposed**: Even if using env vars, they're still visible in the client bundle
3. **No validation**: There's no way to verify that payment details shown to users are legitimate

## ✅ Solution Implemented

### 1. Database Table (`payment_config`)
- Created `payment_config` table to store payment details securely in the database
- Only admins can create/update/delete payment configs
- Guests can only view active payment configs (read-only)
- Row Level Security (RLS) policies enforce these permissions

### 2. Backend Queries (`src/lib/queries/paymentConfig.ts`)
- `getActive()` - Fetches active payment configs for guests
- `getAll()` - Fetches all configs for admins
- `create()`, `update()`, `delete()` - Admin-only operations
- Results are cached for 5 minutes to reduce database load

### 3. React Hook (`src/hooks/usePaymentConfig.ts`)
- `usePaymentConfig()` - Hook for guests to fetch payment details
- `useAllPaymentConfigs()` - Hook for admins to manage payment configs
- Automatically handles loading states and errors

### 4. Updated BookingConfirmation Page
- Removed hardcoded payment details
- Now fetches payment details from backend via `usePaymentConfig()` hook
- Shows loading state while fetching
- Displays error message if payment details can't be loaded

## 📋 Implementation Steps

### Step 1: Run Database Migration

```bash
# Run this SQL in Supabase SQL Editor
\i database/migrations/create_payment_config_table.sql
```

Or copy and paste the SQL from `database/migrations/create_payment_config_table.sql` into Supabase SQL Editor.

### Step 2: Update Payment Details

After running the migration, **update the payment details** with your actual numbers:

```sql
-- Update MTN MoMo number
UPDATE payment_config 
SET account_number = '+225 YOUR_ACTUAL_MTN_NUMBER'
WHERE payment_method = 'mtn_momo';

-- Update Moov MoMo number
UPDATE payment_config 
SET account_number = '+225 YOUR_ACTUAL_MOOV_NUMBER'
WHERE payment_method = 'moov_momo';

-- Update Bank Transfer details
UPDATE payment_config 
SET account_number = 'YOUR_ACTUAL_BANK_ACCOUNT',
    bank_name = 'YOUR_BANK_NAME'
WHERE payment_method = 'bank_transfer';
```

### Step 3: Verify RLS Policies

Make sure RLS policies are working correctly:

1. **As a guest** (not logged in or logged in as regular user):
   - Should be able to view active payment configs
   - Should NOT be able to create/update/delete

2. **As an admin**:
   - Should be able to view all payment configs (including inactive)
   - Should be able to create/update/delete

### Step 4: Test the Flow

1. Create a booking
2. Navigate to booking confirmation page
3. Verify payment details are displayed correctly
4. Verify payment details are fetched from backend (check Network tab in DevTools)

## 🔐 Security Benefits

1. **Prevents Tampering**: Payment details are stored in the database, not in frontend code
2. **Admin Control**: Only admins can update payment details
3. **Audit Trail**: All changes are tracked via `updated_at` timestamp
4. **Validation**: Database constraints ensure data integrity
5. **RLS Protection**: Row Level Security prevents unauthorized access

## 🚨 Important Notes

1. **Remove Environment Variables**: After migration, you can remove these from `.env`:
   - `VITE_MTN_MOMO_NUMBER`
   - `VITE_MOOV_MOMO_NUMBER`
   - `VITE_BANK_ACCOUNT`

2. **Admin Interface**: Consider creating an admin interface to manage payment configs (see TODO #5)

3. **Monitoring**: Monitor for any unauthorized attempts to modify payment configs

4. **Backup**: Keep a backup of your payment details in a secure location

## 📝 Next Steps (Optional)

1. **Create Admin Interface** (`src/components/admin/PaymentConfigManagement.tsx`)
   - List all payment configs
   - Add/edit/delete payment configs
   - Toggle active/inactive status
   - Reorder payment methods

2. **Add Validation**
   - Validate phone number format for MoMo numbers
   - Validate bank account format
   - Prevent duplicate payment methods

3. **Add Logging**
   - Log when payment configs are updated
   - Alert admins of changes

4. **Add Verification**
   - Display a verification badge/icon for verified payment methods
   - Add a warning if payment details haven't been updated recently

## 🧪 Testing Checklist

- [ ] Database migration runs successfully
- [ ] Payment details are displayed on booking confirmation page
- [ ] Payment details are fetched from backend (not hardcoded)
- [ ] Guests can view active payment configs
- [ ] Guests cannot modify payment configs
- [ ] Admins can view all payment configs
- [ ] Admins can create/update/delete payment configs
- [ ] Cache works correctly (payment details cached for 5 minutes)
- [ ] Error handling works (shows message if payment details can't be loaded)

## 📚 Related Files

- `database/migrations/create_payment_config_table.sql` - Database migration
- `src/lib/queries/paymentConfig.ts` - Backend queries
- `src/hooks/usePaymentConfig.ts` - React hooks
- `src/pages/BookingConfirmation.tsx` - Updated to use secure payment config
- `src/types/database.ts` - Added PaymentConfig type

