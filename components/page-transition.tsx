"use client"

import React from "react"
import Link from "next/link"

// Simplified provider that just renders children (no transition)
export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

// Simple Link component using Next.js Link (no transition animation)
export function TransitionLink({
  href,
  children,
  className,
  ...props
}: {
  href: string
  children: React.ReactNode
  className?: string
  [key: string]: any
}) {
  return (
    <Link
      href={href}
      className={className}
      {...props}
    >
      {children}
    </Link>
  )
}

// Keep the hook for backward compatibility
export const usePageTransition = () => ({
  isTransitioning: false,
  navigateTo: () => {},
})
