'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { getSupabaseClient } from '@/lib/supabase-client'

export type DiaryVisibility = 'private' | 'shared' | 'partner'

export interface DiaryEntry {
  id: string
  user_id: string
  content: string
  voice_url: string | null
  visibility: DiaryVisibility
  created_at: string
}

interface DiaryState {
  myEntries: DiaryEntry[]
  partnerEntries: DiaryEntry[]
  isLoading: boolean
  loadDiaries: (userId: string, partnerId: string) => Promise<void>
  addDiary: (userId: string, content: string, visibility: DiaryVisibility, voiceUrl?: string) => Promise<void>
  deleteDiary: (id: string) => Promise<void>
  removeVoice: (id: string) => Promise<void>
}

export const useDiaryStore = create<DiaryState>()(
  persist(
    (set) => ({
      myEntries: [], partnerEntries: [], isLoading: false,

      loadDiaries: async (userId, partnerId) => {
        set({ isLoading: true })
        const supabase = getSupabaseClient()
        const [mine, partner] = await Promise.all([
          supabase.from('diaries').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
          supabase.from('diaries').select('*').eq('user_id', partnerId).in('visibility', ['shared', 'partner']).order('created_at', { ascending: false }),
        ])
        set({ myEntries: mine.data || [], partnerEntries: partner.data || [], isLoading: false })
      },

      addDiary: async (userId, content, visibility, voiceUrl) => {
        const supabase = getSupabaseClient()
        const { error } = await supabase.from('diaries').insert({ user_id: userId, content, visibility, voice_url: voiceUrl || null })
        if (!error) {
          const { data } = await supabase.from('diaries').select('*').eq('user_id', userId).order('created_at', { ascending: false })
          set({ myEntries: data || [] })
        }
      },

      deleteDiary: async (id) => {
        const supabase = getSupabaseClient()
        await supabase.from('diaries').delete().eq('id', id)
        set((s) => ({ myEntries: s.myEntries.filter((d) => d.id !== id), partnerEntries: s.partnerEntries.filter((d) => d.id !== id) }))
      },

      removeVoice: async (id) => {
        const supabase = getSupabaseClient()
        await supabase.from('diaries').update({ voice_url: null }).eq('id', id)
        set((s) => ({
          myEntries: s.myEntries.map((d) => d.id === id ? { ...d, voice_url: null } : d),
          partnerEntries: s.partnerEntries.map((d) => d.id === id ? { ...d, voice_url: null } : d),
        }))
      },
    }),
    { name: 'onlyus-diaries', storage: createJSONStorage(() => localStorage), partialize: (s) => ({ myEntries: s.myEntries, partnerEntries: s.partnerEntries }) }
  )
)
