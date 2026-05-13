'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { getSupabaseClient } from '@/lib/supabase-client'

export interface BucketItem {
  id: string; couple_id: string; title: string; description: string | null
  category: string; progress: number; cover_photo_url: string | null
  created_by: string | null; completed_at: string | null; created_at: string
}

const CATEGORIES = ['全部', '旅行', '美食', '冒险', '学习', '浪漫', '其他']

interface BucketState {
  items: BucketItem[]; isLoading: boolean; activeCategory: string
  setActiveCategory: (c: string) => void
  loadItems: (coupleId: string) => Promise<void>
  addItem: (item: Partial<BucketItem> & { couple_id: string; title: string }) => Promise<BucketItem | null>
  updateItem: (id: string, updates: Partial<BucketItem>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  markComplete: (id: string) => Promise<void>
}

export const useBucketListStore = create<BucketState>()(persist((set, get) => ({
  items: [], isLoading: false, activeCategory: '全部',
  setActiveCategory: (c) => set({ activeCategory: c }),
  loadItems: async (coupleId) => {
    set({ isLoading: true })
    const s = getSupabaseClient()
    const { data } = await s.from('bucket_list_items').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false })
    set({ items: data || [], isLoading: false })
  },
  addItem: async (item) => {
    const s = getSupabaseClient()
    const { data, error } = await s.from('bucket_list_items').insert(item).select().single()
    if (!error && data) {
      set((st) => ({ items: [data, ...st.items] }))
      return data
    }
    return null
  },
  updateItem: async (id, updates) => {
    const s = getSupabaseClient()
    const { data, error } = await s.from('bucket_list_items').update(updates).eq('id', id).select().single()
    if (!error && data) set((st) => ({ items: st.items.map((i) => i.id === id ? data : i) }))
  },
  deleteItem: async (id) => {
    const s = getSupabaseClient()
    await s.from('bucket_list_items').delete().eq('id', id)
    set((st) => ({ items: st.items.filter((i) => i.id !== id) }))
  },
  markComplete: async (id) => {
    const s = getSupabaseClient()
    const { data, error } = await s.from('bucket_list_items').update({ completed_at: new Date().toISOString(), progress: 100 }).eq('id', id).select().single()
    if (!error && data) set((st) => ({ items: st.items.map((i) => i.id === id ? data : i) }))
  },
}), { name: 'onlyus-bucket-list', storage: createJSONStorage(() => localStorage), partialize: (s) => ({ items: s.items }) }))

export { CATEGORIES }
