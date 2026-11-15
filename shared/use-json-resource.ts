'use client'

import { useCallback, useEffect, useEffectEvent, useState, type SetStateAction } from 'react'

/** A keyed request: changing identity hides old results immediately and cancels stale work. */
export function useJsonResource<T>(url: string | null, initialData: T, scope = '') {
  const [revision, setRevision] = useState(0)
  const identity = JSON.stringify([url, scope])
  const requestKey = JSON.stringify([url, scope, revision])
  const [result, setResult] = useState<{ key: string; identity: string; data: T; error: string | null } | null>(null)
  const fallback = useEffectEvent(() => initialData)

  useEffect(() => {
    if (!url) return
    const requestUrl = url
    const controller = new AbortController()
    let active = true
    let timedOut = false
    const timeout = setTimeout(() => { timedOut = true; controller.abort() }, 15000)
    async function load() {
      try {
        const response = await fetch(requestUrl, { signal: controller.signal, cache: 'no-store' })
        if (!response.ok) throw new Error('加载失败，请稍后重试')
        const data: T = await response.json()
        if (active && !controller.signal.aborted) setResult({ key: requestKey, identity, data, error: null })
      } catch (error) {
        if (active && (!controller.signal.aborted || timedOut)) {
          const initial = fallback()
          setResult(previous => ({ key: requestKey, identity,
            data: previous?.identity === identity ? previous.data : initial,
            error: timedOut ? '加载超时，请重试' : error instanceof Error ? error.message : '加载失败',
          }))
        }
      } finally {
        clearTimeout(timeout)
      }
    }
    void load()
    return () => { active = false; clearTimeout(timeout); controller.abort() }
  }, [url, requestKey, identity])

  const reload = useCallback(() => setRevision(value => value + 1), [])
  const setData = useCallback((update: SetStateAction<T>) => {
    setResult(previous => {
      const data = previous?.identity === identity ? previous.data : initialData
      return { key: requestKey, identity, data: typeof update === 'function' ? (update as (value: T) => T)(data) : update, error: null }
    })
  }, [requestKey, identity, initialData])
  const current = result?.key === requestKey ? result : null
  const previousData = result?.identity === identity ? result.data : initialData
  return { data: url ? current?.data ?? previousData : initialData, loading: Boolean(url) && !current, error: current?.error ?? null, reload, setData }
}
