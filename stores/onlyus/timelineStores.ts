'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { getSupabaseClient } from '@/lib/supabase-client'

export interface Memory {
  id: string; couple_id: string; title: string; description: string
  photo_urls: string[]; happened_at: string; created_at: string
}

interface MemoryState {
  memories: Memory[]; isLoading: boolean
  loadMemories: (coupleId: string) => Promise<void>
  addMemory: (m: Omit<Memory, 'id' | 'created_at'>) => Promise<void>
  deleteMemory: (id: string) => Promise<void>
}

export const useMemoryStore = create<MemoryState>()(persist((set) => ({
  memories: [], isLoading: false,
  loadMemories: async (coupleId) => {
    set({ isLoading: true })
    const s = getSupabaseClient()
    const { data } = await s.from('memories').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false })
    set({ memories: data || [], isLoading: false })
  },
  addMemory: async (memory) => {
    const s = getSupabaseClient()
    const { error } = await s.from('memories').insert(memory)
    if (!error) {
      const { data } = await s.from('memories').select('*').eq('couple_id', memory.couple_id).order('created_at', { ascending: false })
      set({ memories: data || [] })
    }
  },
  deleteMemory: async (id) => {
    const s = getSupabaseClient()
    await s.from('memories').delete().eq('id', id)
    set((st) => ({ memories: st.memories.filter((m) => m.id !== id) }))
  },
}), { name: 'onlyus-memories', storage: createJSONStorage(() => localStorage), partialize: (s) => ({ memories: s.memories }) }))

export interface Photo {
  id: string; couple_id: string; uploader_id: string
  storage_path: string; caption: string | null; created_at: string
}

interface AlbumState {
  photos: Photo[]; isLoading: boolean; isUploading: boolean
  loadPhotos: (coupleId: string) => Promise<void>
  uploadPhoto: (coupleId: string, uploaderId: string, file: File, caption?: string) => Promise<void>
  deletePhoto: (id: string, storagePath: string) => Promise<void>
}

export const useAlbumStore = create<AlbumState>()(persist((set) => ({
  photos: [], isLoading: false, isUploading: false,
  loadPhotos: async (coupleId) => {
    set({ isLoading: true })
    const s = getSupabaseClient()
    const { data } = await s.from('photos').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false })
    set({ photos: data || [], isLoading: false })
  },
  uploadPhoto: async (coupleId, uploaderId, file, caption) => {
    set({ isUploading: true })
    const s = getSupabaseClient()
    const ext = file.name.split('.').pop()
    const fileName = `${coupleId}/${Date.now()}.${ext}`
    const { error: upErr } = await s.storage.from('photos').upload(fileName, file)
    if (upErr) { set({ isUploading: false }); return }
    const { data: { publicUrl } } = s.storage.from('photos').getPublicUrl(fileName)
    const { error } = await s.from('photos').insert({ couple_id: coupleId, uploader_id: uploaderId, storage_path: publicUrl, caption: caption || null })
    if (!error) {
      const { data } = await s.from('photos').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false })
      set({ photos: data || [], isUploading: false })
    } else set({ isUploading: false })
  },
  deletePhoto: async (id, storagePath) => {
    const s = getSupabaseClient()
    const fileName = storagePath.split('/').slice(-2).join('/')
    await s.storage.from('photos').remove([fileName])
    await s.from('photos').delete().eq('id', id)
    set((st) => ({ photos: st.photos.filter((p) => p.id !== id) }))
  },
}), { name: 'onlyus-album', storage: createJSONStorage(() => localStorage), partialize: (s) => ({ photos: s.photos }) }))

export interface WishlistItem {
  id: string; couple_id: string; title: string; completed: boolean
  completed_photo_url: string | null; completed_at: string | null; created_at: string
}

interface WishlistState {
  pendingItems: WishlistItem[]; completedItems: WishlistItem[]; isLoading: boolean
  loadItems: (coupleId: string) => Promise<void>
  addItem: (coupleId: string, title: string) => Promise<void>
  completeItem: (id: string, photoUrl?: string) => Promise<void>
  deleteItem: (id: string) => Promise<void>
}

export const useWishlistStore = create<WishlistState>()(persist((set) => ({
  pendingItems: [], completedItems: [], isLoading: false,
  loadItems: async (coupleId) => {
    set({ isLoading: true })
    const s = getSupabaseClient()
    const { data } = await s.from('wishlist').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false })
    if (data) set({ pendingItems: data.filter((i) => !i.completed), completedItems: data.filter((i) => i.completed), isLoading: false })
  },
  addItem: async (coupleId, title) => {
    const s = getSupabaseClient()
    const { error } = await s.from('wishlist').insert({ couple_id: coupleId, title, completed: false })
    if (!error) {
      const { data } = await s.from('wishlist').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false })
      if (data) set({ pendingItems: data.filter((i) => !i.completed), completedItems: data.filter((i) => i.completed) })
    }
  },
  completeItem: async (id, photoUrl) => {
    const s = getSupabaseClient()
    const { error } = await s.from('wishlist').update({ completed: true, completed_photo_url: photoUrl || null, completed_at: new Date().toISOString() }).eq('id', id)
    if (!error) set((st) => {
      const item = st.pendingItems.find((i) => i.id === id)
      if (!item) return st
      return { pendingItems: st.pendingItems.filter((i) => i.id !== id), completedItems: [{ ...item, completed: true, completed_photo_url: photoUrl || null, completed_at: new Date().toISOString() }, ...st.completedItems] }
    })
  },
  deleteItem: async (id) => {
    const s = getSupabaseClient()
    await s.from('wishlist').delete().eq('id', id)
    set((st) => ({ pendingItems: st.pendingItems.filter((i) => i.id !== id), completedItems: st.completedItems.filter((i) => i.id !== id) }))
  },
}), { name: 'onlyus-wishlist', storage: createJSONStorage(() => localStorage), partialize: (s) => ({ pendingItems: s.pendingItems, completedItems: s.completedItems }) }))
