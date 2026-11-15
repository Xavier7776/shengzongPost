'use client'

import { useRef, useState, useEffect } from 'react'
import { useMediaQuery } from './browser-state'

export function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  // Server-rendered content must be visible before scroll effects can run.
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
        if (entry.isIntersecting) {
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1 }
    )
    const el = ref.current
    if (el) observer.observe(el)
    return () => { if (el) observer.unobserve(el) }
  }, [])

  return [ref, isVisible] as const
}

const MOBILE_QUERY = '(max-width: 767px)'

export function useIsMobile() {
  return useMediaQuery(MOBILE_QUERY)
}
