'use client'

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LoadingState } from '@/components/ui/LoadingState';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

/**
 * ProtectedRoute component that handles authentication protection
 * 
 * @param children - The component to render if conditions are met
 * @param requireAuth - Whether authentication is required (default: true)
 * @param redirectTo - Where to redirect if not authenticated (default: '/login')
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/login'
}) => {
  const { user, isLoading, subscriptionState } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    // Wait for auth to initialize (for protected routes, we also wait for subscriptionState)
    if (isLoading || (requireAuth && subscriptionState === 'loading')) {
      return;
    }

    // Handle auth protection
    if (requireAuth && !user) {
      // Store the current path for redirect after login
      const currentPath = pathname || '/';
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
      router.push(redirectUrl);
      return;
    }

    // Handle reverse protection (e.g., don't show login page if already logged in)
    if (!requireAuth && user) {
      router.push('/profile');
      return;
    }
  }, [user, isLoading, subscriptionState, requireAuth, redirectTo, pathname, router]);

  // Show loading while checking auth
  if (isLoading || (requireAuth && subscriptionState === 'loading')) {
    return <LoadingState message="Checking authentication..." />;
  }

  // For protected routes, show loading if redirecting
  if (requireAuth && !user) {
    return <LoadingState message="Redirecting to login..." />;
  }

  // For non-protected routes (like login), show nothing if user exists (will redirect)
  if (!requireAuth && user) {
    return <LoadingState message="Redirecting to profile..." />;
  }

  // Render children if all conditions are met
  return <>{children}</>;
};

export default ProtectedRoute;