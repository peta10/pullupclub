// Simple script to clear service worker and cache for testing
// Run this in browser console

(async function clearCache() {
  console.log('🧹 Clearing cache and service worker...');
  
  // Unregister service worker
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (let registration of registrations) {
      await registration.unregister();
      console.log('✅ Service worker unregistered');
    }
  }
  
  // Clear all caches
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    for (let cacheName of cacheNames) {
      await caches.delete(cacheName);
      console.log(`✅ Cache deleted: ${cacheName}`);
    }
  }
  
  // Clear localStorage
  localStorage.clear();
  console.log('✅ localStorage cleared');
  
  // Clear sessionStorage
  sessionStorage.clear();
  console.log('✅ sessionStorage cleared');
  
  console.log('🎉 All cache cleared! Please refresh the page.');
})();
