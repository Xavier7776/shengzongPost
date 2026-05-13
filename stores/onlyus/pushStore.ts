'use client'

import { create } from 'zustand'
import { isPushSupported, subscribeToPush, unsubscribeFromPush, isSubscribed } from '@/lib/push'

interface PushState {
  isSupported: boolean; isSubscribed: boolean; isLoading: boolean
  checkStatus: () => Promise<void>
  subscribe: (userId: string) => Promise<boolean>
  unsubscribe: (userId: string) => Promise<boolean>
}

export const usePushStore = create<PushState>()((set) => ({
  isSupported: false, isSubscribed: false, isLoading: false,
  checkStatus: async () => {
    const supported = isPushSupported()
    const subscribed = supported ? await isSubscribed() : false
    set({ isSupported: supported, isSubscribed: subscribed })
  },
  subscribe: async (userId) => {
    set({ isLoading: true })
    const result = await subscribeToPush(userId)
    set({ isSubscribed: result, isLoading: false })
    return result
  },
  unsubscribe: async (userId) => {
    set({ isLoading: true })
    const result = await unsubscribeFromPush(userId)
    set({ isSubscribed: !result, isLoading: false })
    return result
  },
}))
