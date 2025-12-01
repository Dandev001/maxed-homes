# Send Email Edge Function

This Supabase Edge Function sends emails using Resend.com.

## Setup

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link to your project

```bash
supabase link --project-ref your-project-ref
```

### 4. Set Environment Variables

Set these secrets in Supabase Dashboard or via CLI:

```bash
# Required: Your Resend API key
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx

# Optional: Customize sender email
supabase secrets set RESEND_FROM_EMAIL="Maxed Homes <noreply@yourdomain.com>"
supabase secrets set RESEND_FROM_NAME="Maxed Homes"

# Optional: Reply-to email
supabase secrets set RESEND_REPLY_TO="support@yourdomain.com"
```

Or set them in Supabase Dashboard:
1. Go to **Project Settings** → **Edge Functions** → **Secrets**
2. Add the secrets listed above

### 5. Deploy the Function

```bash
supabase functions deploy send-email
```

### 6. Test the Function

```bash
supabase functions invoke send-email --body '{
  "template": "booking_request_created",
  "to": {"email": "test@example.com", "name": "Test User"},
  "subject": "Test Email",
  "data": {
    "html": "<h1>Test</h1>",
    "text": "Test"
  }
}'
```

## Environment Variables

### Required
- `RESEND_API_KEY` - Your Resend API key (get from resend.com/api-keys)

### Optional
- `RESEND_FROM_EMAIL` - Sender email address (default: "Maxed Homes <noreply@maxedhomes.com>")
- `RESEND_FROM_NAME` - Sender name (default: "Maxed Homes")
- `RESEND_REPLY_TO` - Reply-to email address

## Domain Verification

Before sending emails, you need to verify your domain in Resend:

1. Go to [resend.com/domains](https://resend.com/domains)
2. Add your domain
3. Add the DNS records provided by Resend
4. Wait for verification (usually a few minutes)

## Rate Limits

Resend free tier includes:
- 3,000 emails/month
- 100 emails/day

Upgrade for higher limits.

## Troubleshooting

### Function not found
- Make sure you've deployed: `supabase functions deploy send-email`
- Check you're linked to the correct project: `supabase projects list`

### Authentication errors
- Verify `RESEND_API_KEY` is set correctly
- Check the API key is active in Resend dashboard

### Domain not verified
- Verify your domain in Resend dashboard
- Check DNS records are correct
- Wait a few minutes for DNS propagation

### Emails not sending
- Check function logs: `supabase functions logs send-email`
- Verify recipient email addresses are valid
- Check Resend dashboard for delivery status

