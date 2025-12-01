# Open Graph Image Guide

## Overview

Open Graph (OG) images are displayed when your website is shared on social media platforms like Facebook, Twitter, LinkedIn, etc. They help make your links more attractive and increase click-through rates.

## Image Requirements

- **Size**: 1200x630 pixels (recommended)
- **Format**: JPG or PNG
- **File Size**: Under 1MB (recommended)
- **Location**: `public/images/og-image.jpg`

## Creating Your OG Image

### Option 1: Use the HTML Generator

1. Open `scripts/create-og-image.html` in your browser
2. Right-click on the preview and use browser DevTools to capture a screenshot
3. Save as `og-image.jpg` in `public/images/` folder

### Option 2: Use a Design Tool

Recommended tools:
- **Figma** (free) - https://www.figma.com
- **Canva** (free) - https://www.canva.com
- **Photoshop** (paid)
- **GIMP** (free) - https://www.gimp.org

**Design Tips:**
- Include your logo/branding
- Use high-quality property photos
- Keep text minimal and readable
- Use your brand colors
- Ensure text is readable on both light and dark backgrounds

### Option 3: Use an Online Generator

- **OG Image Generator** - https://www.opengraph.xyz
- **Social Share Preview** - https://socialsharepreview.com

## Current Setup

The SEO component is already configured to use `/images/og-image.jpg` as the default OG image. If you want to use a different image for specific pages, you can pass the `image` prop to the SEO component:

```tsx
<SEO
  title="Property Title"
  image="/images/custom-og-image.jpg"  // Custom image
  url="/properties/123"
/>
```

## Testing Your OG Image

After creating your OG image, test it using these tools:

1. **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
2. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
3. **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/

## Dynamic OG Images (Advanced)

For more advanced use cases, you can create dynamic OG images using:
- **Vercel OG Image Generation** - https://vercel.com/docs/concepts/functions/edge-functions/og-image-generation
- **Cloudinary** - https://cloudinary.com
- **Custom API endpoint** that generates images on-the-fly

## Example OG Image Content

Your OG image should include:
- **Logo**: Maxed Homes logo
- **Tagline**: "Find Your Perfect Home"
- **Visual**: High-quality property photo or brand imagery
- **Call to Action**: Subtle text encouraging clicks

## File Structure

```
public/
  images/
    og-image.jpg          # Default OG image (1200x630px)
    og-image.png          # Alternative format
```

## Notes

- The OG image is referenced in `src/components/SEO.tsx`
- Default path: `/images/og-image.jpg`
- Make sure the file exists before deploying to production
- Update the image periodically to keep it fresh

