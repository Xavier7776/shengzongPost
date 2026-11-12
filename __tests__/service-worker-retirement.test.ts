// @vitest-environment node
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { expect, it, vi } from 'vitest'

type WorkerEvent = { waitUntil: (work: Promise<unknown>) => void }
type WorkerHandler = (event: WorkerEvent) => void

it('retires installed workers and clears only MindStack caches', async () => {
  const handlers = new Map<string, WorkerHandler>()
  const skipWaiting = vi.fn().mockResolvedValue(undefined)
  const unregister = vi.fn().mockResolvedValue(true)
  const removeCache = vi.fn().mockResolvedValue(true)
  runInNewContext(readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8'), {
    self: {
      addEventListener: (name: string, handler: WorkerHandler) => handlers.set(name, handler),
      skipWaiting,
      registration: { unregister },
    },
    caches: {
      keys: async () => ['mindstack-v1-precache', 'mindstack-v2-runtime', 'other-app-cache', 'mindstack-unrelated'],
      delete: removeCache,
    },
  })

  const work: Promise<unknown>[] = []
  const event = { waitUntil: (promise: Promise<unknown>) => { work.push(promise) } }
  handlers.get('install')!(event)
  await Promise.all(work)
  expect(skipWaiting).toHaveBeenCalledOnce()
  handlers.get('activate')!(event)
  await Promise.all(work)

  expect(removeCache.mock.calls.map(([key]) => key)).toEqual(['mindstack-v1-precache', 'mindstack-v2-runtime'])
  expect(unregister).toHaveBeenCalledOnce()
  expect([...handlers.keys()]).toEqual(['install', 'activate'])
})
