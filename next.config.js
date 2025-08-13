/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force dynamic rendering for Pull-Up Club
  reactStrictMode: true,
  
  // Generate unique build ID for each deployment to force cache invalidation
  generateBuildId: async () => {
    // Use timestamp + random to ensure every deployment is unique
    return `${new Date().getTime()}-${Math.random().toString(36).substring(2, 9)}`;
  },
  
  // Disable build caching in development for stability
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  
  // Ensure environment variables are properly exposed to client
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID,
    NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID,
    // Add build timestamp for client-side version checking
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  

  
  // Basic image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pullupclub.com',
      },
      {
        protocol: 'https',
        hostname: 'supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      }
    ],
  },
  
  // Aggressive cache control headers for version management
  async headers() {
    return [
      // Service Worker - never cache, always fresh
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      
      // Main pages - no caching to ensure fresh content
      {
        source: '/((?!_next/static|api).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      
      // API routes - never cache
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, max-age=0',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
      
      // Static Next.js assets - cache with unique hashes
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      
      // General security headers
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-inline' https://www.youtube.com https://js.stripe.com https://va.vercel-scripts.com https://www.googletagmanager.com https://connect.facebook.net https://www.chatbase.co; frame-src 'self' https://www.youtube.com https://js.stripe.com https://player.vimeo.com https://www.chatbase.co https://www.facebook.com;",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Webpack configuration for better compatibility
  webpack: (config, { isServer }) => {
    // Handle potential module resolution issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
}