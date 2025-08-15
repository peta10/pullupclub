// Enhanced Service Worker Registration for Pull-Up Club Cache Management
const isLocalhost = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
  );
};

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
};

export function register(config?: Config) {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return; // Skip on server side
  }
  
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL('/', window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = '/sw.js';

      // Always register service worker, even on localhost, to handle cache cleanup
      console.log('🔧 Pull-Up Club: Registering service worker for cache management...');
      registerValidSW(swUrl, config);
    });
  }
}

function registerValidSW(swUrl: string, config?: Config) {
  navigator.serviceWorker
    .register(swUrl, { 
      updateViaCache: 'none', // Never cache the service worker file itself
      scope: '/' 
    })
    .then((registration) => {
      console.log('🎉 Pull-Up Club SW registered:', registration.scope);
      
      // Force immediate update check
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) return;

        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New SW available - force activation and refresh
              console.log('🔄 New version detected, updating...');
              installingWorker.postMessage({ type: 'SKIP_WAITING' });
              
              if (config?.onUpdate) {
                config.onUpdate(registration);
              }
              
              // Show update notification and auto-refresh after 3 seconds
              showUpdateNotification();
              setTimeout(() => {
                console.log('🔄 Auto-refreshing for new version...');
                window.location.reload();
              }, 3000);
              
            } else {
              // First time install
              console.log('✅ Content cached for offline use');
              if (config?.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        });
      });

      // Check for updates every 30 seconds when tab is active
      setInterval(() => {
        if (document.visibilityState === 'visible') {
          registration.update();
        }
      }, 30000);

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'CACHE_CLEANED') {
          console.log('🎉 Cache cleaned, refreshing for latest version');
          setTimeout(() => window.location.reload(), 1000);
        }
      });

    })
    .catch((error) => {
      console.error('❌ SW registration failed:', error);
    });
}

function checkValidServiceWorker(swUrl: string, config?: Config) {
  // Check if the service worker can be found. If it can't reload the page.
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found. Probably a different app. Reload the page.
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            // Don't auto-reload - let user decide
            console.log('Service worker not found, but not forcing reload');
          });
        });
      } else {
        // Service worker found. Proceed as normal.
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('No internet connection found. App is running in offline mode.');
    });
}

// Force clear all caches and reload - nuclear option
export function forceUpdate(): void {
  if (typeof window === 'undefined') return;
  
  const reloadPage = () => {
    console.log('🔄 Force update complete, reloading...');
    window.location.reload();
  };

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then(registrations => {
        // Unregister all service workers
        return Promise.all(
          registrations.map(registration => registration.unregister())
        );
      })
      .then((_results: boolean[]) => {
        // Clear all caches if available
        if ('caches' in window) {
          return caches.keys().then(cacheNames => {
            return Promise.all(
              cacheNames.map(cacheName => caches.delete(cacheName))
            );
          }).then(() => {
            // Explicitly return void
            return;
          });
        }
        return Promise.resolve();
      })
      .then(() => {
        reloadPage();
      })
      .catch(() => {
        // If anything fails, still reload
        reloadPage();
      });
  } else {
    // No service worker support, just reload
    reloadPage();
  }
}

export function unregister() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
        console.log('🗑️ Service worker unregistered');
      })
      .catch((error) => {
        console.error('❌ SW unregister error:', error.message);
      });
  }
}

function showUpdateNotification() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  
  // Create a simple notification
  const notification = document.createElement('div');
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      max-width: 300px;
    ">
      <div style="font-weight: 600; margin-bottom: 8px;">
        🎉 New version available!
      </div>
      <div style="margin-bottom: 12px; opacity: 0.9;">
        Pull-Up Club has been updated. Refreshing in 3 seconds...
      </div>
      <button onclick="window.location.reload()" style="
        background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        margin-right: 8px;
      ">
        Refresh Now
      </button>
      <button onclick="this.closest('div').remove()" style="
        background: transparent;
        border: none;
        color: rgba(255,255,255,0.7);
        cursor: pointer;
        font-size: 12px;
        text-decoration: underline;
      ">
        Dismiss
      </button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 10000);
} 