# Expire Bookings Edge Function

This Supabase Edge Function automatically expires bookings that are in `awaiting_payment` status and have passed their `payment_expires_at` deadline.

## Purpose

When a booking is approved by an admin, it transitions to `awaiting_payment` status with a `payment_expires_at` timestamp (typically 2 hours from approval). This function checks for bookings that have passed this deadline and automatically expires them.

## Setup

### 1. Deploy the Function

```bash
supabase functions deploy expire-bookings
```

### 2. Set Environment Variables

The function requires the following environment variables (set in Supabase Dashboard):

- `SUPABASE_URL` - Your Supabase project URL (automatically available)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for bypassing RLS (automatically available)

### 3. Schedule the Function

You can schedule this function to run periodically using one of these methods:

#### Option A: Supabase Cron Jobs (Recommended)

If your Supabase plan supports pg_cron, you can set up a cron job:

```sql
-- Run every 15 minutes
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

#### Option B: External Cron Service

Use an external service like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- GitHub Actions (scheduled workflows)
- Vercel Cron Jobs

Set up a POST request to:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/expire-bookings
```

With headers:
```
Authorization: Bearer YOUR_ANON_KEY
Content-Type: application/json
```

Schedule: Every 15-30 minutes

#### Option C: Manual Trigger

You can also call this function manually via HTTP:

```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/expire-bookings' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

## How It Works

1. The function calls the `expire_unpaid_bookings()` database function
2. The database function finds all bookings where:
   - `status = 'awaiting_payment'`
   - `payment_expires_at IS NOT NULL`
   - `payment_expires_at < NOW()`
3. Updates these bookings to `status = 'expired'` and sets `cancelled_at`
4. Returns the count of expired bookings

## Response Format

### Success Response

```json
{
  "success": true,
  "expired": 3,
  "message": "Expired 3 booking(s)",
  "method": "rpc_function"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "details": "Stack trace (if available)"
}
```

## Database Function

This function relies on the `expire_unpaid_bookings()` database function defined in:
`database/migrations/create_booking_expiration_function.sql`

Make sure this migration has been run before deploying the edge function.

## Testing

Test the function locally:

```bash
supabase functions serve expire-bookings
```

Then call it:

```bash
curl -X POST \
  'http://localhost:54321/functions/v1/expire-bookings' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

## Monitoring

Monitor the function execution in:
- Supabase Dashboard → Edge Functions → expire-bookings → Logs
- Check for errors or unexpected behavior
- Verify bookings are being expired correctly

## Notes

- The function uses the service role key to bypass RLS
- Bookings are expired atomically in a single database transaction
- The function is idempotent - safe to run multiple times
- Expired bookings can still be viewed but cannot transition to other statuses (except cancelled)

