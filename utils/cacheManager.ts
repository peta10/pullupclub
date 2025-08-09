import localforage from 'localforage';

// Initialize localforage only on client side
let isLocalForageReady = false;

if (typeof window !== 'undefined') {
  try {
    localforage.config({
      name: 'PullUpClub',
      storeName: 'cache',
      description: 'Pull-Up Club performance cache',
      size: 10 * 1024 * 1024, // 10MB storage limit
      version: 1.0,
      driver: [
        localforage.INDEXEDDB,
        localforage.WEBSQL,
        localforage.LOCALSTORAGE,
      ],
    });
    isLocalForageReady = true;
  } catch (error) {
    console.warn('LocalForage initialization failed:', error);
    isLocalForageReady = false;
  }
}

// Memory cache for ultra-fast access to frequently used data
const memoryCache = new Map<string, { data: any; expiry: number }>();

// Cache keys
export const CACHE_KEYS = {
  leaderboard: 'leaderboard_data',
  user_profile: 'user_profile_', // append userId
  submissions: 'submissions_data',
  badges: 'badges_data',
  app_version: 'app_version',
  auth: 'auth_', // append 'session' or other auth-related suffixes
  subscription: 'subscription_', // append userId
};

// Cache expiry times (in ms)
export const CACHE_EXPIRY = {
  leaderboard: 5 * 60 * 1000, // 5 minutes
  user_profile: 15 * 60 * 1000, // 15 minutes
  submissions: 5 * 60 * 1000, // 5 minutes
  badges: 30 * 60 * 1000, // 30 minutes
  app_version: 24 * 60 * 60 * 1000, // 24 hours
  auth: 60 * 60 * 1000, // 1 hour
  critical: 30 * 60 * 1000, // 30 minutes
};

class CacheManager {
  async setCache(key: string, data: any, customExpiry?: number): Promise<void> {
    try {
      const expiry = Date.now() + (customExpiry || CACHE_EXPIRY.leaderboard);
      const cacheItem = { data, expiry };

      // Store in memory cache
      memoryCache.set(key, cacheItem);

      // Store in persistent storage only if LocalForage is ready
      if (isLocalForageReady) {
        await localforage.setItem(key, cacheItem);
      }

      // Clean up old memory cache entries
      this.cleanMemoryCache();
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async getCache(key: string): Promise<any | null> {
    try {
      // Check memory cache first
      const memItem = memoryCache.get(key);
      if (memItem) {
        if (Date.now() <= memItem.expiry) {
          return memItem.data;
        }
        memoryCache.delete(key);
      }

      // Check persistent storage only if LocalForage is ready
      if (isLocalForageReady) {
        const item = await localforage.getItem<{ data: any; expiry: number }>(key);
        if (!item) return null;

        if (typeof item !== 'object' || !('expiry' in item)) {
          await this.clearCache(key);
          return null;
        }

        if (Date.now() > item.expiry) {
          await this.clearCache(key);
          return null;
        }

        // Update memory cache with persistent data
        memoryCache.set(key, item);
        return item.data;
      }
      
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  private cleanMemoryCache(): void {
    const now = Date.now();
    for (const [key, item] of memoryCache.entries()) {
      if (now > item.expiry) {
        memoryCache.delete(key);
      }
    }
  }

  async clearCache(key: string): Promise<void> {
    try {
      memoryCache.delete(key);
      if (isLocalForageReady) {
        await localforage.removeItem(key);
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  async clearAllCaches(): Promise<void> {
    try {
      memoryCache.clear();
      if (isLocalForageReady) {
        await localforage.clear();
      }
    } catch (error) {
      console.error('Cache clearAll error:', error);
    }
  }

  async prefetchData(key: string, fetchFn: () => Promise<any>, expiry?: number): Promise<any> {
    try {
      // Check cache first
      const cached = await this.getCache(key);
      if (cached) return cached;

      // Fetch and cache
      const data = await fetchFn();
      await this.setCache(key, data, expiry);
      return data;
    } catch (error) {
      console.error('Prefetch error:', error);
      return null;
    }
  }

  async warmCache(keys: string[]): Promise<void> {
    try {
      if (!isLocalForageReady) {
        console.log('LocalForage not ready, skipping cache warming');
        return;
      }
      
      const items = await Promise.all(
        keys.map(async (key) => ({
          key,
          value: await localforage.getItem(key)
        }))
      );

      // Populate memory cache with valid items
      items.forEach(({ key, value }) => {
        if (value && typeof value === 'object' && 'expiry' in value && 'data' in value) {
          const typedValue = value as { data: any; expiry: number };
          if (typeof typedValue.expiry === 'number' && Date.now() <= typedValue.expiry) {
            memoryCache.set(key, typedValue);
          }
        }
      });
    } catch (error) {
      console.error('Cache warming error:', error);
    }
  }

  async getCacheInfo(): Promise<{ size: number; keys: string[] }> {
    try {
      const keys = await localforage.keys();
      let size = 0;
      for (const key of keys) {
        const value = await localforage.getItem(key);
        if (value) {
          try {
            size += JSON.stringify(value).length;
          } catch {
            // ignore size error
          }
        }
      }
      return { size, keys };
    } catch (error) {
      console.log('Cache info error:', error);
      return { size: 0, keys: [] };
    }
  }
}

export default new CacheManager(); 