// Pull-Up Club Cache Management System
// Handles both traditional caching and new service worker cache management

export interface CacheInfo {
  name: string;
  size?: number;
  lastModified?: Date;
}

// Cache expiry constants
export const CACHE_EXPIRY = {
  badges: 24 * 60 * 60 * 1000, // 24 hours
  user_profile: 30 * 60 * 1000, // 30 minutes
  leaderboard: 5 * 60 * 1000, // 5 minutes
  submissions: 10 * 60 * 1000, // 10 minutes
};

// Cache keys
export const CACHE_KEYS = {
  leaderboard: 'leaderboard',
  user_profile: 'user_profile_',
  submissions: 'submissions_',
  badges: 'badges_',
};

// Main CacheManager class (compatible with existing usage)
class CacheManagerClass {
  private cache: Map<string, { data: any; expiry: number }> = new Map();

  async getCache(key: string): Promise<any> {
    try {
      // Check memory cache first
      const cached = this.cache.get(key);
      if (cached && cached.expiry > Date.now()) {
        return cached.data;
      }

      // Check localStorage as fallback
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.expiry > Date.now()) {
          // Restore to memory cache
          this.cache.set(key, parsed);
          return parsed.data;
        } else {
          // Expired, remove it
          localStorage.removeItem(key);
        }
      }

      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async setCache(key: string, data: any, ttl: number = 3600000): Promise<void> {
    try {
      const expiry = Date.now() + ttl;
      const cacheItem = { data, expiry };
      
      // Store in memory
      this.cache.set(key, cacheItem);
      
      // Store in localStorage
      localStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async clearAllCaches(): Promise<void> {
    try {
      // Clear memory cache
      this.cache.clear();
      
      // Clear localStorage cache items
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('leaderboard') ||
          key.startsWith('user_profile') ||
          key.startsWith('submissions') ||
          key.startsWith('badges')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log('✅ Traditional caches cleared');
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  async getCacheInfo(): Promise<{ size: number; keys: string[] }> {
    try {
      const keys = Array.from(this.cache.keys());
      const size = JSON.stringify(Array.from(this.cache.values())).length;
      return { size, keys };
    } catch (error) {
      console.error('Cache info error:', error);
      return { size: 0, keys: [] };
    }
  }
}

// Create singleton instance
const CacheManager = new CacheManagerClass();
export default CacheManager;

// Get all cache information (for service worker caches)
export async function getCacheInfo(): Promise<CacheInfo[]> {
  if (!('caches' in window)) {
    console.warn('Cache API not supported');
    return [];
  }

  try {
    const cacheNames = await caches.keys();
    return cacheNames.map(name => ({ name }));
  } catch (error) {
    console.error('Error getting cache info:', error);
    return [];
  }
}

// Emergency cache clearing - nuclear option
export async function emergencyCacheClear(): Promise<boolean> {
  console.log('🚨 EMERGENCY: Clearing ALL caches...');
  
  try {
    // 1. Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('✅ All caches cleared');
    }

    // 2. Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      console.log('✅ All service workers unregistered');
    }

    // 3. Clear local storage (if needed)
    try {
      localStorage.clear();
      sessionStorage.clear();
      console.log('✅ Storage cleared');
    } catch (e) {
      console.warn('Could not clear storage:', e);
    }

    // 4. Force hard reload
    console.log('🔄 Performing hard reload...');
    window.location.reload();
    
    return true;
    } catch (error) {
    console.error('❌ Emergency cache clear failed:', error);
    return false;
  }
}

// Check if we're on the latest version
export async function checkVersion(): Promise<{ isLatest: boolean; currentVersion?: string; latestVersion?: string }> {
  try {
    const response = await fetch('/api/version', { 
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (!response.ok) {
      throw new Error('Version check failed');
    }
    
    const versionInfo = await response.json();
    const currentBuildTime = process.env.NEXT_PUBLIC_BUILD_TIME;
    
    return {
      isLatest: versionInfo.buildTime === currentBuildTime,
      currentVersion: currentBuildTime,
      latestVersion: versionInfo.buildTime
    };
    } catch (error) {
    console.error('Version check failed:', error);
    return { isLatest: true }; // Assume latest if check fails
  }
}

// Force update if available
export async function forceUpdate(): Promise<void> {
  console.log('🔄 Forcing update...');
  
  // Clear caches first
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
  }
  
  // Send message to service worker to skip waiting
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  }
  
  // Force reload
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// Add global access for debugging (development only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).pullupClubCache = {
    getCacheInfo,
    emergencyCacheClear,
    checkVersion,
    forceUpdate
  };
  
  console.log('🔧 Pull-Up Club cache utilities available at window.pullupClubCache');
}