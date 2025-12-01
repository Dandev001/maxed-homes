/**
 * Sitemap Generator Script
 * 
 * This script generates a sitemap.xml file from your Supabase database.
 * It fetches all active properties and includes them in the sitemap.
 * 
 * Usage:
 *   node scripts/generate-sitemap.js
 * 
 * Environment Variables Required:
 *   VITE_SUPABASE_URL - Your Supabase project URL
 *   VITE_SUPABASE_ANON_KEY - Your Supabase anonymous key
 *   SITE_URL - Your website URL (defaults to https://maxedhomes.com)
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get configuration from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const siteUrl = process.env.SITE_URL || 'https://maxedhomes.com';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing required environment variables');
  console.error('   Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  console.error('   You can set them in .env.local or .env file');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Format date to ISO 8601 format (YYYY-MM-DD)
 */
function formatDate(date) {
  if (!date) return new Date().toISOString().split('T')[0];
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Generate sitemap XML
 */
function generateSitemap(properties) {
  const today = formatDate(new Date());
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  
  <!-- Homepage -->
  <url>
    <loc>${escapeXml(siteUrl)}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Properties Listing -->
  <url>
    <loc>${escapeXml(siteUrl)}/properties</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <!-- About Page -->
  <url>
    <loc>${escapeXml(siteUrl)}/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <!-- Contact Page -->
  <url>
    <loc>${escapeXml(siteUrl)}/contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <!-- Property Pages -->
`;

  // Add property URLs
  properties.forEach(property => {
    const propertyUrl = `${siteUrl}/properties/${property.id}`;
    const lastmod = formatDate(property.updated_at || property.created_at);
    
    xml += `  <url>
    <loc>${escapeXml(propertyUrl)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  });

  xml += `</urlset>
`;

  return xml;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Generating sitemap...');
  console.log(`   Site URL: ${siteUrl}`);
  console.log(`   Supabase URL: ${supabaseUrl}`);
  
  try {
    // Fetch all active properties
    console.log('\n📡 Fetching properties from database...');
    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, updated_at, created_at')
      .eq('status', 'active')
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!properties || properties.length === 0) {
      console.warn('⚠️  Warning: No active properties found in database');
    } else {
      console.log(`   ✅ Found ${properties.length} active properties`);
    }

    // Generate sitemap XML
    console.log('\n📝 Generating sitemap.xml...');
    const sitemapXml = generateSitemap(properties || []);

    // Write to file
    const outputPath = join(__dirname, '..', 'public', 'sitemap.xml');
    writeFileSync(outputPath, sitemapXml, 'utf8');

    console.log(`\n✅ Sitemap generated successfully!`);
    console.log(`   Location: ${outputPath}`);
    console.log(`   Total URLs: ${4 + (properties?.length || 0)}`);
    console.log(`   - 4 static pages`);
    console.log(`   - ${properties?.length || 0} property pages`);
    
  } catch (error) {
    console.error('\n❌ Error generating sitemap:');
    console.error(error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
    process.exit(1);
  }
}

// Run the script
main();

