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
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(raw) ? raw.filter((h: HistoryItem) => h && typeof h.slug === 'string' && typeof h.title === 'string' && typeof h.readAt === 'string').slice(0, MAX_ITEMS) : []
  } catch {
    return []
  }
}

export function hasRead(slug: string): boolean {
  return getReadingHistory().some(h => h.slug === slug)
}

export default function ReadingHistory({ slug, title }: { slug: string; title: string }) {
  useEffect(() => {
    try {
      const history = getReadingHistory().filter(h => h.slug !== slug)
      history.unshift({ slug, title, readAt: new Date().toISOString() })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_ITEMS)))
    } catch { /* Reading stays available when browser storage is blocked. */ }
  }, [slug, title])

  return null
}
