# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `maxed-homes` (or your preferred name)
   - **Database Password**: Create a strong password
   - **Region**: Choose the region closest to your users
6. Click "Create new project"

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

## 3. Configure Environment Variables

Create a `.env.local` file in your project root with the following content:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: Replace the placeholder values with your actual Supabase credentials.

## 4. Using Supabase in Your App

The Supabase client is already configured and ready to use. Import it in your components:

```typescript
import { supabase } from '@/lib/supabase'

// Example: Fetch data
const { data, error } = await supabase
  .from('your_table')
  .select('*')

// Example: Insert data
const { data, error } = await supabase
  .from('your_table')
  .insert([{ column: 'value' }])
```

## 5. Database Setup (Optional)

If you need to set up database tables:

1. Go to **Table Editor** in your Supabase dashboard
2. Create tables as needed
3. Set up Row Level Security (RLS) policies
4. Configure authentication if needed

## 6. Authentication Setup (Optional)

To enable authentication:

1. Go to **Authentication** → **Settings** in your dashboard
2. Configure your preferred auth providers
3. Set up email templates if needed
4. Configure redirect URLs

## Security Notes

- Never commit your `.env.local` file to version control
- The anon key is safe to use in client-side code
- Use Row Level Security (RLS) to protect your data
- Consider using service role key for server-side operations (keep it secret)

## Next Steps

- Set up your database schema
- Configure authentication if needed
- Implement your first Supabase queries
- Set up real-time subscriptions if needed
