'use client'

import React from "react";
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LoadingState } from '@/components/ui/LoadingState';

interface AdminRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * AdminRoute component that handles admin-only route protection
 *
 * @param children - The component to render if conditions are met
 * @param redirectTo - Where to redirect if not admin (default: '/profile')
 */
const AdminRoute: React.FC<AdminRouteProps> = ({
  children,
  redirectTo = '/profile' // Default redirect path
}) => {
  const { user, isAdmin, isLoading, subscriptionState } = useAuth(); 
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    // Wait for auth to initialize
    if (isLoading || subscriptionState === 'loading') {
      return;
    }

    // Redirect if not authenticated or not admin
    if (!user || !isAdmin) {
      router.push(redirectTo);
      return;
    }
  }, [user, isAdmin, isLoading, subscriptionState, redirectTo, router]);

  // Show loading while checking auth
  if (isLoading || subscriptionState === 'loading') {
    return <LoadingState message="Checking admin access..." />;
  }

  // Show loading if redirecting
  if (!user || !isAdmin) {
    return <LoadingState message="Access denied. Redirecting..." />;
  }

  // Render children if user is admin
  return <>{children}</>;
};

export default AdminRoute;