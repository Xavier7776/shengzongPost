'use client'

import { useEffect } from 'react'

const STORAGE_KEY = 'arc_reading_history'
const MAX_ITEMS = 20

interface HistoryItem {
  slug: string
  title: string
  readAt: string
}

export function getReadingHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function hasRead(slug: string): boolean {
  return getReadingHistory().some(h => h.slug === slug)
}

export default function ReadingHistory({ slug, title }: { slug: string; title: string }) {
  useEffect(() => {
    const history = getReadingHistory().filter(h => h.slug !== slug)
    history.unshift({ slug, title, readAt: new Date().toISOString() })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_ITEMS)))
  }, [slug, title])

  return null
}
