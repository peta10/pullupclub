'use client'

import React, { useEffect } from "react";
import { AuthProvider } from "../context/AuthContext";
import { CacheProvider } from "../context/CacheProvider";
import StripeProvider from "../lib/StripeProvider";
import LoadingOptimizer from "../components/Layout/LoadingOptimizer";
import SmoothScrollProvider from "../components/providers/SmoothScrollProvider";
import AnalyticsWrapper from "../components/Layout/AnalyticsWrapper";

import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
// Initialize service worker for cache management
import * as serviceWorkerRegistration from '../utils/serviceWorkerRegistration';
// Initialize i18n system
import "../i18n";

// Create QueryClient with optimized settings for fast loading
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: false, // No retries for faster feedback
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't refetch on mount for better performance
      refetchOnReconnect: false,
    },
    mutations: {
      retry: false, // No retries for faster feedback
    },
  },
});

function ProvidersContent({ children }: { children: React.ReactNode }) {
  // Register service worker for cache management
  useEffect(() => {
    console.log('🚀 Pull-Up Club: Initializing cache management...');
    
    // Register service worker with update handling
    serviceWorkerRegistration.register({
      onSuccess: (registration) => {
        console.log('✅ Pull-Up Club service worker registered successfully');
      },
      onUpdate: (registration) => {
        console.log('🔄 Pull-Up Club service worker updated');
        // The registration will handle auto-refresh
      },
    });

    // Cleanup function
    return () => {
      // Service worker will persist, which is what we want
    };
  }, []);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#ffffff',
            border: '1px solid #9b9b6f',
          },
          success: {
            style: {
              background: '#1f2937',
              color: '#ffffff',
              border: '1px solid #9b9b6f',
            },
            iconTheme: {
              primary: '#9b9b6f',
              secondary: '#ffffff',
            },
          },
          error: {
            style: {
              background: '#1f2937',
              color: '#ffffff',
              border: '1px solid #ef4444',
            },
          },
        }}
      />
      
      {children}
      <Analytics />
      <SpeedInsights />
    </>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LoadingOptimizer>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CacheProvider>
            <StripeProvider>
              <SmoothScrollProvider>
                <AnalyticsWrapper>
                  <ProvidersContent>
                    {children}
                  </ProvidersContent>
                </AnalyticsWrapper>
              </SmoothScrollProvider>
            </StripeProvider>
          </CacheProvider>
        </AuthProvider>
      </QueryClientProvider>
    </LoadingOptimizer>
  );
}