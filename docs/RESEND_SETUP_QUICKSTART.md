# Resend.com Email Setup - Quick Start

## 🚀 Quick Setup (5 minutes)

### 1. Get Resend API Key
- Sign up at [resend.com](https://resend.com)
- Go to [API Keys](https://resend.com/api-keys)
- Create new API key → Copy it (starts with `re_`)

### 2. Set Secret in Supabase
```bash
supabase secrets set RESEND_API_KEY=re_your_api_key_here
```

Or in Supabase Dashboard:
- **Project Settings** → **Edge Functions** → **Secrets**
- Add `RESEND_API_KEY` with your key

### 3. Deploy Edge Function
```bash
supabase functions deploy send-email
```

### 4. Configure Frontend
Add to `.env.local`:
```env
VITE_EMAIL_ENABLED=true
VITE_EMAIL_API_ENDPOINT=https://your-project-ref.supabase.co/functions/v1/send-email
VITE_APP_URL=https://yourdomain.com
```

### 5. Verify Domain (Production)
- Go to [resend.com/domains](https://resend.com/domains)
- Add your domain
- Add DNS records
- Wait for verification

## ✅ Done!

Emails will now be sent automatically for:
- Booking requests
- Booking approvals/rejections
- Payment confirmations
- Booking cancellations
- Admin notifications

## 📚 Full Documentation

See [EMAIL_NOTIFICATIONS_SETUP.md](./EMAIL_NOTIFICATIONS_SETUP.md) for detailed instructions.

