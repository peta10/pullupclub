import { useQuery } from '@tanstack/react-query';
import CacheManager, { CACHE_KEYS, CACHE_EXPIRY } from '../utils/cacheManager';
import { supabase } from '../lib/supabase';
import { LeaderboardFilters, Submission, Profile } from '../types';

// Query config
const queryConfig = {
  leaderboard: {
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  },
  submissions: {
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  },
  profile: {
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  },
};

function hashFilters(filters: LeaderboardFilters): string {
  return btoa(JSON.stringify(filters || {}));
}

export function useLeaderboardWithCache(filters: LeaderboardFilters = {}) {
  const cacheKey = `${CACHE_KEYS.leaderboard}_${hashFilters(filters)}`;

  return useQuery<Submission[]>({
    queryKey: ['leaderboard', filters],
    queryFn: async () => {
      try {
        // Try memory cache first via CacheManager
        const cached = await CacheManager.getCache(cacheKey);
        if (cached) {
          console.log('Leaderboard cache hit', cacheKey);
          return cached;
        }

        // Query Supabase with optimized materialized view
        const { data, error } = await supabase
          .from('leaderboard_cache')
          .select('*')
          .order('leaderboard_position', { ascending: true });

        if (error) {
          console.error('Supabase leaderboard query error:', error);
          throw new Error(`Failed to fetch leaderboard: ${error.message}`);
        }

        if (!data) {
          console.warn('No leaderboard data returned');
          return [];
        }

        let filtered = data || [];
        
        // Apply filters efficiently using Set for lookups
        if (filters.region || filters.gender || filters.club || filters.ageGroup || filters.badge) {
          const filterSets = {
            region: filters.region ? new Set([filters.region]) : null,
            gender: filters.gender ? new Set([filters.gender]) : null,
            club: filters.club ? new Set([filters.club]) : null,
            ageGroup: filters.ageGroup ? new Set([filters.ageGroup]) : null,
            badge: filters.badge ? new Set([filters.badge]) : null,
          };

          filtered = filtered.filter((x: any) => (
            (!filterSets.region || filterSets.region.has(x.region)) &&
            (!filterSets.gender || filterSets.gender.has(x.gender)) &&
            (!filterSets.club || filterSets.club.has(x.club_affiliation)) &&
            (!filterSets.ageGroup || filterSets.ageGroup.has(x.ageGroup)) &&
            (!filterSets.badge || (x.badges && x.badges.some((b: string) => filterSets.badge!.has(b))))
          ));
        }

        // Cache the filtered results
        await CacheManager.setCache(cacheKey, filtered, CACHE_EXPIRY.leaderboard);
        return filtered;
      } catch (err) {
        console.error('Leaderboard query/cache error', err);
        return [];
      }
    },
    ...queryConfig.leaderboard,
    // Add placeholderData for instant loading states
    placeholderData: () => {
      // Return empty array with correct shape for skeleton loading
      return Array(10).fill({
        id: '',
        user_id: '',
        full_name: '',
        region: '',
        gender: '',
        club_affiliation: '',
        badges: [],
        leaderboard_position: 0,
        total_points: 0,
      });
    },
  });
}

export function useUserProfileWithCache(userId: string) {
  const cacheKey = `${CACHE_KEYS.user_profile}${userId}`;

  return useQuery<Profile | null>({
    queryKey: ['user_profile', userId],
    queryFn: async () => {
      try {
        // Try memory cache first
        const cached = await CacheManager.getCache(cacheKey);
        if (cached) {
          console.log('User profile cache hit', cacheKey);
          return cached;
        }

        // Query profile with optimized select
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            user_id,
            email,
            full_name,
            social_media,
            age,
            gender,
            organization,
            region,
            phone,
            club,
            stripe_customer_id,
            is_paid,
            role,
            badges,
            created_at,
            updated_at,
            is_profile_completed,
            notification_preferences,
            theme_preferences,
            privacy_settings,
            user_settings
          `)
          .eq('id', userId)
          .single();

        if (error) throw error;

        // Cache the profile data
        await CacheManager.setCache(cacheKey, data, CACHE_EXPIRY.user_profile);
        return data;
      } catch (err) {
        console.error('User profile query/cache error', err);
        return null;
      }
    },
    ...queryConfig.profile,
    // Add placeholderData for instant loading state
    placeholderData: () => ({
      id: userId,
      user_id: userId,
      email: '',
      full_name: '',
      social_media: undefined,
      age: 0,
      gender: '',
      organization: '',
      region: '',
      phone: '',
      club: '',
      stripe_customer_id: '',
      is_paid: false,
      role: 'user',
      badges: [],
      created_at: '',
      updated_at: '',
      is_profile_completed: false,
      notification_preferences: {
        email_notifications: true,
        workout_reminders: true,
        subscription_reminders: true,
        achievement_notifications: true,
        leaderboard_updates: true
      },
      theme_preferences: {
        theme: 'light',
        color_scheme: 'default',
        font_size: 'medium'
      },
      privacy_settings: {
        show_profile: true,
        show_stats: true,
        show_achievements: true,
        show_activity: true
      },
      user_settings: {}
    }),
    // Implement stale-while-revalidate pattern
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
} 