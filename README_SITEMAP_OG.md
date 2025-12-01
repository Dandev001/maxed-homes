# Sitemap & Open Graph Image Setup

## ✅ What's Been Created

### 1. Sitemap Generation Script
- **Location**: `scripts/generate-sitemap.js`
- **Usage**: `npm run generate:sitemap`
- Automatically generates `public/sitemap.xml` from your database

### 2. Open Graph Image Tools
- **HTML Generator**: `scripts/create-og-image.html` (preview tool)
- **SVG Placeholder**: `public/images/og-image.svg` (can be converted to JPG)
- **Documentation**: `docs/OG_IMAGE_GUIDE.md`

### 3. Documentation
- **Sitemap Guide**: `docs/SITEMAP_GENERATION.md`
- **OG Image Guide**: `docs/OG_IMAGE_GUIDE.md`

## 🚀 Quick Start

### Generate Sitemap

```bash
npm run generate:sitemap
```

This will:
1. Connect to your Supabase database
2. Fetch all active properties
3. Generate `public/sitemap.xml`

**Note**: Make sure your `.env.local` has:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SITE_URL` (optional, defaults to https://maxedhomes.com)

### Create OG Image

1. **Option A - Use SVG Placeholder**:
   - The file `public/images/og-image.svg` is already created
   - Convert it to JPG using an online tool or image editor
   - Save as `public/images/og-image.jpg`

2. **Option B - Use HTML Generator**:
   - Open `scripts/create-og-image.html` in your browser
   - Use browser DevTools to capture screenshot
   - Save as `public/images/og-image.jpg`

3. **Option C - Design Tool**:
   - Use Figma, Canva, or Photoshop
   - Create 1200x630px image
   - Save as `public/images/og-image.jpg`

## 📋 Next Steps

1. **Set SITE_URL** (if different from default):
   ```env
   # .env.local
   SITE_URL=https://yourdomain.com
   ```

2. **Generate Sitemap**:
   ```bash
   npm run generate:sitemap
   ```

3. **Create OG Image**:
   - Convert `og-image.svg` to JPG, OR
   - Create custom image using design tool
   - Save as `public/images/og-image.jpg`

4. **Test**:
   - Sitemap: Visit `https://yourdomain.com/sitemap.xml`
   - OG Image: Use Facebook Debugger or Twitter Card Validator

## 🔄 Automatic Sitemap Generation

The sitemap is automatically generated before each build:

```bash
npm run build
```

The `prebuild` script runs the sitemap generator automatically.

## 📚 Full Documentation

- **Sitemap**: See `docs/SITEMAP_GENERATION.md`
- **OG Image**: See `docs/OG_IMAGE_GUIDE.md`

## ⚠️ Important Notes

1. **OG Image**: The SEO component expects `public/images/og-image.jpg`
   - If missing, social shares won't show an image
   - Make sure to create this file before production

2. **Sitemap**: Update regularly when properties change
   - Run `npm run generate:sitemap` after adding/updating properties
   - Or set up automated generation (see docs)

3. **SITE_URL**: Update in `.env.local` for production
   - Default is `https://maxedhomes.com`
   - Change to your actual domain

## 🎨 OG Image Recommendations

- **Size**: 1200x630 pixels
- **Format**: JPG (smaller file size) or PNG
- **Content**: Include logo, tagline, and property imagery
- **File Size**: Keep under 1MB for fast loading

## 🔍 Testing

After setup, test your implementation:

1. **Sitemap**: 
   - Visit: `http://localhost:5173/sitemap.xml` (dev)
   - Or: `https://yourdomain.com/sitemap.xml` (production)

2. **OG Image**:
   - Facebook: https://developers.facebook.com/tools/debug/
   - Twitter: https://cards-dev.twitter.com/validator
   - LinkedIn: https://www.linkedin.com/post-inspector/

## 📝 Files Created

```
scripts/
  generate-sitemap.js          # Sitemap generator script
  create-og-image.html         # OG image preview tool

public/
  images/
    og-image.svg               # SVG placeholder (convert to JPG)
    og-image.jpg               # ← Create this file!

docs/
  SITEMAP_GENERATION.md        # Sitemap documentation
  OG_IMAGE_GUIDE.md            # OG image guide
```

## ✅ Checklist

- [x] Sitemap generation script created
- [x] OG image placeholder created
- [x] Documentation written
- [x] NPM scripts added
- [ ] Generate sitemap (`npm run generate:sitemap`)
- [ ] Create OG image (`public/images/og-image.jpg`)
- [ ] Set SITE_URL in `.env.local`
- [ ] Test sitemap accessibility
- [ ] Test OG image with social media validators

