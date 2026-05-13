'use client'

import { create } from 'zustand'
import { getSupabaseClient } from '@/lib/supabase-client'

export interface Medal {
  id: string; medal_key: string; title: string; description: string
  emoji: string; category: string; threshold: number | null
}

export interface UserMedal {
  id: string; user_id: string; couple_id: string; medal_id: string; unlocked_at: string
}

interface MedalState {
  medals: Medal[]; userMedals: UserMedal[]; isLoading: boolean
  loadMedals: () => Promise<void>
  loadUserMedals: (coupleId: string) => Promise<void>
  checkAndUnlock: (userId: string, coupleId: string, medalKey: string) => Promise<void>
}

export const useMedalStore = create<MedalState>()((set, get) => ({
  medals: [], userMedals: [], isLoading: false,
  loadMedals: async () => {
    const s = getSupabaseClient()
    const { data } = await s.from('medals').select('*').order('category')
    if (data) set({ medals: data })
  },
  loadUserMedals: async (coupleId) => {
    const s = getSupabaseClient()
    const { data } = await s.from('user_medals').select('*').eq('couple_id', coupleId)
    if (data) set({ userMedals: data })
  },
  checkAndUnlock: async (userId, coupleId, medalKey) => {
    const { medals, userMedals } = get()
    const medal = medals.find(m => m.medal_key === medalKey)
    if (!medal) return
    const already = userMedals.some(um => um.user_id === userId && um.medal_id === medal.id)
    if (already) return
    const s = getSupabaseClient()
    const { data, error } = await s.from('user_medals').insert({
      user_id: userId, couple_id: coupleId, medal_id: medal.id,
    }).select().single()
    if (!error && data) set((st) => ({ userMedals: [...st.userMedals, data] }))
  },
}))
