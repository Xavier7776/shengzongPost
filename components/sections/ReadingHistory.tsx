'use client'

import { useEffect, useMemo } from 'react'
import { useStoredString, notifyStorageChange } from '@/shared/browser-state'

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

export function useReadingHistory(enabled = true): HistoryItem[] {
  const raw = useStoredString(enabled ? STORAGE_KEY : null)
  return useMemo(() => {
    try {
      const items: unknown = JSON.parse(raw || '[]')
      return Array.isArray(items) ? items.filter((h: HistoryItem) => h && typeof h.slug === 'string' && typeof h.title === 'string' && typeof h.readAt === 'string').slice(0, MAX_ITEMS) : []
    } catch { return [] }
  }, [raw])
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
      notifyStorageChange()
    } catch { /* Reading stays available when browser storage is blocked. */ }
  }, [slug, title])

  return null
}
