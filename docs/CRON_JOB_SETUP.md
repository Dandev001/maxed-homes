# Cron Job Setup Guide - Booking Expiration

This guide explains how to set up a cron job to automatically expire unpaid bookings.

## Overview

The booking expiration system requires a scheduled task that calls the `expire-bookings` Supabase Edge Function every 15-30 minutes to check for and expire bookings that have passed their payment deadline.

## Prerequisites

1. ✅ Database migration has been run (`create_booking_expiration_function.sql`)
2. ✅ Edge function has been deployed (`expire-bookings`)
3. ✅ You have your Supabase project URL and anon key

## Option 1: External Cron Service (Recommended for MVP)

### Using cron-job.org (Free)

1. **Sign up** at [https://cron-job.org](https://cron-job.org) (free account available)

2. **Create a new cron job**:
   - Click "Create cronjob"
   - **Title**: `Expire Unpaid Bookings`
   - **Address (URL)**: 
     ```
     https://YOUR_PROJECT_REF.supabase.co/functions/v1/expire-bookings
     ```
     Replace `YOUR_PROJECT_REF` with your Supabase project reference (found in your Supabase dashboard URL)

3. **Configure the request**:
   - **Request method**: `POST`
   - **Request headers**: Click "Add header"
     - **Name**: `Authorization`
     - **Value**: `Bearer YOUR_ANON_KEY`
     - **Name**: `Content-Type`
     - **Value**: `application/json`
   - **Request body**: `{}` (empty JSON object)

4. **Set schedule**:
   - **Execution schedule**: `Every 15 minutes` or `Every 30 minutes`
   - Recommended: `Every 15 minutes` for better responsiveness

5. **Save and activate** the cron job

6. **Test the cron job**:
   - Click "Run now" to test
   - Check the logs to verify it's working
   - Verify in Supabase dashboard that bookings are being expired

### Using EasyCron (Alternative)

1. Sign up at [https://www.easycron.com](https://www.easycron.com)
2. Create a new cron job with similar settings as above
3. Set schedule to run every 15-30 minutes

### Using GitHub Actions (Free for public repos)

Create `.github/workflows/expire-bookings.yml`:

```yaml
name: Expire Unpaid Bookings

on:
  schedule:
    # Run every 15 minutes
    - cron: '*/15 * * * *'
  workflow_dispatch: # Allow manual triggering

jobs:
  expire-bookings:
    runs-on: ubuntu-latest
    steps:
      - name: Call Expire Bookings Function
        run: |
          curl -X POST \
            'https://${{ secrets.SUPABASE_PROJECT_REF }}.supabase.co/functions/v1/expire-bookings' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}' \
            -H 'Content-Type: application/json' \
            -d '{}'
```

**Setup**:
1. Add secrets to your GitHub repository:
   - `SUPABASE_PROJECT_REF`: Your Supabase project reference
   - `SUPABASE_ANON_KEY`: Your Supabase anon key
2. Commit and push the workflow file
3. GitHub Actions will automatically run it on schedule

## Option 2: Supabase pg_cron (Requires Pro Plan)

If you have Supabase Pro plan or higher, you can use pg_cron extension.

### Enable pg_cron Extension

1. Go to Supabase Dashboard → Database → Extensions
2. Search for `pg_cron`
3. Enable it

### Create Cron Job

Run this SQL in Supabase SQL Editor:

```sql
-- Schedule the expiration function to run every 15 minutes
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

**Replace**:
- `YOUR_PROJECT_REF` with your Supabase project reference
- `YOUR_ANON_KEY` with your Supabase anon key

### Verify Cron Job

```sql
-- List all cron jobs
SELECT * FROM cron.job;

-- Check cron job execution history
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'expire-unpaid-bookings')
ORDER BY start_time DESC 
LIMIT 10;
```

### Remove Cron Job (if needed)

```sql
-- Unschedule the cron job
SELECT cron.unschedule('expire-unpaid-bookings');
```

## Option 3: Vercel Cron Jobs (If Using Vercel)

If you're deploying your frontend to Vercel, you can use Vercel Cron Jobs.

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-bookings",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Create `api/cron/expire-bookings.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify cron secret (optional but recommended)
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const response = await fetch(
      `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co/functions/v1/expire-bookings`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    )

    const data = await response.json()
    return res.status(200).json(data)
  } catch (error) {
    console.error('Error calling expire-bookings function:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
```

## Option 4: Manual Testing

You can manually trigger the expiration function for testing:

### Using cURL

```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/expire-bookings' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### Using Postman

1. Create a new POST request
2. URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/expire-bookings`
3. Headers:
   - `Authorization`: `Bearer YOUR_ANON_KEY`
   - `Content-Type`: `application/json`
4. Body: `{}` (raw JSON)
5. Send request

### Expected Response

**Success**:
```json
{
  "success": true,
  "expired": 2,
  "message": "Expired 2 booking(s)",
  "method": "rpc_function"
}
```

**No bookings to expire**:
```json
{
  "success": true,
  "expired": 0,
  "message": "Expired 0 booking(s)",
  "method": "rpc_function"
}
```

## Monitoring

### Check Edge Function Logs

1. Go to Supabase Dashboard → Edge Functions → `expire-bookings`
2. Click on "Logs" tab
3. Monitor for errors or unexpected behavior

### Check Database

Query to see recently expired bookings:

```sql
SELECT 
  id,
  status,
  payment_expires_at,
  cancelled_at,
  updated_at
FROM bookings
WHERE status = 'expired'
ORDER BY cancelled_at DESC
LIMIT 10;
```

### Set Up Alerts (Optional)

Consider setting up alerts for:
- Cron job failures (if using external service)
- High number of expired bookings (might indicate a problem)
- Edge function errors

## Troubleshooting

### Cron Job Not Running

1. **Check cron service status** (if using external service)
2. **Verify URL and credentials** are correct
3. **Check edge function logs** for errors
4. **Test manually** using cURL or Postman

### Bookings Not Expiring

1. **Verify database function exists**:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'expire_unpaid_bookings';
   ```

2. **Check if bookings have `payment_expires_at` set**:
   ```sql
   SELECT id, status, payment_expires_at 
   FROM bookings 
   WHERE status = 'awaiting_payment' 
   AND payment_expires_at IS NOT NULL;
   ```

3. **Manually test the database function**:
   ```sql
   SELECT expire_unpaid_bookings();
   ```

### Edge Function Errors

1. Check edge function logs in Supabase dashboard
2. Verify environment variables are set correctly
3. Check that service role key has proper permissions

## Security Considerations

1. **Protect your anon key**: Don't expose it in client-side code
2. **Use environment variables**: Store credentials securely
3. **Consider adding authentication**: Add a secret token to verify cron requests
4. **Monitor for abuse**: Watch for unusual patterns in function calls

## Recommended Schedule

- **Development**: Every 15 minutes (faster testing)
- **Production**: Every 15-30 minutes (balance between responsiveness and resource usage)

## Next Steps

After setting up the cron job:

1. ✅ Test it manually first
2. ✅ Monitor logs for the first few runs
3. ✅ Verify bookings are being expired correctly
4. ✅ Set up alerts (optional)
5. ✅ Document the setup for your team

---

**Need Help?** Check the edge function README: `supabase/functions/expire-bookings/README.md`

