// API route to check current deployment version for cache management
export default function handler(req, res) {
  // Prevent any caching of this endpoint
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Return current build information
  res.status(200).json({
    buildId: process.env.BUILD_ID || `build-${new Date().getTime()}`,
    buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
    timestamp: new Date().toISOString(),
    version: '2.0.0-nextjs', // Update this with each major release
    framework: 'Next.js 15',
    environment: process.env.NODE_ENV || 'production',
    deployment: 'vercel',
    cacheStrategy: 'aggressive-invalidation'
  });
}