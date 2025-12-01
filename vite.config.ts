import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Bundle analyzer - run with ANALYZE=true npm run build
    process.env.ANALYZE === 'true' && visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  assetsInclude: ['**/*.jpg'],
  resolve: {
    alias: {
      '@': '/src'
    },
    // Ensure proper handling of Leaflet's CommonJS exports
    dedupe: ['leaflet', 'react-leaflet'],
  },
  build: {
    // Target modern browsers for smaller bundle size
    target: 'esnext',
    // Minification
    minify: 'esbuild', // Faster than terser, good compression
    // Source maps for production debugging (optional, can disable for smaller builds)
    sourcemap: false,
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Rollup options for code splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting strategy
        manualChunks: (id) => {
          // Vendor chunks - separate large dependencies
          
          // React core
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          
          // Router
          if (id.includes('node_modules/react-router')) {
            return 'router-vendor';
          }
          
          // Supabase
          if (id.includes('node_modules/@supabase')) {
            return 'supabase-vendor';
          }
          
          // Animation libraries (large, used conditionally)
          if (id.includes('node_modules/gsap')) {
            return 'gsap-vendor';
          }
          
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-motion-vendor';
          }
          
          // Maps (large, only used in specific pages)
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) {
            return 'leaflet-vendor';
          }
          
          // UI libraries
          if (id.includes('node_modules/lucide-react') || 
              id.includes('node_modules/react-icons') ||
              id.includes('node_modules/@heroicons')) {
            return 'icons-vendor';
          }
          
          // Carousel
          if (id.includes('node_modules/embla-carousel')) {
            return 'carousel-vendor';
          }
          
          // Other node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    // CSS code splitting
    cssCodeSplit: true,
    // Optimize asset inlining threshold (4kb default)
    assetsInlineLimit: 4096,
    // Report compressed size
    reportCompressedSize: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      // Include Leaflet for proper ES module handling
      // It will still be code-split since pages using it are lazy-loaded
      'leaflet',
      'react-leaflet',
    ],
  },
})
