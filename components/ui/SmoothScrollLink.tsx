'use client'

import React from 'react'
import Link from 'next/link'

interface SmoothScrollLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  smooth?: boolean
  offset?: number
  duration?: number
  [key: string]: any
}

/**
 * Enhanced Link component with smooth scrolling for anchor links
 * Falls back to regular Next.js Link for external or page navigation
 */
export const SmoothScrollLink: React.FC<SmoothScrollLinkProps> = ({
  href,
  children,
  className,
  smooth = true,
  offset = 0,
  duration = 1.2,
  ...props
}) => {

  // Check if it's an anchor link
  const isAnchorLink = href.startsWith('#')
  
  // Check if it's an internal page link
  const isInternalLink = href.startsWith('/') && !href.startsWith('//')

  const handleClick = (e: React.MouseEvent) => {
    if (isAnchorLink && smooth) {
      e.preventDefault()
      // Use window.lenis for smooth scrolling
      if (typeof window !== 'undefined' && (window as any).lenis) {
        (window as any).lenis.scrollTo(href, { offset, duration })
      }
    }
    
    // Call original onClick if provided
    if (props.onClick) {
      props.onClick(e)
    }
  }

  if (isAnchorLink) {
    return (
      <a
        href={href}
        className={className}
        onClick={handleClick}
        {...props}
      >
        {children}
      </a>
    )
  }

  if (isInternalLink) {
    return (
      <Link
        href={href}
        className={className}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Link>
    )
  }

  // External link
  return (
    <a
      href={href}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  )
}

export default SmoothScrollLink
