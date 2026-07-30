// MindStack Service Worker
// 集成 PWA 离线缓存与 OnlyUs 推送通知能力

// ===== 缓存版本号(更新缓存时递增) =====
const CACHE_VERSION = 'mindstack-v1'
const PRECACHE_CACHE = `${CACHE_VERSION}-precache`
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`
const IMAGE_CACHE = `${CACHE_VERSION}-image`
const STATIC_CACHE = `${CACHE_VERSION}-static`

// 需在安装阶段预缓存的核心页面
const PRECACHE_URLS = ['/', '/blog', '/work', '/skills', '/offline.html']

// 离线回退页面
const OFFLINE_URL = '/offline.html'

// ===== 安装: 预缓存核心页面 =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('[SW] precache failed:', err))
  )
})

// ===== 激活: 清理旧版本缓存 =====
self.addEventListener('activate', (event) => {
  const allowedCaches = [PRECACHE_CACHE, RUNTIME_CACHE, IMAGE_CACHE, STATIC_CACHE]
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !allowedCaches.includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

// ===== fetch: 按资源类型实施不同缓存策略 =====
self.addEventListener('fetch', (event) => {
  const { request } = event

  // 只处理 GET 请求,其他方法直接放行
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // 跨源请求不缓存(避免第三方资源污染)
  if (url.origin !== self.location.origin) return

  // 1) 页面导航请求: Network First,失败回退缓存,再回退离线页
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
    return
  }

  // 2) Next.js 静态资源(_next/static): Cache First
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // 3) 图片资源: Stale While Revalidate
  if (request.destination === 'image') {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE))
    return
  }

  // 4) 其他同源 GET 请求: Network First,回退缓存
  event.respondWith(networkFirst(request, RUNTIME_CACHE))
})

// 网络优先: 先请求网络,失败则用缓存,导航失败再回退离线页
async function networkFirst(request, cacheName = RUNTIME_CACHE) {
  const cache = await caches.open(cacheName)
  try {
    const networkResponse = await fetch(request)
    // 仅缓存成功响应
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (err) {
    const cached = await cache.match(request)
    if (cached) return cached
    // 导航请求且无缓存时返回离线页
    if (request.mode === 'navigate') {
      const offline = await caches.match(OFFLINE_URL)
      if (offline) return offline
    }
    throw err
  }
}

// 缓存优先: 命中即返回,未命中则请求网络并写入缓存
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached
  try {
    const networkResponse = await fetch(request)
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (err) {
    // 静态资源离线且无缓存时返回空响应,避免页面崩溃
    return new Response('', { status: 504, statusText: 'Offline' })
  }
}

// 先返回缓存,后台异步更新(SWR)
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    })
    .catch(() => cached)
  // 有缓存立即返回,无缓存等待网络
  return cached || fetchPromise
}

// ====================================================================
// OnlyUs 推送通知能力(保留原有逻辑)
// ====================================================================

self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const title = data.title || 'OnlyUs'
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'onlyus-notification',
    data: data.url || '/onlyus/home',
    vibrate: [100, 50, 100],
    actions: data.actions || [],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data || '/onlyus/home'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if open
      for (const client of windowClients) {
        if (client.url.includes('/onlyus') && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
