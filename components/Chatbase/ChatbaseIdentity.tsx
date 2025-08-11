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

      // Only proceed if user is logged in and not loading
      if (user && !isLoading) {
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
              console.log('Chatbase user identity set successfully')
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
            console.warn('Failed to verify user identity for Chatbase')
          }
        } catch (error) {
          console.error('Error setting up Chatbase identity:', error)
        }
      } else if (!isLoading && !user) {
        // User is not authenticated, don't make API calls
        console.log('Chatbase: User not authenticated, skipping identity setup')
      }
      // Note: When user logs out, we don't need to explicitly clear the user
      // Chatbase will handle anonymous sessions automatically when no user is set
    }

    // Reset setup flag when user changes
    hasSetupIdentity = false

    // Set up identity immediately if chatbase is already available
    setupChatbaseIdentity()

    // Also set up when chatbase loads
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
