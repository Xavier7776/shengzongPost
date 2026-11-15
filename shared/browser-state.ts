'use client'

import { useCallback, useSyncExternalStore } from 'react'

const subscribeHydration = () => () => {}
const clientSnapshot = () => true
const serverSnapshot = () => false

/** Keep server HTML and the first hydration render consistent. */
export function useHydrated() {
  return useSyncExternalStore(subscribeHydration, clientSnapshot, serverSnapshot)
}

export function useMediaQuery(query: string) {
  const subscribe = useCallback((notify: () => void) => {
    const media = window.matchMedia(query)
    media.addEventListener('change', notify)
    return () => media.removeEventListener('change', notify)
  }, [query])
  const snapshot = useCallback(() => window.matchMedia(query).matches, [query])
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot)
}

const STORAGE_EVENT = 'mindstack:storage-changed'
function subscribeStorage(notify: () => void) {
  window.addEventListener('storage', notify)
  window.addEventListener(STORAGE_EVENT, notify)
  return () => {
    window.removeEventListener('storage', notify)
    window.removeEventListener(STORAGE_EVENT, notify)
  }
}
const emptyStorage = () => null

/** Subscribe to a stable primitive, rather than returning a fresh parsed object. */
export function useStoredString(key: string | null) {
  const snapshot = useCallback(() => {
    if (key === null) return null
    try { return localStorage.getItem(key) } catch { return null }
  }, [key])
  return useSyncExternalStore(subscribeStorage, snapshot, emptyStorage)
}

export function notifyStorageChange() {
  window.dispatchEvent(new Event(STORAGE_EVENT))
}
