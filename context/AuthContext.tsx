'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Provider, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase, isDevelopment, getRedirectUrl } from "../lib/supabase";
import { createCheckoutSession, getActiveSubscription } from "../lib/stripe";
import { Badge } from "../types";

// Next.js SSR compatibility check
const isClient = typeof window !== 'undefined';
const isServer = typeof window === 'undefined';

interface User {
  id: string;
  email: string;
  role?: "user" | "admin";
}

interface ProfileSettings {
  user_settings: any;
  notification_preferences: {
    email_notifications: boolean;
    workout_reminders: boolean;
    subscription_reminders: boolean;
    achievement_notifications: boolean;
    leaderboard_updates: boolean;
  };
  theme_preferences: {
    theme: 'light' | 'dark';
    color_scheme: string;
    font_size: string;
  };
  privacy_settings: {
    show_profile: boolean;
    show_stats: boolean;
    show_achievements: boolean;
    show_activity: boolean;
  };
}

interface Profile extends ProfileSettings {
  // Core identification (from schema)
  id: string;                    // UUID PK, FK to auth.users
  user_id: string;              // UUID for RLS checks
  email: string;                // User's email
  full_name: string | null;     // User's full name
  
  // Demographics & location
  age: number | null;           // User's age
  gender: string | null;        // User's gender
  organization: string | null;  // Club affiliation
  region: string;              // Geographic region
  phone: string | null;        // Contact number
  social_media: string | null;  // Social media handle
  
  // Payment & subscription
  stripe_customer_id: string | null;  // Stripe customer ID
  is_paid: boolean;                   // Subscription status
  paypal_email: string | null;        // For payouts
  
  // Access control
  role: 'user' | 'admin';      // User role
  badges: Badge[];             // Achievement badges
  
  // Profile status
  is_profile_completed: boolean;  // Profile completion flag
  
  // Timestamps
  created_at: string;          // Creation timestamp
  updated_at: string;          // Last update timestamp
}

// Core interfaces following system architecture
interface AuthContextType {
  // Core state (matches architecture doc)
  user: User | null;                     // Current authenticated user
  profile: Profile | null;               // User profile data
  isAdmin: boolean;                      // Admin role status
  subscriptionState: SubscriptionState;  // Subscription status
  isLoading: boolean;                    // Loading states
  isFirstLogin: boolean;                 // Onboarding flow control

  // Core auth methods
  signIn: (email: string, password: string) => Promise<void>;              // User authentication
  signUp: (email: string, password: string) => Promise<void>;              // User registration
  signOut: () => Promise<void>;                                            // Session termination
  resetPassword: (email: string) => Promise<void>;                         // Password reset flow
  processPendingSubscription: (user: User) => Promise<void>;              // Post-auth subscription
  fetchProfile: (userId: string) => Promise<void>;                         // Profile data retrieval
  evaluateSubscription: () => Promise<SubscriptionState>;                  // Subscription validation

  // Additional utilities
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  signInWithProvider: (provider: Provider) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfileSettings: (settingType: keyof ProfileSettings, newValues: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  // Core state
  user: null,
  profile: null,
  isAdmin: false,
  subscriptionState: 'loading',
  isLoading: false,
  isFirstLogin: false,

  // Core auth methods
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  processPendingSubscription: async () => {},
  fetchProfile: async () => {},
  evaluateSubscription: async () => 'unpaid',

  // Additional utilities
  setProfile: () => {},
  signInWithProvider: async () => {},
  updatePassword: async () => {},
  refreshProfile: async () => {},
  updateProfileSettings: async () => {},
});

const defaultSettings: ProfileSettings = {
  user_settings: {},
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
  }
};

