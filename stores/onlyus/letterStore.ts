'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { getSupabaseClient } from '@/lib/supabase-client'

export interface Letter {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  scheduled_at: string
  delivered: boolean
  created_at: string
}

interface LetterState {
  pendingLetters: Letter[]
  receivedLetters: Letter[]
  isLoading: boolean
  loadLetters: (userId: string) => Promise<void>
  scheduleLetter: (senderId: string, receiverId: string, content: string, scheduledAt: string) => Promise<void>
  deleteLetter: (id: string) => Promise<void>
}

export const useLetterStore = create<LetterState>()(
  persist(
    (set) => ({
      pendingLetters: [], receivedLetters: [], isLoading: false,

      loadLetters: async (userId) => {
        set({ isLoading: true })
        const supabase = getSupabaseClient()
        const [pending, received] = await Promise.all([
          supabase.from('letters').select('*').eq('sender_id', userId).eq('delivered', false).order('scheduled_at', { ascending: true }),
          supabase.from('letters').select('*').eq('receiver_id', userId).eq('delivered', true).order('scheduled_at', { ascending: false }),
        ])
        set({ pendingLetters: pending.data || [], receivedLetters: received.data || [], isLoading: false })
      },

      scheduleLetter: async (senderId, receiverId, content, scheduledAt) => {
        const supabase = getSupabaseClient()
        const { error } = await supabase.from('letters').insert({ sender_id: senderId, receiver_id: receiverId, content, scheduled_at: scheduledAt, delivered: false })
        if (!error) {
          const { data } = await supabase.from('letters').select('*').eq('sender_id', senderId).eq('delivered', false).order('scheduled_at', { ascending: true })
          set({ pendingLetters: data || [] })
        }
      },

      deleteLetter: async (id) => {
        const supabase = getSupabaseClient()
        await supabase.from('letters').delete().eq('id', id)
        set((s) => ({ pendingLetters: s.pendingLetters.filter((l) => l.id !== id) }))
      },
    }),
    { name: 'onlyus-letters', storage: createJSONStorage(() => localStorage), partialize: (s) => ({ pendingLetters: s.pendingLetters, receivedLetters: s.receivedLetters }) }
  )
)
