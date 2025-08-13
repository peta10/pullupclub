// Enhanced Service Worker for Pull-Up Club Vite→Next.js Migration Cache Management
const CACHE_NAME = 'pullup-club-nextjs'
const BUILD_ID = self.location.search.includes('buildId=') ? 
  new URLSearchParams(self.location.search).get('buildId') : Date.now().toString()

// Old cache patterns from Vite to clean up
const OLD_CACHE_PATTERNS = [
  'pullup-club-v1',
  'workbox-precache-',
  'workbox-runtime-',
  'vite-',
  'sw-precache-',
  'runtime-cache',
  'precache-manifest',
  'sw-precache'
]

console.log('[SW] Pull-Up Club Service Worker initialized with BUILD_ID:', BUILD_ID)
console.log('[SW] Ready to clean up old Vite caches and manage Next.js cache')

// Assets to cache - essential pages and resources
const STATIC_ASSETS = [
  '/',
  '/login',
  '/leaderboard',
  '/manifest.json'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker with BUILD_ID:', BUILD_ID)
  event.waitUntil(
    caches.open(CACHE_NAME + '-' + BUILD_ID).then(async (cache) => {
      console.log('[SW] Caching static assets')
      
      // Cache essential assets one by one to prevent failures
      const cachePromises = STATIC_ASSETS.map(async (asset) => {
        try {
          await cache.add(asset)
          console.log('[SW] Successfully cached:', asset)
        } catch (error) {
          console.warn('[SW] Failed to cache asset:', asset, error.message)
          // Don't throw - continue with other assets
        }
      })
      
      await Promise.allSettled(cachePromises)
      console.log('[SW] Asset caching completed')
      
    }).then(() => {
      console.log('[SW] Skipping waiting to activate immediately')
      return self.skipWaiting()
    }).catch(err => {
      console.error('[SW] Install failed:', err)
    })
  )
})

// Activate event - aggressive cleanup of ALL old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Pull-Up Club service worker for cache cleanup...')
  event.waitUntil(
    Promise.all([
      // Aggressive cleanup of all old caches (Vite + old Next.js)
      clearAllOldCaches(),
      // Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] ✅ Pull-Up Club service worker activated successfully')
      
      // Notify all clients that cache has been cleaned
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'CACHE_CLEANED',
            message: 'Old caches cleared, you have the latest version'
          });
        });
      });
    }).catch(err => {
      console.error('[SW] ❌ Activation failed:', err)
    })
  )
})

// Function to aggressively clear all old cache entries
async function clearAllOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const currentCache = CACHE_NAME + '-' + BUILD_ID;
    
    // Identify old caches to delete
    const oldCaches = cacheNames.filter(name => {
      // Delete if it matches old patterns OR is an old Pull-Up Club cache
      return OLD_CACHE_PATTERNS.some(pattern => name.includes(pattern)) ||
             (name.startsWith(CACHE_NAME) && name !== currentCache) ||
             (name.startsWith('pullup-club') && name !== currentCache);
    });
    
    console.log('[SW] 🗑️ Clearing old caches:', oldCaches);
    
    // Delete all identified old caches
    await Promise.all(oldCaches.map(cacheName => caches.delete(cacheName)));
    
    console.log('[SW] ✅ All old caches cleared successfully');
    return true;
  } catch (error) {
    console.error('[SW] ❌ Error clearing old caches:', error);
    return false;
  }
}

