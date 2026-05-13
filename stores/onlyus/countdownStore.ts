'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { getSupabaseClient } from '@/lib/supabase-client'

export interface Countdown {
  id: string; couple_id: string; title: string; target_date: string
  emoji: string; created_by: string; created_at: string
}

interface CountdownState {
  customCountdowns: Countdown[]; isLoading: boolean
  loadCountdowns: (coupleId: string) => Promise<void>
  addCountdown: (coupleId: string, title: string, targetDate: string, emoji: string, createdBy: string) => Promise<void>
  deleteCountdown: (id: string) => Promise<void>
}

export const useCountdownStore = create<CountdownState>()(persist((set, get) => ({
  customCountdowns: [], isLoading: false,
  loadCountdowns: async (coupleId) => {
    set({ isLoading: true })
    const s = getSupabaseClient()
    const { data } = await s.from('countdowns').select('*').eq('couple_id', coupleId).order('target_date', { ascending: true })
    set({ customCountdowns: data || [], isLoading: false })
  },
  addCountdown: async (coupleId, title, targetDate, emoji, createdBy) => {
    const s = getSupabaseClient()
    const { data, error } = await s.from('countdowns').insert({ couple_id: coupleId, title, target_date: targetDate, emoji, created_by: createdBy }).select().single()
    if (!error && data) set((st) => ({ customCountdowns: [...st.customCountdowns, data].sort((a, b) => a.target_date.localeCompare(b.target_date)) }))
  },
  deleteCountdown: async (id) => {
    const s = getSupabaseClient()
    await s.from('countdowns').delete().eq('id', id)
    set((st) => ({ customCountdowns: st.customCountdowns.filter((c) => c.id !== id) }))
  },
}), { name: 'onlyus-countdowns', storage: createJSONStorage(() => localStorage), partialize: (s) => ({ customCountdowns: s.customCountdowns }) }))
