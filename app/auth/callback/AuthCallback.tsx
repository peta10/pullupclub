'use client'

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('[AuthCallback] Processing auth callback...');
        
        if (!searchParams) {
          setError('No URL parameters found');
          setIsProcessing(false);
          return;
        }
        
        // Get the code and other params from URL
        const code = searchParams.get('code');
        const error_code = searchParams.get('error');
        const error_description = searchParams.get('error_description');
        
        if (error_code) {
          console.error('[AuthCallback] Auth error:', error_description);
          setError(error_description || 'Authentication failed');
          setIsProcessing(false);
          return;
        }

        if (code) {
          // Exchange the code for a session
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('[AuthCallback] Code exchange error:', exchangeError);
            setError(exchangeError.message);
            setIsProcessing(false);
            return;
          }

          if (data.session) {
            console.log('[AuthCallback] Session established successfully');
            
            // Check if this is a password reset
            const isPasswordReset = searchParams.get('type') === 'recovery';
            
            if (isPasswordReset) {
              router.push('/reset-password?confirmed=true');
            } else {
              // Regular auth callback - redirect to profile
              router.push('/profile');
            }
          } else {
            setError('No session received');
            setIsProcessing(false);
          }
        } else {
          // No code parameter - might be a direct session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            console.log('[AuthCallback] Existing session found');
            router.push('/profile');
          } else {
            setError('No authentication code found');
            setIsProcessing(false);
          }
        }
      } catch (err) {
        console.error('[AuthCallback] Unexpected error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Authentication Error</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-[#9b9b6f] hover:bg-[#8a8a5f] text-black px-6 py-2 rounded font-medium"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9b9b6f] mx-auto mb-4"></div>
          <p className="text-gray-400">Completing authentication...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we set up your account</p>
        </div>
      </div>
    );
  }

  return null;
}