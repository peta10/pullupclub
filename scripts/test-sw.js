// Test script for service worker functionality
// Run this in browser console to test service worker commands

console.log('🧪 Service Worker Test Script');

// Check if service worker is registered
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('📋 Current service worker registrations:', registrations.length);
    
    registrations.forEach((registration, index) => {
      console.log(`🔧 Registration ${index + 1}:`, {
        scope: registration.scope,
        state: registration.active?.state,
        scriptURL: registration.active?.scriptURL
      });
    });

    if (registrations.length > 0) {
      const sw = registrations[0];
      
      // Test cache clearing
      window.testClearCache = () => {
        console.log('🗑️ Testing cache clear...');
        if (sw.active) {
          sw.active.postMessage({ type: 'CLEAR_CACHE' });
        } else {
          console.log('❌ No active service worker found');
        }
      };

      // Test update check
      window.testUpdateCheck = () => {
        console.log('🔄 Testing update check...');
        if (sw.active) {
          sw.active.postMessage({ type: 'CHECK_UPDATE' });
        } else {
          console.log('❌ No active service worker found');
        }
      };

      // Test force reload
      window.testForceReload = () => {
        console.log('🔄 Testing force reload...');
        if (sw.active) {
          sw.active.postMessage({ type: 'FORCE_RELOAD' });
        } else {
          console.log('❌ No active service worker found');
        }
      };

      console.log('✅ Test functions available:');
      console.log('  - testClearCache()');
      console.log('  - testUpdateCheck()');
      console.log('  - testForceReload()');
    } else {
      console.log('❌ No service worker registered');
      console.log('🔧 This is expected in development mode');
    }
  });

  // Listen for service worker messages
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('📨 Received message from service worker:', event.data);
  });
} else {
  console.log('❌ Service workers not supported in this browser');
}

// Check cache storage
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    console.log('💾 Current cache storage:', cacheNames);
    
    window.listCaches = async () => {
      const names = await caches.keys();
      console.log('📦 Cache names:', names);
      
      for (const name of names) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        console.log(`  ${name}: ${keys.length} entries`);
        keys.forEach(request => {
          console.log(`    - ${request.url}`);
        });
      }
    };

    window.clearAllCaches = async () => {
      const names = await caches.keys();
      await Promise.all(names.map(name => caches.delete(name)));
      console.log('🗑️ All caches cleared manually');
    };

    console.log('✅ Cache functions available:');
    console.log('  - listCaches()');
    console.log('  - clearAllCaches()');
  });
}

console.log('🎯 Service worker test setup complete!');
