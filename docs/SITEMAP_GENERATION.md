# Sitemap Generation Guide

## Overview

The sitemap generator script automatically creates a `sitemap.xml` file from your Supabase database. It includes all active properties and static pages.

## Quick Start

### Generate Sitemap

```bash
npm run generate:sitemap
```

This will:
1. Connect to your Supabase database
2. Fetch all active properties
3. Generate `public/sitemap.xml` with all URLs

### Automatic Generation

The sitemap is automatically generated before each build:

```bash
npm run build
```

The `prebuild` script runs the sitemap generator automatically.

## Configuration

### Environment Variables

The script uses these environment variables (from `.env.local` or `.env`):

- `VITE_SUPABASE_URL` - Your Supabase project URL (required)
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key (required)
- `SITE_URL` - Your website URL (optional, defaults to `https://maxedhomes.com`)

### Setting SITE_URL

Add to your `.env.local` file:

```env
SITE_URL=https://yourdomain.com
```

## Manual Usage

You can also run the script directly:

```bash
node scripts/generate-sitemap.js
```

## What's Included

The generated sitemap includes:

1. **Static Pages**:
   - Homepage (`/`)
   - Properties listing (`/properties`)
   - About page (`/about`)
   - Contact page (`/contact`)

2. **Dynamic Pages**:
   - All active property pages (`/properties/{id}`)

## Sitemap Structure

Each URL includes:
- `<loc>` - Full URL
- `<lastmod>` - Last modification date (from `updated_at` or `created_at`)
- `<changefreq>` - How often the page changes
- `<priority>` - Relative priority (0.0 to 1.0)

## Updating the Sitemap

### Manual Update

Run the script whenever you:
- Add new properties
- Update property information
- Change static pages

```bash
npm run generate:sitemap
```

### Automated Updates

For production, consider:

1. **CI/CD Integration**: Add to your deployment pipeline
2. **Cron Job**: Schedule regular updates (daily/weekly)
3. **Webhook**: Trigger on property updates

## Example CI/CD Integration

### GitHub Actions

```yaml
name: Generate Sitemap
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight
  workflow_dispatch:  # Manual trigger

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run generate:sitemap
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          SITE_URL: ${{ secrets.SITE_URL }}
      - uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: 'Update sitemap'
          file_pattern: 'public/sitemap.xml'
```

## Troubleshooting

### Error: Missing Environment Variables

**Problem**: Script fails with "Missing required environment variables"

**Solution**: 
1. Check your `.env.local` file exists
2. Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
3. Verify the values are correct

### Error: Cannot Connect to Supabase

**Problem**: Script fails to fetch properties

**Solution**:
1. Verify your Supabase URL and key are correct
2. Check your internet connection
3. Ensure your Supabase project is active
4. Verify RLS policies allow reading properties

### No Properties in Sitemap

**Problem**: Sitemap only includes static pages

**Solution**:
1. Check if you have active properties in your database
2. Verify properties have `status = 'active'`
3. Check the script output for errors

## File Location

Generated sitemap: `public/sitemap.xml`

This file is served at: `https://yourdomain.com/sitemap.xml`

## Submitting to Search Engines

After generating your sitemap:

1. **Google Search Console**: 
   - Go to Sitemaps section
   - Submit: `https://yourdomain.com/sitemap.xml`

2. **Bing Webmaster Tools**:
   - Go to Sitemaps section
   - Submit: `https://yourdomain.com/sitemap.xml`

## Best Practices

1. **Regular Updates**: Regenerate sitemap when properties change
2. **Keep It Current**: Update `lastmod` dates accurately
3. **Monitor Size**: Keep sitemap under 50MB or 50,000 URLs
4. **Validate**: Use XML validators to check format
5. **Test**: Verify all URLs are accessible

## Advanced: Multiple Sitemaps

If you have many properties (>50,000), consider splitting into multiple sitemaps:

1. Create a sitemap index file
2. Split properties into multiple sitemap files
3. Reference them in the index

This is handled automatically by the script if needed in the future.

## Script Details

The script (`scripts/generate-sitemap.js`):
- Uses ES modules (`type: "module"` in package.json)
- Connects to Supabase using the official client
- Fetches only active properties
- Generates valid XML sitemap format
- Escapes XML special characters
- Includes proper lastmod dates

## Support

For issues or questions:
1. Check the script output for error messages
2. Verify environment variables
3. Test Supabase connection separately
4. Review the script code in `scripts/generate-sitemap.js`

