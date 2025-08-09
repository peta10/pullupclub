'use client'

import React, { useRef, useEffect } from 'react'

interface SmoothScrollContainerProps {
  children: React.ReactNode
  className?: string
  horizontal?: boolean
  speed?: number
  [key: string]: any
}

/**
 * Container with enhanced smooth scrolling for internal content
 * Useful for sliders, carousels, or scrollable content areas
 */
export const SmoothScrollContainer: React.FC<SmoothScrollContainerProps> = ({
  children,
  className,
  horizontal = false,
  speed = 1,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let isScrolling = false
    let targetScrollPosition = horizontal ? container.scrollLeft : container.scrollTop
    let currentScrollPosition = targetScrollPosition

    const smoothScroll = () => {
      if (!isScrolling) return

      const difference = targetScrollPosition - currentScrollPosition
      const step = difference * 0.1 * speed

      if (Math.abs(step) < 0.5) {
        if (horizontal) {
          container.scrollLeft = targetScrollPosition
        } else {
          container.scrollTop = targetScrollPosition
        }
        isScrolling = false
        return
      }

      currentScrollPosition += step
      
      if (horizontal) {
        container.scrollLeft = currentScrollPosition
      } else {
        container.scrollTop = currentScrollPosition
      }

      requestAnimationFrame(smoothScroll)
    }

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return // Allow zoom

      e.preventDefault()
      
      const delta = e.deltaY || e.deltaX
      const scrollAmount = delta * 0.5

      if (horizontal) {
        targetScrollPosition = Math.max(
          0,
          Math.min(
            container.scrollWidth - container.clientWidth,
            targetScrollPosition + scrollAmount
          )
        )
      } else {
        targetScrollPosition = Math.max(
          0,
          Math.min(
            container.scrollHeight - container.clientHeight,
            targetScrollPosition + scrollAmount
          )
        )
      }

      if (!isScrolling) {
        isScrolling = true
        requestAnimationFrame(smoothScroll)
      }
    }

    // Add smooth scrolling for wheel events
    container.addEventListener('wheel', handleWheel, { passive: false })

    // Update current position on direct scroll (e.g., scrollbar drag)
    const handleScroll = () => {
      if (!isScrolling) {
        currentScrollPosition = horizontal ? container.scrollLeft : container.scrollTop
        targetScrollPosition = currentScrollPosition
      }
    }

    container.addEventListener('scroll', handleScroll)

    return () => {
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('scroll', handleScroll)
    }
  }, [horizontal, speed])

  return (
    <div
      ref={containerRef}
      className={className}
      data-lenis-prevent // Prevent Lenis from interfering with internal scrolling
      {...props}
    >
      {children}
    </div>
  )
}

export default SmoothScrollContainer