// Fetch event - handle network requests with intelligent caching
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip external requests
  if (!url.origin.includes(self.location.origin)) return

  // Skip API routes, Next.js internals, and dynamic content
  if (url.pathname.startsWith('/api/') || 
      url.pathname.startsWith('/_next/webpack-hmr') ||
      url.pathname.includes('.json') ||
      url.pathname.startsWith('/auth/callback') ||
      url.pathname.includes('hot-update') ||
      url.pathname.includes('_next/static/css') ||
      url.pathname.includes('_next/static/chunks')) {
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // For HTML pages, use stale-while-revalidate strategy
      if (request.destination === 'document') {
        // If we have cached content, serve it immediately
        if (cachedResponse) {
          // Serve cached content instantly
          const serveCache = () => cachedResponse
          
          // Update cache in background (don't await this)
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
          
          fetch(request, { 
            cache: 'no-cache',
            signal: controller.signal
          }).then((response) => {
            clearTimeout(timeoutId)
            if (response.ok && response.status === 200) {
              const responseClone = response.clone()
              caches.open(CACHE_NAME + '-' + BUILD_ID).then((cache) => {
                cache.put(request, responseClone)
                console.log('[SW] Background cache update completed for:', request.url)
              })
            }
          }).catch((error) => {
            clearTimeout(timeoutId)
            console.log('[SW] Background update failed (this is OK):', error.message)
          })
          
          // Return cached content immediately
          return serveCache()
        }
        
        // No cache available, try network with fast timeout
        return Promise.race([
          fetch(request).then((response) => {
            if (response.ok && response.status === 200) {
              const responseClone = response.clone()
              caches.open(CACHE_NAME + '-' + BUILD_ID).then((cache) => {
                cache.put(request, responseClone)
              })
            }
            return response
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Network timeout')), 3000)
          )
        ]).catch(() => {
          // Network failed and no cache, return basic offline page
          return new Response(
            '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your connection and try again.</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          )
        })
      }

      // For static assets, use cache-first strategy
      if (cachedResponse) {
        return cachedResponse
      }

      // Fetch from network and cache successful responses
      return fetch(request).then((response) => {
        // Only cache successful responses
        if (response.ok && response.status === 200) {
          // Clone response before caching
          const responseClone = response.clone()
          caches.open(CACHE_NAME + '-' + BUILD_ID).then((cache) => {
            cache.put(request, responseClone)
          }).catch(err => {
            console.warn('[SW] Failed to cache response:', err)
          })
        }
        // Don't cache 404s to prevent refresh loops
        if (response.status === 404) {
          console.log('[SW] 404 detected, not caching:', request.url)
          return response
        }
        return response
      }).catch(() => {
        // Network failed and no cache available
        if (request.destination === 'document') {
          // Try to return cached homepage as fallback
          return caches.match('/').then(fallback => {
            if (fallback) return fallback
            // Return a basic offline page
            return new Response(
              '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your connection and try again.</p></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            )
          })
        }
        throw new Error('Network failed and no cache available')
      })
    }).catch(err => {
      console.error('[SW] Fetch error:', err)
      // Return basic error response
      return new Response('Service unavailable', { status: 503 })
    })
  )
})

// Message event - handle commands from main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Received message:', event.data)
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        console.log('[SW] Received SKIP_WAITING command')
        self.skipWaiting()
        break
      case 'CLEAR_CACHE':
        console.log('[SW] Received CLEAR_CACHE command')
        event.waitUntil(clearAllCaches())
        break
      case 'CHECK_UPDATE':
        console.log('[SW] Received CHECK_UPDATE command')
        checkForUpdates()
        break
      case 'FORCE_RELOAD':
        console.log('[SW] Received FORCE_RELOAD command')
        event.waitUntil(forceReload())
        break
      case 'CLIENT_VISIBLE':
        console.log('[SW] Client became visible, checking for updates...')
        checkForUpdates()
        break
    }
  }
})

// Clear all caches function
async function clearAllCaches() {
  console.log('[SW] Clearing all caches...')
  try {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map(name => caches.delete(name)))
    console.log('[SW] All caches cleared successfully')
    
    // Notify all clients
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({ 
        type: 'CACHE_CLEARED',
        message: 'All caches have been cleared'
      })
    })
  } catch (error) {
    console.error('[SW] Failed to clear caches:', error)
  }
}

// Force reload all clients (useful for critical updates)
async function forceReload() {
  console.log('[SW] Force reloading all clients...')
  try {
    await clearAllCaches()
    
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({ 
        type: 'FORCE_RELOAD',
        message: 'Forcing reload due to critical update'
      })
    })
  } catch (error) {
    console.error('[SW] Force reload failed:', error)
  }
}

// Check for Vercel deployment updates - DISABLED to prevent refresh loops
async function checkForUpdates() {
  try {
    console.log('[SW] Update check requested but disabled to prevent refresh loops')
    
    // Check if there's a waiting service worker
    if (self.registration && self.registration.waiting) {
      console.log('[SW] New service worker waiting to activate')
      // Don't auto-notify - let user manually refresh if needed
      return
    }
    
    // Skip network-based update checks to prevent 404s and refresh loops
    console.log('[SW] No updates detected')
  } catch (error) {
    console.warn('[SW] Update check failed:', error)
  }
}

// Helper function to notify clients of updates - DISABLED
async function notifyUpdate(message) {
  console.log('[SW] Update notification disabled to prevent refresh loops:', message)
  
  // Don't clear caches or notify clients automatically
  // Let users manually refresh if needed
}

// DISABLE periodic update check to prevent refresh loops
// let updateCheckInterval
// if (typeof setInterval !== 'undefined') {
//   updateCheckInterval = setInterval(() => {
//     checkForUpdates()
//   }, 300000) // 5 minutes
// }

// Handle chunk load errors by clearing cache
self.addEventListener('error', (event) => {
  console.log('[SW] Error detected:', event.error)
  if (event.error && event.error.message && 
      (event.error.message.includes('ChunkLoadError') || 
       event.error.message.includes('Loading chunk'))) {
    console.log('[SW] ChunkLoadError detected, clearing cache...')
    clearAllCaches()
  }
})

// Cleanup on service worker termination
self.addEventListener('beforeunload', () => {
  // if (updateCheckInterval) {
  //   clearInterval(updateCheckInterval)
  // }
})

console.log('[SW] Service Worker setup complete - update checks disabled')
