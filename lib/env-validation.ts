/**
 * Environment variable validation for Pull-Up Club Next.js migration
 * Ensures all required environment variables are present
 */

interface RequiredEnvVars {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  
  // Stripe (server-side)
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  
  // Stripe (client-side)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
  NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID?: string;
  NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID?: string;
  
  // Site configuration
  NEXT_PUBLIC_SITE_URL?: string;
  NEXT_PUBLIC_GA_MEASUREMENT_ID?: string;
  NEXT_PUBLIC_META_PIXEL_ID?: string;
}

const requiredClientVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
] as const;

const optionalClientVars = [
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID', 
  'NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_GA_MEASUREMENT_ID',
  'NEXT_PUBLIC_META_PIXEL_ID'
] as const;

const requiredServerVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET'
] as const;

const optionalServerVars = [
  'CHATBASE_SECRET_KEY'
] as const;

/**
 * Validates client-side environment variables
 * Should be called in browser/client components
 */
export function validateClientEnv(): { valid: boolean; missing: string[]; warnings: string[] } {
  const missing: string[] = [];
  const warnings: string[] = [];
  
  // Check required variables - handle Next.js client-side environment loading
  for (const varName of requiredClientVars) {
    const value = process.env[varName] || (typeof window !== 'undefined' && (window as any).__ENV__?.[varName]);
    if (!value) {
      missing.push(varName);
    }
  }
  
  // Check optional variables (warnings only)
  for (const varName of optionalClientVars) {
    const value = process.env[varName] || (typeof window !== 'undefined' && (window as any).__ENV__?.[varName]);
    if (!value) {
      warnings.push(`Optional: ${varName}`);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
    warnings
  };
}

/**
 * Validates server-side environment variables
 * Should be called in API routes/server components
 */
export function validateServerEnv(): { valid: boolean; missing: string[]; warnings: string[] } {
  const missing: string[] = [];
  const warnings: string[] = [];
  
  // First validate client vars (server can access all env vars)
  const clientValidation = validateClientEnv();
  missing.push(...clientValidation.missing);
  
  // Check server-specific variables
  for (const varName of requiredServerVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  // Check optional server variables (warnings only)
  for (const varName of optionalServerVars) {
    if (!process.env[varName]) {
      warnings.push(`Optional: ${varName}`);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
    warnings: [...clientValidation.warnings, ...warnings]
  };
}

/**
 * Gets environment variables with fallbacks
 * Useful for non-critical configuration
 */
export function getEnvWithFallback(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

/**
 * Development environment checker
 */
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * Log environment validation results
 */
export function logEnvValidation(context: 'client' | 'server' = 'client') {
  const validation = context === 'server' ? validateServerEnv() : validateClientEnv();
  
  if (validation.valid) {
    console.log(`✅ [${context}] All required environment variables are present`);
  } else {
    console.error(`❌ [${context}] Missing required environment variables:`, validation.missing);
  }
  
  if (validation.warnings.length > 0 && isDevelopment) {
    console.warn(`⚠️ [${context}] Optional environment variables missing:`, validation.warnings);
  }
  
  return validation;
}