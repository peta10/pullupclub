'use client'

import { useEffect, useState } from 'react'

interface LoadingOptimizerProps {
  children: React.ReactNode
}

/**
 * Prevents hydration flash without affecting hook order
 */
export default function LoadingOptimizer({ children }: LoadingOptimizerProps) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Set hydrated after first client-side render
    setIsHydrated(true)
  }, [])

  // Return children immediately but hide with CSS until hydrated
  // This prevents hook order changes that cause React errors
  return (
    <div className={isHydrated ? 'opacity-100 transition-opacity duration-300' : 'opacity-0'}>
      {children}
    </div>
  )
}
