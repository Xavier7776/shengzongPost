'use client'

import { create } from 'zustand'
import { getSupabaseClient } from '@/lib/supabase-client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface MoodState {
  myMood: string | null
  partnerMood: string | null
  myMoodText: string | null
  partnerMoodText: string | null
  myMoodImage: string | null
  partnerMoodImage: string | null
  isLoading: boolean
  channel: RealtimeChannel | null
  setMyMood: (mood: string) => void
  loadMyMood: (userId: string) => Promise<void>
  loadPartnerMood: (partnerId: string) => Promise<void>
  saveMood: (userId: string, moodType: string, moodText?: string, moodImageUrl?: string) => Promise<void>
  subscribeToPartner: (partnerId: string) => void
  unsubscribe: () => void
}

export const useMoodStore = create<MoodState>((set, get) => ({
  myMood: null, partnerMood: null, myMoodText: null, partnerMoodText: null,
  myMoodImage: null, partnerMoodImage: null, isLoading: false, channel: null,

  setMyMood: (mood) => set({ myMood: mood }),

  loadMyMood: async (userId) => {
    set({ isLoading: true })
    const today = new Date().toISOString().split('T')[0]
    const supabase = getSupabaseClient()
    const { data } = await supabase
      .from('moods').select('mood_type,mood_text,mood_image_url')
      .eq('user_id', userId).eq('mood_date', today).limit(1).single()
    set({ myMood: data?.mood_type ?? null, myMoodText: data?.mood_text ?? null, myMoodImage: data?.mood_image_url ?? null, isLoading: false })
  },

  loadPartnerMood: async (partnerId) => {
    const today = new Date().toISOString().split('T')[0]
    const supabase = getSupabaseClient()
    const { data } = await supabase
      .from('moods').select('mood_type,mood_text,mood_image_url')
      .eq('user_id', partnerId).eq('mood_date', today).limit(1).single()
    set({ partnerMood: data?.mood_type ?? null, partnerMoodText: data?.mood_text ?? null, partnerMoodImage: data?.mood_image_url ?? null })
  },

  saveMood: async (userId, moodType, moodText, moodImageUrl) => {
    const today = new Date().toISOString().split('T')[0]
    const supabase = getSupabaseClient()
    const { error } = await supabase.from('moods').upsert(
      { user_id: userId, mood_type: moodType, mood_text: moodText || null, mood_image_url: moodImageUrl || null, mood_date: today },
      { onConflict: 'user_id,mood_date' }
    )
    if (!error) set({ myMood: moodType, myMoodText: moodText || null, myMoodImage: moodImageUrl || null })
  },

  subscribeToPartner: (partnerId) => {
    const supabase = getSupabaseClient()
    const { channel: ex } = get()
    if (ex) supabase.removeChannel(ex)
    const channel = supabase.channel('partner-mood-web')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'moods', filter: `user_id=eq.${partnerId}` },
        (p: any) => {
          if (p.new?.mood_type) set({ partnerMood: p.new.mood_type, partnerMoodText: p.new.mood_text ?? null, partnerMoodImage: p.new.mood_image_url ?? null })
        }
      ).subscribe()
    set({ channel })
  },

  unsubscribe: () => {
    const supabase = getSupabaseClient()
    const { channel } = get()
    if (channel) { supabase.removeChannel(channel); set({ channel: null }) }
  },
}))
