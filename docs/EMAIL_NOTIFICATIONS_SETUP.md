# Email Notifications Setup Guide

This guide explains how to set up email notifications for the Maxed Homes platform.

## Overview

The email notification system sends automated emails for:
- **Booking Request Created** - Sent to guest when they submit a booking request
- **Booking Approved** - Sent to guest when admin approves booking (payment required)
- **Booking Rejected** - Sent to guest when admin rejects booking
- **Payment Received** - Sent to guest when they submit payment (awaiting verification)
- **Booking Confirmed** - Sent to guest when admin confirms payment
- **Booking Cancelled** - Sent to guest when booking is cancelled
- **Admin Notifications** - Sent to admins for new bookings and payment verification requests

## Setup with Resend.com

This guide uses Resend.com as the email service provider with Supabase Edge Functions.

### Step 1: Get Resend API Key

1. Sign up at [resend.com](https://resend.com) (free tier includes 3,000 emails/month)
2. Go to [API Keys](https://resend.com/api-keys)
3. Create a new API key
4. Copy the API key (starts with `re_`)

### Step 2: Verify Your Domain (Required for Production)

1. Go to [Domains](https://resend.com/domains) in Resend dashboard
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records provided by Resend to your domain's DNS settings
5. Wait for verification (usually a few minutes)

**Note**: For testing, you can use Resend's test domain, but you'll need to verify your own domain for production.

### Step 3: Install Supabase CLI

```bash
npm install -g supabase
```

### Step 4: Login and Link Project

```bash
# Login to Supabase
supabase login

# Link to your project (get project ref from Supabase dashboard URL)
supabase link --project-ref your-project-ref
```

### Step 5: Set Resend API Key

Set the Resend API key as a secret in Supabase:

**Option A: Via CLI**
```bash
supabase secrets set RESEND_API_KEY=re_your_api_key_here
```

**Option B: Via Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
3. Click **Add Secret**
4. Name: `RESEND_API_KEY`
5. Value: Your Resend API key (starts with `re_`)
6. Click **Save**

### Step 6: Optional - Configure Sender Email

Set custom sender email (optional):

```bash
supabase secrets set RESEND_FROM_EMAIL="Maxed Homes <noreply@yourdomain.com>"
supabase secrets set RESEND_FROM_NAME="Maxed Homes"
supabase secrets set RESEND_REPLY_TO="support@yourdomain.com"
```

Or set in Dashboard under Edge Functions → Secrets.

### Step 7: Deploy Edge Function

The Edge Function code is already in `supabase/functions/send-email/index.ts`. Deploy it:

```bash
supabase functions deploy send-email
```

### Step 8: Get Your Function URL

After deployment, you'll see the function URL. It will be:
```
https://your-project-ref.supabase.co/functions/v1/send-email
```

### Step 9: Configure Frontend

Add to your `.env.local`:

```env
# Email Configuration
VITE_EMAIL_ENABLED=true
VITE_EMAIL_API_ENDPOINT=https://your-project-ref.supabase.co/functions/v1/send-email
VITE_EMAIL_PROVIDER=supabase
VITE_APP_URL=https://yourdomain.com

# Optional: Payment details for email templates
VITE_MTN_MOMO_NUMBER=+225 XX XX XX XX XX
VITE_MOOV_MOMO_NUMBER=+225 XX XX XX XX XX
VITE_BANK_ACCOUNT=XXXX-XXXX-XXXX
```

**Important**: Replace `your-project-ref` with your actual Supabase project reference ID.

### Step 10: Test Email Sending

1. Create a test booking in your app
2. Check the Resend dashboard → [Emails](https://resend.com/emails) to see sent emails
3. Verify emails are received correctly

### Troubleshooting

**Function not found:**
- Verify deployment: `supabase functions list`
- Check you're linked to correct project: `supabase projects list`

**Authentication errors:**
- Verify `RESEND_API_KEY` secret is set: `supabase secrets list`
- Check API key is active in Resend dashboard

**Domain not verified:**
- Go to Resend → Domains
- Verify DNS records are added correctly
- Wait a few minutes for DNS propagation

**Emails not sending:**
- Check function logs: `supabase functions logs send-email`
- Check Resend dashboard for delivery status
- Verify recipient emails are valid

## Alternative Setup Options

### Option 2: Custom API Endpoint

If you prefer to use your own backend API instead of Supabase Edge Functions:

1. Create an API endpoint that accepts the same request format
2. Use Resend SDK in your backend
3. Update `VITE_EMAIL_API_ENDPOINT` to point to your API

See the Edge Function code in `supabase/functions/send-email/index.ts` for reference on the expected request/response format.

### Option 3: Development Mode (No Emails)

In development, emails are logged to console instead of being sent:

```env
VITE_EMAIL_ENABLED=false
# Or simply don't set VITE_EMAIL_API_ENDPOINT
```

This allows you to develop without sending actual emails.

## Environment Variables

Add these to your `.env.local`:

```env
# Email Configuration
VITE_EMAIL_ENABLED=true
VITE_EMAIL_API_ENDPOINT=https://your-project-id.supabase.co/functions/v1/send-email
VITE_EMAIL_PROVIDER=supabase
VITE_APP_URL=https://yourdomain.com

# Optional: Payment details for email templates
VITE_MTN_MOMO_NUMBER=+225 XX XX XX XX XX
VITE_MOOV_MOMO_NUMBER=+225 XX XX XX XX XX
VITE_BANK_ACCOUNT=XXXX-XXXX-XXXX
```

## Testing

### Test Email Sending

1. Create a test booking
2. Check your email service dashboard for sent emails
3. Verify emails are received correctly

### Test in Development

In development mode (when `VITE_EMAIL_API_ENDPOINT` is not set), emails are logged to console:

```
[emailService] Email would be sent (dev mode) {
  template: 'booking_request_created',
  to: { email: 'guest@example.com', name: 'John Doe' },
  subject: 'Booking Request Received'
}
```

## Troubleshooting

### Emails Not Sending

1. **Check environment variables**: Ensure `VITE_EMAIL_ENABLED=true` and `VITE_EMAIL_API_ENDPOINT` is set
2. **Check API endpoint**: Verify the endpoint URL is correct and accessible
3. **Check email service**: Verify your email service API key is valid
4. **Check browser console**: Look for error messages in the console
5. **Check network tab**: Verify API requests are being made

### Email Service Errors

- **401 Unauthorized**: Check your API key
- **403 Forbidden**: Verify your domain/email is verified
- **429 Too Many Requests**: You've hit rate limits, wait or upgrade plan
- **500 Server Error**: Check your Edge Function/API logs

### Email Templates Not Rendering

- Check that `VITE_APP_URL` is set correctly
- Verify booking data is being passed correctly
- Check email service supports HTML emails

## Customization

### Customize Email Templates

Edit templates in `src/lib/email/templates.ts`:

```typescript
export function bookingRequestCreatedTemplate(data: BookingEmailData) {
  // Customize subject, HTML, and text
  const subject = `Your Custom Subject - ${data.propertyTitle}`
  const body = `Your custom email body...`
  // ...
}
```

### Add New Email Types

1. Add template function in `src/lib/email/templates.ts`
2. Add service function in `src/lib/email/service.ts`
3. Add hook in `src/hooks/useEmail.ts`
4. Use the hook in your components

## Security Notes

- Never expose email API keys in frontend code
- Always use environment variables for sensitive data
- Use Edge Functions or backend API to keep keys secure
- Verify email addresses before sending
- Implement rate limiting to prevent abuse

## Next Steps

1. Set up your email service provider
2. Configure environment variables
3. Deploy Edge Function (if using Supabase)
4. Test email sending
5. Monitor email delivery rates

