// Retire the legacy worker at its original URL so installed clients can update.
// No new registrations, request caching, or push handlers are provided.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((key) => /^mindstack-v\d+-/.test(key)).map((key) => caches.delete(key)))
    await self.registration.unregister()
  })())
})
