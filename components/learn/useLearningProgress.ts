'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { LEARN_PROGRESS_KEY, parseLearningProgress, serializeLearningProgress, type LearningProgress, type ProgressRecords } from '@/lib/learn/progress'

const CHANGED = 'mindstack:learn-progress-changed'
export function useLearningProgress() {
  const [records, setRecords] = useState<ProgressRecords>({})
  const [available, setAvailable] = useState(true)
  const memory = useRef<ProgressRecords>({})
  const volatile = useRef(false)
  useEffect(() => {
    const load = () => {
      try { memory.current = parseLearningProgress(localStorage.getItem(LEARN_PROGRESS_KEY)); setAvailable(true); setRecords(memory.current) }
      catch { setAvailable(false) }
    }
    const storage = (event: StorageEvent) => { if (event.key === LEARN_PROGRESS_KEY || event.key === null) load() }
    load()
    window.addEventListener('storage', storage)
    window.addEventListener(CHANGED, load)
    return () => { window.removeEventListener('storage', storage); window.removeEventListener(CHANGED, load) }
  }, [])
  const update = useCallback((slug: string, change: (previous: LearningProgress | undefined) => LearningProgress | null) => {
    let latest = memory.current
    try { if (!volatile.current) latest = parseLearningProgress(localStorage.getItem(LEARN_PROGRESS_KEY)) } catch { /* Memory remains usable in private/blocked storage. */ }
    const next = { ...latest }, value = change(latest[slug])
    if (value === latest[slug] || (!value && !latest[slug])) return
    if (value) next[slug] = value
    else delete next[slug]
    memory.current = parseLearningProgress(serializeLearningProgress(next))
    setRecords(memory.current)
    try { localStorage.setItem(LEARN_PROGRESS_KEY, serializeLearningProgress(memory.current)); volatile.current = false; setAvailable(true); window.dispatchEvent(new Event(CHANGED)) }
    catch { volatile.current = true; setAvailable(false) }
  }, [])
  return { records, available, update }
}
