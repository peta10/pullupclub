import { useEffect, useCallback } from 'react'

declare global {
  interface Window {
    lenis?: any
  }
}

export const useLenis = () => {
  const scrollTo = useCallback((target: string | number | HTMLElement, options?: any) => {
    if (typeof window !== 'undefined' && window.lenis) {
      window.lenis.scrollTo(target, options)
    }
  }, [])

  const scrollToTop = useCallback((options?: any) => {
    scrollTo(0, options)
  }, [scrollTo])

  const scrollToElement = useCallback((selector: string, options?: any) => {
    if (typeof window !== 'undefined' && window.lenis) {
      const element = document.querySelector(selector)
      if (element) {
        window.lenis.scrollTo(element, options)
      }
    }
  }, [])

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.lenis) {
      window.lenis.stop()
    }
  }, [])

  const start = useCallback(() => {
    if (typeof window !== 'undefined' && window.lenis) {
      window.lenis.start()
    }
  }, [])

  // Add smooth scroll to anchor links
  useEffect(() => {
    const handleAnchorClick = (e: Event) => {
      const target = e.target as HTMLAnchorElement
      if (target?.tagName === 'A') {
        const href = target.getAttribute('href')
        if (href?.startsWith('#')) {
          e.preventDefault()
          scrollToElement(href)
        }
      }
    }

    document.addEventListener('click', handleAnchorClick)
    return () => document.removeEventListener('click', handleAnchorClick)
  }, [scrollToElement])

  return {
    scrollTo,
    scrollToTop,
    scrollToElement,
    stop,
    start,
  }
}

export default useLenis
