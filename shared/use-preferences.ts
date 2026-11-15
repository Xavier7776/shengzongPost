'use client'

import { useState } from 'react'
import { notifyStorageChange, useStoredString } from './browser-state'

interface Preferences { showBookmarks: boolean; showLikes: boolean }
const defaults: Preferences = { showBookmarks: true, showLikes: true }

export function usePreferences() {
  const raw = useStoredString('arc_prefs')
  const [fallback, setFallback] = useState(defaults)
  let preferences = fallback
  try {
    const parsed = JSON.parse(raw || '{}')
    preferences = {
      showBookmarks: typeof parsed?.showBookmarks === 'boolean' ? parsed.showBookmarks : fallback.showBookmarks,
      showLikes: typeof parsed?.showLikes === 'boolean' ? parsed.showLikes : fallback.showLikes,
    }
  } catch { /* Keep controls available when storage is blocked or invalid. */ }
  function savePreferences(next: Preferences) {
    setFallback(next)
    try {
      localStorage.setItem('arc_prefs', JSON.stringify(next))
      notifyStorageChange()
    } catch { /* Keep the current page's preference even without persistence. */ }
  }
  return { ...preferences, savePreferences }
}
