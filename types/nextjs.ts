/**
 * Next.js specific types for Pull-Up Club migration
 */

import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import type { User } from '@supabase/supabase-js';

// Server-side authentication result
export interface ServerAuthResult {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  redirectTo?: string;
}

// Props that include server-side auth state
export interface AuthPageProps {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

// Enhanced GetServerSideProps with auth
export type AuthenticatedGetServerSideProps<P = {}> = (
  context: GetServerSidePropsContext,
  authResult: ServerAuthResult
) => Promise<GetServerSidePropsResult<P & AuthPageProps>>;

// API route response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

// Stripe API responses
export interface CheckoutSessionResponse {
  url?: string;
  error?: string;
}

export interface WebhookResponse {
  received: boolean;
  error?: string;
}

// Environment configuration
export interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  stripePublishableKey?: string;
  stripeMonthlyPriceId?: string;
  stripeAnnualPriceId?: string;
  siteUrl?: string;
  gaMeasurementId?: string;
  metaPixelId?: string;
}

// Auth callback URL params
export interface AuthCallbackParams {
  code?: string;
  error?: string;
  error_description?: string;
  type?: 'recovery' | 'signup' | 'magiclink';
}

// Enhanced auth context for SSR
export interface SSRAuthContext {
  user: User | null;
  profile: any | null; // Use your Profile type
  isAdmin: boolean;
  isLoading: boolean;
  redirectTo?: string;
}

// Page component props with auth
export type PageProps<T extends Record<string, any> = Record<string, any>> = T & {
  auth?: SSRAuthContext;
};

// Protected route configuration
export interface RouteProtection {
  requireAuth: boolean;
  requireAdmin?: boolean;
  requirePaid?: boolean;
  redirectTo?: string;
}

// Next.js app-specific auth hooks
export interface NextAuthHook {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}