'use client'

import { useEffect, useRef } from 'react'
import Lenis from 'lenis'

interface SmoothScrollProviderProps {
  children: React.ReactNode
}

export default function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    // Initialize Lenis smooth scroll
    const lenis = new Lenis()

    lenisRef.current = lenis

    // Get scroll value
    lenis.on('scroll', (e: any) => {
      // You can add scroll event handling here if needed
      // console.log(e)
    })

    // RAF function for smooth scrolling
    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    // Cleanup function
    return () => {
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  // Expose lenis instance globally for programmatic scrolling
  useEffect(() => {
    if (lenisRef.current && typeof window !== 'undefined') {
      // @ts-ignore
      window.lenis = lenisRef.current
    }
  }, [])

  return <>{children}</>
}

// Global smooth scroll utilities
export const scrollTo = (target: string | number, options?: any) => {
  if (typeof window !== 'undefined' && (window as any).lenis) {
    ;(window as any).lenis.scrollTo(target, options)
  }
}

export const scrollToTop = (options?: any) => {
  scrollTo(0, options)
}

export const scrollToElement = (element: string | HTMLElement, options?: any) => {
  if (typeof window !== 'undefined' && (window as any).lenis) {
    ;(window as any).lenis.scrollTo(element, options)
  }
}
