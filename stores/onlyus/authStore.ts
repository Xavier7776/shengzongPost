'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { getSupabaseClient } from '@/lib/supabase-client'

export interface Profile {
  id: string
  nickname: string
  avatar_url: string | null
  city: string
  latitude: number
  longitude: number
  partner_id: string | null
  push_token: string | null
  created_at: string
}

export interface CoupleInfo {
  id: string
  user1_id: string
  user2_id: string
  anniversary_date: string
  next_meetup_date: string | null
  proposed_meetup_date: string | null
  proposed_by: string | null
  meetup_approved: boolean
  created_at: string
}

export const USER_IDS = {
  user1: '11111111-1111-1111-1111-111111111111',
  user2: '22222222-2222-2222-2222-222222222222',
}

interface AuthState {
  currentUserId: string | null
  profile: Profile | null
  partner: Profile | null
  coupleInfo: CoupleInfo | null
  isLoading: boolean
  isReady: boolean
  selectUser: (userId: string) => Promise<void>
  loadProfile: () => Promise<void>
  loadPartner: () => Promise<void>
  loadCoupleInfo: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  updateCoupleInfo: (updates: Partial<CoupleInfo>) => Promise<void>
  signOut: () => void
  init: () => Promise<void>
}

export const useOnlyUsAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUserId: null,
      profile: null,
      partner: null,
      coupleInfo: null,
      isLoading: true,
      isReady: false,

      init: async () => {
        const { currentUserId } = get()
        if (currentUserId) {
          await get().loadProfile()
          await get().loadPartner()
          await get().loadCoupleInfo()
        }
        set({ isLoading: false, isReady: true })
      },

      selectUser: async (userId) => {
        set({ currentUserId: userId, isLoading: true })
        await get().loadProfile()
        await get().loadPartner()
        await get().loadCoupleInfo()
        set({ isLoading: false })
      },

      loadProfile: async () => {
        const { currentUserId } = get()
        if (!currentUserId) return
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUserId)
          .single()
        if (!error && data) set({ profile: data })
      },

      loadPartner: async () => {
        const { profile } = get()
        if (!profile?.partner_id) return
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profile.partner_id)
          .single()
        if (!error && data) set({ partner: data })
      },

      loadCoupleInfo: async () => {
        const { currentUserId } = get()
        if (!currentUserId) return
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
          .from('couple_info')
          .select('*')
          .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
          .single()
        if (!error && data) set({ coupleInfo: data })
      },

      updateProfile: async (updates) => {
        const { currentUserId, profile } = get()
        if (!currentUserId || !profile) return
        const supabase = getSupabaseClient()
        const { error } = await supabase
          .from('profiles').update(updates).eq('id', currentUserId)
        if (!error) set({ profile: { ...profile, ...updates } })
      },

      updateCoupleInfo: async (updates) => {
        const { coupleInfo } = get()
        if (!coupleInfo) return
        const supabase = getSupabaseClient()
        const { error } = await supabase
          .from('couple_info').update(updates).eq('id', coupleInfo.id)
        if (!error) set({ coupleInfo: { ...coupleInfo, ...updates } })
      },

      signOut: () => {
        set({ currentUserId: null, profile: null, partner: null, coupleInfo: null, isReady: false })
      },
    }),
    {
      name: 'onlyus-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        currentUserId: s.currentUserId,
        profile: s.profile,
        partner: s.partner,
        coupleInfo: s.coupleInfo,
      }),
    }
  )
)