// Track subscription state explicitly so unpaid users don't get stuck on a spinner
type SubscriptionState = 'loading' | 'active' | 'unpaid';

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>('loading');
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Safety net: Force clear loading after 10 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn("[AuthContext] Forcing loading to false after timeout");
        setIsLoading(false);
      }
    }, 10000);
    return () => clearTimeout(timeout);
  }, [isLoading]);

  // This will be defined after evaluateSubscription is declared

  // Handle automatic redirects following the exact system guide flow:
  // 1. Payment Required First
  // 2. Create Account
  // 3. Complete Profile
  // 4. Access Submit Page
  useEffect(() => {
    const handleAuthFlow = async () => {
      if (isLoading) {
        console.log('[AuthContext] Auth flow skipped - loading');
        return;
      }

      const currentPath = pathname;
      console.log('[AuthContext] Processing auth flow:', {
        path: currentPath,
        hasUser: !!user,
        hasProfile: !!profile,
        isPaid: profile?.is_paid,
        isComplete: profile?.is_profile_completed
      });

      // Step 1: Payment Required First (Key Business Rule)
      if (user?.id && !profile?.is_paid && currentPath !== '/subscription') {
        console.log('[AuthContext] Payment required before proceeding');
        router.replace('/subscription');
        return;
      }

      // Step 2: Account Creation
      if (!user?.id) {
        const protectedRoutes = ['/profile', '/submit', '/admin-dashboard', '/create-account'];
        if (currentPath && protectedRoutes.includes(currentPath)) {
          console.log('[AuthContext] No auth: redirecting to login');
          router.replace('/login');
        }
        return;
      }

      // Step 3: Profile Completion
      if (user?.id && profile?.id && !profile.is_profile_completed && currentPath !== '/create-account') {
        console.log('[AuthContext] Profile completion required');
        router.replace('/create-account');
        return;
      }

      // Step 4: Access to Protected Routes - ONLY redirect from auth pages, not from other pages
      if (user?.id && profile?.id && profile.is_paid && profile.is_profile_completed) {
        const isAuthPage = currentPath === '/login' || currentPath === '/create-account' || currentPath === '/subscription';
        if (isAuthPage) {
          console.log('[AuthContext] Auth complete: redirecting to profile');
          router.replace('/profile');
        }
      }
    };

    handleAuthFlow();
  }, [user, profile, isLoading, pathname, router]);

  // Remove the additional redirect trigger that was causing navigation issues
  // This was causing users to get redirected back to profile when trying to navigate

  // Simple session validation
  useEffect(() => {
    const validateSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setUser(null);
        setProfile(null);
      }
    };
    validateSession();
  }, []);

  const handlePostAuthSubscription = async (
    authedUser: User,
    plan: "monthly" | "annual"
  ) => {
    if (!authedUser || !plan) {
      console.log(
        "[AuthContext] handlePostAuthSubscription: Missing user or plan."
      );
      return;
    }
    setIsLoading(true);
    try {
      // Store pending subscription in database instead of localStorage
      const { error: pendingError } = await supabase.rpc('handle_pending_subscription', {
        user_id: authedUser.id,
        plan_data: { plan, timestamp: new Date().toISOString() }
      });

      if (pendingError) throw pendingError;

      console.log(
        `[AuthContext] User ${authedUser.email} proceeding to ${plan} subscription.`
      );
      const checkoutUrl = await createCheckoutSession(plan, authedUser.email, {
        userId: authedUser.id,
      });
      console.log("[AuthContext] Checkout URL received:", checkoutUrl);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        console.error("[AuthContext] Checkout URL is null or undefined.");
        router.push("/subscription?error=checkout_url_missing");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("[AuthContext] Post-auth subscription error:", error);
      router.push("/subscription?error=checkout_failed");
      setIsLoading(false);
    }
  };

  const fetchProfile = async (userId: string, retryCount = 0) => {
    try {
      // Fetch profile and admin role in parallel
      let profileData: any;
      const [
        { data: { session } },
        profileResult,
        { data: adminData }
      ] = await Promise.all([
        supabase.auth.getSession(),
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('admin_roles').select('*').eq('user_id', userId).single()
      ]);

      profileData = profileResult.data;
      const profileError = profileResult.error;

      // Set admin status
      const isUserAdmin = !!adminData;
      setIsAdmin(isUserAdmin);

      // Sync metadata if needed
      if (session) {
        syncMetadataToProfile(userId, session).catch(console.error);
      }

      console.log("[AuthContext] Profile query complete. Error:", profileError, "Data:", profileData);

      if (profileError) {
        if (retryCount < 3) {
          console.log("[AuthContext] Retrying profile fetch...");
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchProfile(userId, retryCount + 1);
        }
        throw profileError;
      }

      if (!profileData) {
        // If no profile exists, create one
        console.log("[AuthContext] No profile found, creating new profile");
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{
            // Core identification
            id: userId,
            user_id: userId,
            email: session?.user?.email,
            full_name: null,
            
            // Demographics & location
            age: null,
            gender: null,
            organization: null,
            region: '',
            phone: null,
            
            // Payment & subscription
            stripe_customer_id: null,
            is_paid: session?.user?.user_metadata?.is_paid || false,
            paypal_email: null,
            
            // Access control
            role: isUserAdmin ? 'admin' : 'user',
            badges: [],
            
            // Profile status
            is_profile_completed: false,
            
            // Timestamps
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            
            // Settings
            notification_preferences: defaultSettings.notification_preferences,
            theme_preferences: defaultSettings.theme_preferences,
            privacy_settings: defaultSettings.privacy_settings,
            user_settings: defaultSettings.user_settings
          }])
          .select()
          .single();

        if (createError) throw createError;
        profileData = newProfile;
      }

      // Ensure user_id is set
      if (!profileData.user_id) {
        console.log("[AuthContext] Fixing missing user_id");
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ user_id: userId })
          .eq('id', userId);
        
        if (updateError) {
          console.error("[AuthContext] Error updating user_id:", updateError);
        }
        profileData.user_id = userId;
      }

      console.log("[AuthContext] Mapping profile data to context format");
      const mappedProfile: Profile = {
        // Core identification
        id: profileData.id,
        user_id: profileData.user_id || userId,
        email: profileData.email,
        full_name: profileData.full_name || null,
        
        // Demographics & location
        age: profileData.age || null,
        gender: profileData.gender || null,
        organization: profileData.organization || null,
        region: profileData.region || '',
        phone: profileData.phone || null,
        social_media: profileData.social_media || null,
        
        // Payment & subscription
        stripe_customer_id: profileData.stripe_customer_id || null,
        is_paid: profileData.is_paid || false,
        paypal_email: profileData.paypal_email || null,
        
        // Access control
        role: profileData.role || 'user',
        badges: profileData.badges || [],
        
        // Profile status
        is_profile_completed: profileData.is_profile_completed || false,
        
        // Timestamps
        created_at: profileData.created_at,
        updated_at: profileData.updated_at,
        
        // Settings
        notification_preferences: profileData.notification_preferences || defaultSettings.notification_preferences,
        theme_preferences: profileData.theme_preferences || defaultSettings.theme_preferences,
        privacy_settings: profileData.privacy_settings || defaultSettings.privacy_settings,
        user_settings: profileData.user_settings || {}
      };

      console.log("[AuthContext] Setting profile object:", mappedProfile);
      setProfile(mappedProfile);
      console.log("[AuthContext] Profile fetch completed successfully");
    } catch (error) {
      console.error("[AuthContext] Error in fetchProfile:", error);
      if (retryCount < 3) {
        console.log("[AuthContext] Retrying profile fetch...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchProfile(userId, retryCount + 1);
      }
      throw error;
    }
  };

  const processPendingSubscription = async (currentUser: User) => {
    console.log(
      "[AuthContext] processPendingSubscription called for user:",
      currentUser.email
    );
    
    try {
      // Get pending subscription from database instead of localStorage
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('pending_subscription_plan')
        .eq('id', currentUser.id)
        .single();

      if (profileError) throw profileError;

      const pendingPlan = (profileData?.pending_subscription_plan as any)?.plan as "monthly" | "annual" | null;
      
      if (pendingPlan) {
        // Clear pending subscription from database
        await supabase.rpc('clear_pending_subscription', {
          user_id: currentUser.id
        });
        
        await handlePostAuthSubscription(currentUser, pendingPlan);
      } else {
        console.log("[AuthContext] No pending plan in database.");
        // Only redirect if we're on an auth route AND user is fully authenticated
        const isAuthRoute = pathname === "/login" || pathname === "/create-account";
        if (isAuthRoute && user && profile?.is_paid && profile?.is_profile_completed) {
          console.log("[AuthContext] Redirecting from auth route to profile");
          router.push("/profile");
        }
      }
    } catch (error) {
      console.error("[AuthContext] Error processing pending subscription:", error);
    }
  };

  const updateProfileSettings = async (settingType: keyof ProfileSettings, newValues: any) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [settingType]: newValues, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;
      if (profile) {
        setProfile({
          ...profile,
          [settingType]: { ...profile[settingType], ...newValues }
        });
      }
    } catch (error) {
      console.error(`Error updating ${settingType}:`, error);
      throw error;
    }
  };

  // Expose refreshProfile method for components to call after submissions
  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  // --- ADDED: syncMetadataToProfile ---
  const syncMetadataToProfile = async (userId: string, session: Session) => {
    try {
      const userMetadata = session.user.user_metadata || {};
      const isPaidInMetadata = userMetadata.is_paid === true || userMetadata.is_paid === 'true';
      const stripeCustomerIdInMetadata = userMetadata.stripe_customer_id;
      
      // Get current profile
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('is_paid, stripe_customer_id')
        .eq('id', userId)
        .single();
      
      if (!currentProfile) return;
      
      // Check if sync is needed
      const needsSync = (
        (isPaidInMetadata && !currentProfile.is_paid) ||
        (stripeCustomerIdInMetadata && !currentProfile.stripe_customer_id)
      );
      
      if (needsSync) {
        console.log('[AuthContext] Syncing metadata to profile:', {
          metadata_is_paid: isPaidInMetadata,
          profile_is_paid: currentProfile.is_paid,
          metadata_customer_id: stripeCustomerIdInMetadata,
          profile_customer_id: currentProfile.stripe_customer_id
        });
        
        const updateData: any = {
          updated_at: new Date().toISOString()
        };
        
        if (isPaidInMetadata && !currentProfile.is_paid) {
          updateData.is_paid = true;
        }
        
        if (stripeCustomerIdInMetadata && !currentProfile.stripe_customer_id) {
          updateData.stripe_customer_id = stripeCustomerIdInMetadata;
        }
        
        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId);
          
        if (error) {
          console.error('[AuthContext] Error syncing metadata:', error);
        } else {
          console.log('[AuthContext] Successfully synced metadata to profile');
        }
      }
    } catch (error) {
      console.error('[AuthContext] Error in syncMetadataToProfile:', error);
    }
  };

  /**
   * Evaluate subscription status following the architecture flow:
   * 1. Check profile.is_paid flag
   * 2. Verify Stripe subscription status
   * 3. Update subscription state
   */
  const evaluateSubscription = useCallback(async () => {
    try {
      console.log('[AuthContext] Evaluating subscription status');

      // Step 1: Check profile.is_paid flag (set by webhook)
      if (profile?.is_paid === true) {
        console.log('[AuthContext] User marked as paid in profile');
        setSubscriptionState('active');
        return 'active';
      }

      // Step 2: Verify with Stripe
      console.log('[AuthContext] Checking Stripe subscription');
      const sub = await getActiveSubscription();
      
      // Step 3: Update state based on Stripe status
      const isActive = !!sub && (sub as any)?.status === 'active';
      const state = isActive ? 'active' : 'unpaid';
      
      console.log('[AuthContext] Setting subscription state:', state);
      setSubscriptionState(state);
      
      // If Stripe shows active but profile doesn't, sync the state
      if (isActive && profile && !profile.is_paid) {
        console.log('[AuthContext] Syncing profile paid status with Stripe');
        await supabase
          .from('profiles')
          .update({ is_paid: true })
          .eq('id', profile.id);
      }

      return state;
    } catch (err) {
      console.warn('[AuthContext] Subscription evaluation failed:', err);
      setSubscriptionState('unpaid');
      return 'unpaid';
    }
  }, [profile]);

  // Re-evaluate subscription when profile changes
  useEffect(() => {
    if (profile && user) {
      console.log('[AuthContext] Profile updated, re-evaluating subscription. is_paid:', profile.is_paid);
      evaluateSubscription();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.is_paid, user?.id]);

  // Memoize the fetchProfile function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchProfileMemo = useCallback(fetchProfile, []);
  
  // Memoize the processPendingSubscription function  
  // eslint-disable-next-line react-hooks/exhaustive-deps  
  const processPendingSubscriptionMemo = useCallback(processPendingSubscription, [pathname, router]);

  // Handle client-side mounting to prevent hydration mismatches
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Skip initialization on server-side or before mounting
    if (isServer || !isMounted) {
      return;
    }
    
    if (hasInitialized) {
      console.log("[AuthContext] Already initialized, skipping");
      return;
    }

    setHasInitialized(true);
    let subscription: { unsubscribe: () => void } | null = null;

      const initAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const currentUser = { id: session.user.id, email: session.user.email! };
        setUser(currentUser);
        
        // Validate session and fetch profile
        const { error: testError } = await supabase.from('profiles').select('id').limit(1);
        if (testError && (testError.message.includes('JWT') || testError.message.includes('expired'))) {
          console.log('🔄 Invalid session detected during init, signing out...');
          await supabase.auth.signOut({ scope: 'local' });
          setIsLoading(false);
          return;
        }

        try {
          await fetchProfile(currentUser.id);
          await evaluateSubscription();
        } catch (error) {
          console.error('Profile fetch error:', error);
          await supabase.auth.signOut({ scope: 'local' });
        }
      } else {
        // No session - user is not logged in
        console.log('[AuthContext] No session found during init');
        setSubscriptionState('unpaid');
      }
    } catch (e) {
      console.warn('initAuth getSession failed', e);
      await supabase.auth.signOut({ scope: 'local' });
    } finally {
      // Always set loading to false after initialization
      setIsLoading(false);
    }
  };
    initAuth();

    // Set up auth state change listener FIRST
    const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log(
          `[AuthContext] onAuthStateChange event: ${event}, User: ${session?.user?.email}`,
        );

        // Prevent processing if we're already handling this event
        if (isLoading) {
          console.log('[AuthContext] Skipping auth state change while loading');
          return;
        }

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('[AuthContext] Processing SIGNED_IN event');
          setIsLoading(true);
          
          try {
            // Validate session token first
            const { error: testError } = await supabase
              .from('profiles')
              .select('id')
              .limit(1);
              
            if (testError && (testError.message.includes('JWT') || testError.message.includes('expired'))) {
              console.log('🔄 Invalid session detected in auth change, signing out...');
              await supabase.auth.signOut({ scope: 'local' });
              return;
            }

            const currentUser = {
              id: session.user.id,
              email: session.user.email!,
            };
            
            setUser(currentUser);
            setSubscriptionState('loading'); // Reset subscription state
            
            // First fetch profile
            await fetchProfileMemo(session.user.id);
            
            // Then evaluate subscription (which needs profile data)
            await evaluateSubscription();
            
            // Finally process any pending subscription
            await processPendingSubscriptionMemo(currentUser);
            
            console.log('[AuthContext] SIGNED_IN processing complete');
          } catch (error) {
            console.error('[AuthContext] Error processing sign in:', error);
            setSubscriptionState('unpaid');
            // Clear invalid state
            await supabase.auth.signOut({ scope: 'local' });
          } finally {
            setIsLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[AuthContext] Processing SIGNED_OUT event');
          setUser(null);
          setProfile(null);
          setIsFirstLogin(false);
          setIsAdmin(false);
          setSubscriptionState('loading');
          
          // Clear any stored session data
          try {
            localStorage.removeItem('pullupclub-auth');
            document.cookie = 'pullupclub-auth=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure; samesite=strict';
          } catch (e) {
            console.warn('[AuthContext] Error clearing stored session:', e);
          }
        }
        // Ignore other events (INITIAL_SESSION, TOKEN_REFRESHED, etc.)
      }
    );
    subscription = sub;

    return () => {
      if (subscription) subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]); // Only run when mounted on client

  const signIn = async (email: string, password: string) => {
    console.log("[AuthContext] signIn called for:", email);
    setIsLoading(true);
    
    try {
      if (isDevelopment && email === "dev@example.com" && password === "dev123") {
        console.log("[AuthContext] Processing dev mode sign in");
        const devUser = { id: "dev-user-id", email: "dev@example.com" };
        
        setUser(devUser);
        setSubscriptionState('loading');
        
        const devProfile: Profile = {
          // Core identification
          id: 'dev-user-id',
          user_id: 'dev-user-id',
          email: 'dev@example.com',
          full_name: null,
          
          // Demographics & location
          age: null,
          gender: null,
          organization: null,
          region: '',
          phone: null,
          social_media: null,
          
          // Payment & subscription
          stripe_customer_id: null,
          is_paid: false,
          paypal_email: null,
          
          // Access control
          role: 'user',
          badges: [],
          
          // Profile status
          is_profile_completed: false,
          
          // Timestamps
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          
          // Settings
          ...defaultSettings
        };
        setProfile(devProfile);
        
        await evaluateSubscription();
        await processPendingSubscriptionMemo(devUser);
        
        setIsFirstLogin(true);
        console.log("[AuthContext] Dev mode sign in complete");
        setIsLoading(false);
        return;
      }

      const {
        data: { session },
        error,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("[AuthContext] Supabase signIn error:", error);
        setIsLoading(false);
        throw error;
      }

      console.log("[AuthContext] Supabase signIn successful. Session:", session);
      
      if (!session?.user) {
        console.error("[AuthContext] No user in session after sign in");
        setIsLoading(false);
        throw new Error("No user in session after sign in");
      }

      const currentUser = { id: session.user.id, email: session.user.email! };
      setUser(currentUser);
      setSubscriptionState('loading');
      
      try {
        // First fetch profile
        await fetchProfileMemo(session.user.id);
        
        // Then evaluate subscription (which needs profile data)
        await evaluateSubscription();
        
        console.log("[AuthContext] Sign in processing complete");
      } catch (error) {
        console.error("[AuthContext] Error processing sign in:", error);
        setSubscriptionState('unpaid');
        throw error;
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const ensureProfileExists = async (userId: string, email: string): Promise<boolean> => {
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single();

      if (existingProfile) {
        return true; // Profile exists
      }

      // Create profile if it doesn't exist
      console.log("[AuthContext] Creating missing profile for user:", userId);
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          // Core identification
          id: userId,
          user_id: userId,
          email: email,
          full_name: null,
          
          // Demographics & location
          age: null,
          gender: null,
          organization: null,
          region: '',
          phone: null,
          
          // Payment & subscription
          stripe_customer_id: null,
          is_paid: false,
          paypal_email: null,
          
          // Access control
          role: 'user',
          badges: [],
          
          // Profile status
          is_profile_completed: false,
          
          // Timestamps
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          
          // Settings
          ...defaultSettings
        });

      if (insertError) {
        console.error("[AuthContext] Error creating profile:", insertError);
        return false;
      }

      console.log("[AuthContext] Profile created successfully for user:", userId);
      return true;
    } catch (error) {
      console.error("[AuthContext] Error in ensureProfileExists:", error);
      return false;
    }
  };

  const signUp = async (email: string, password: string) => {
    console.log("[AuthContext] signUp called for:", email);
    setIsLoading(true);
    
    try {
      if (isDevelopment && email === "dev@example.com" && password === "dev123") {
        console.log("[AuthContext] Processing dev mode sign up");
        const devUser = { id: "dev-user-id", email: "dev@example.com" };
        setUser(devUser);
        setSubscriptionState('loading');
        
        const devProfile: Profile = {
          id: 'dev-user-id',
          user_id: 'dev-user-id',
          email: 'dev@example.com',
          full_name: null,
          age: null,
          gender: null,
          organization: null,
          region: '',
          phone: null,
          social_media: null,
          stripe_customer_id: null,
          is_paid: false,
          paypal_email: null,
          role: "user",
          badges: [],
          is_profile_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_settings: {},
          notification_preferences: defaultSettings.notification_preferences,
          theme_preferences: defaultSettings.theme_preferences,
          privacy_settings: defaultSettings.privacy_settings
        };
        setProfile(devProfile);
        setIsFirstLogin(true);
        console.log("[AuthContext] Dev mode sign up complete");
        setIsLoading(false);
        return;
      }

      // Regular signup flow
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${getRedirectUrl()}subscription`,
        },
      });

      if (error) {
        console.error("[AuthContext] Supabase signUp error:", error);
        throw error;
      }

      if (!data?.user) {
        console.warn("[AuthContext] No user object in signUp response");
        setIsFirstLogin(true);
        return;
      }

      const newUser = { id: data.user.id, email: data.user.email! };
      console.log("[AuthContext] User created, proceeding to subscription");
      
      setUser(newUser);
      setSubscriptionState('unpaid');
      
      // Profile will be auto-created by database trigger
      // Fetch it to confirm creation
      await fetchProfileMemo(newUser.id);
      
      setIsFirstLogin(true);
      
      // Redirect to subscription page
      router.replace('/subscription');
      
    } catch (error) {
      console.error("[AuthContext] Sign up failed:", error);
      setSubscriptionState('unpaid');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithProvider = async (provider: Provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${getRedirectUrl()}profile`,
      },
    });

    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    // Determine redirect URL based on environment
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('localhost');
    
    const redirectUrl = `${window.location.origin}/reset-password`;
    
    console.log('🔗 AuthContext resetPassword with redirect URL:', redirectUrl);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    console.log('[AuthContext] Signing out user');
    // Use local scope only to avoid 403 errors with deprecated global scope
    await supabase.auth.signOut({ scope: 'local' });
    setUser(null);
    setProfile(null);
    setIsFirstLogin(false);
    setIsAdmin(false);
    setSubscriptionState('loading');
    
    // Redirect to home page after sign out
    router.push("/");
  };

  // Remove debug logging

  return (
    <AuthContext.Provider
      value={{
        // Core state
        user,
        profile,
        isAdmin,
        subscriptionState,
        isLoading,
        isFirstLogin,

        // Core auth methods
        signIn,
        signUp,
        signOut,
        resetPassword,
        processPendingSubscription,
        fetchProfile,
        evaluateSubscription,

        // Additional utilities
        setProfile,
        signInWithProvider,
        updatePassword,
        refreshProfile,
        updateProfileSettings
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider };

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Server-side auth utilities for Next.js SSR
export const serverSideAuth = {
  /**
   * Get user session on server-side for SSR/SSG
   * Use in getServerSideProps or middleware
   */
  getSession: async (accessToken?: string) => {
    if (isClient) {
      console.warn('[AuthContext] serverSideAuth.getSession should only be used server-side');
      return null;
    }
    
    try {
      if (accessToken) {
        const { data: { user }, error } = await supabase.auth.getUser(accessToken);
        return error ? null : user;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user || null;
    } catch (error) {
      console.error('[AuthContext] Server-side session error:', error);
      return null;
    }
  },

  /**
   * Validate if user has required permissions server-side
   */
  validatePermissions: async (userId: string, requiredRole?: 'admin' | 'user') => {
    if (isClient) {
      console.warn('[AuthContext] serverSideAuth.validatePermissions should only be used server-side');
      return false;
    }

    try {
      if (requiredRole === 'admin') {
        const { data: adminData } = await supabase
          .from('admin_roles')
          .select('*')
          .eq('user_id', userId)
          .single();
        return !!adminData;
      }
      
      // For 'user' role or no specific role, just check if profile exists
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
      return !!profileData;
    } catch (error) {
      console.error('[AuthContext] Server-side permission validation error:', error);
      return false;
    }
  }
};