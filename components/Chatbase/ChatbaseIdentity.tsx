'use client'

import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'

declare global {
  interface Window {
    chatbase?: {
      (action: string, ...args: any[]): any;
      q?: any[];
    };
  }
}

export default function ChatbaseIdentity() {
  const { user, isLoading } = useAuth()

  useEffect(() => {
    // Skip entirely if auth is still loading
    if (isLoading) {
      return
    }

    let hasSetupIdentity = false
    
    const setupChatbaseIdentity = async () => {
      // Wait for chatbase to be available
      if (typeof window === 'undefined' || !window.chatbase) {
        return
      }

      // Avoid duplicate setups
      if (hasSetupIdentity) {
        return
      }

      // Only make API calls if user is actually authenticated
      if (user) {
        try {
          const response = await fetch('/api/chatbase/verify-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            const { userId, hash } = await response.json()
            
            // Set user identity in Chatbase using the correct method
            try {
              window.chatbase('setUser', {
                identifier: userId,
                hmac: hash
              })
              hasSetupIdentity = true
              console.log('🔍 Chatbase: User identity set successfully')
            } catch (chatbaseError) {
              console.warn('Chatbase setUser failed, trying alternative method:', chatbaseError)
              // Alternative method if setUser doesn't work
              window.chatbase('identify', {
                userId: userId,
                signature: hash
              })
              hasSetupIdentity = true
            }
          } else {
            console.warn('🔍 Chatbase: Authentication failed')
          }
        } catch (error) {
          console.warn('🔍 Chatbase: Error setting up identity (non-critical):', error)
        }
      } else {
        // User is not authenticated - no API calls needed
        console.log('🔍 Chatbase: Anonymous session (no identity setup needed)')
        hasSetupIdentity = true // Prevent further attempts
      }
    }

    // Set up identity immediately if chatbase is already available
    setupChatbaseIdentity()

    // Also set up when chatbase loads (but only if not already set up)
    const interval = setInterval(() => {
      if (window.chatbase && !hasSetupIdentity) {
        setupChatbaseIdentity()
      }
    }, 500)

    // Cleanup interval after 10 seconds to avoid memory leaks
    const timeout = setTimeout(() => {
      clearInterval(interval)
    }, 10000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [user, isLoading])

  // This component doesn't render anything visible
  return null
}
