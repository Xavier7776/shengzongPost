import { getSupabaseClient } from './supabase-client'

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null
  try {
    return await navigator.serviceWorker.register('/sw.js')
  } catch (err) {
    console.error('SW registration failed:', err)
    return null
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return 'denied'
  return await Notification.requestPermission()
}

export async function subscribeToPush(userId: string): Promise<boolean> {
  const reg = await registerServiceWorker()
  if (!reg) return false

  const permission = await requestNotificationPermission()
  if (permission !== 'granted') return false

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidKey) {
    console.warn('VAPID public key not configured')
    return false
  }

  try {
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as any,
    })

    const subJson = subscription.toJSON()
    const s = getSupabaseClient()

    // Upsert subscription
    await s.from('push_subscriptions').upsert({
      user_id: userId,
      endpoint: subJson.endpoint!,
      p256dh: subJson.keys!.p256dh,
      auth: subJson.keys!.auth,
      user_agent: navigator.userAgent,
    }, { onConflict: 'user_id,endpoint' })

    return true
  } catch (err) {
    console.error('Push subscription failed:', err)
    return false
  }
}

export async function unsubscribeFromPush(userId: string): Promise<boolean> {
  const reg = await navigator.serviceWorker.getRegistration('/sw.js')
  if (!reg) return false

  const subscription = await reg.pushManager.getSubscription()
  if (subscription) {
    await subscription.unsubscribe()
    const s = getSupabaseClient()
    await s.from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', subscription.endpoint)
  }
  return true
}

export async function isSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false
  const reg = await navigator.serviceWorker.getRegistration('/sw.js')
  if (!reg) return false
  const sub = await reg.pushManager.getSubscription()
  return !!sub
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
