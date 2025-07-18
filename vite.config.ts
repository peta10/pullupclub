import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  const buildTimestamp = Date.now().toString();
  const gitCommitSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.VITE_VERCEL_GIT_COMMIT_SHA || 'dev-' + buildTimestamp;
  const appVersion = gitCommitSha.substring(0, 8);
  
  return {
    plugins: [
      react({
        // Add the JSX runtime config
        jsxRuntime: 'automatic',
        jsxImportSource: 'react',
      }),
    ],
    optimizeDeps: {
      exclude: ['lucide-react'],
      include: ['react', 'react-dom', '@supabase/supabase-js'],
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      minify: 'terser',
      target: 'es2020',
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            supabase: ['@supabase/supabase-js'],
            ui: ['lucide-react'],
          },
        },
      },
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
        },
      },
    },
    // Add resolve configuration for TypeScript extensions
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    // Performance optimizations
    server: {
      headers: {
        // Temporarily disable COEP to allow YouTube embeds
        // 'Cross-Origin-Embedder-Policy': 'credentialless',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
    // Preview server headers for security
    preview: {
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://r.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: https://i.ytimg.com https://img.youtube.com https://i.vimeocdn.com; connect-src 'self' https://*.supabase.co https://api.stripe.com https://r.stripe.com; frame-src https://js.stripe.com https://www.youtube.com https://youtube.com https://player.vimeo.com; font-src 'self' data:;",
      },
    },
    // Make all environment variables available to the client
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || 'https://yqnikgupiaghgjtsaypr.supabase.co'),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxbmlrZ3VwaWFnaGdqdHNheXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NDIzMDMsImV4cCI6MjA2MzUxODMwM30.3rR9EyNlWSLZAoYqlCa3MOJobHH7RHjak0m_3mI6YZs'),
      'import.meta.env.VITE_GA_MEASUREMENT_ID': JSON.stringify(env.VITE_GA_MEASUREMENT_ID || 'G-PLACEHOLDER'),
      'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_live_51RLYUyGaHiDfsUfBuCJ8wlW6vrQA50vyhiBi5v3lnfm3byAQpYzkqqX1ElIYEb0Alxi4IXFR2ozxmMlRKSdOKNTH00mdn1920o'),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
      'import.meta.env.VITE_BUILD_TIMESTAMP': JSON.stringify(buildTimestamp),
      'import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA': JSON.stringify(gitCommitSha),
    },
  };
});