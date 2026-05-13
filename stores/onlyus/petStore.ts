'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { getSupabaseClient } from '@/lib/supabase-client'

export interface SpriteFrame {
  url: string; cols: number; rows: number; fps: number
}

export interface Pet {
  id: string; couple_id: string; name: string
  level: number; exp: number; happiness: number; hunger: number
  pet_type: string; custom_sprites: Record<string, SpriteFrame> | null
  last_fed_at: string | null; last_played_at: string | null
  created_at: string
}

export interface PetAction {
  id: string; pet_id: string; user_id: string
  action_type: string; value: number; created_at: string
}

const PET_TYPES: { key: string; emoji: string; label: string }[] = [
  { key: 'cat', emoji: '🐱', label: '猫咪' },
  { key: 'dog', emoji: '🐶', label: '狗狗' },
  { key: 'rabbit', emoji: '🐰', label: '兔子' },
]

const FEED_COOLDOWN = 30 * 60 * 1000 // 30 min
const PLAY_COOLDOWN = 30 * 60 * 1000

function expForLevel(level: number) {
  return level * 100
}

function clampStat(v: number) {
  return Math.max(0, Math.min(100, v))
}

interface PetState {
  pet: Pet | null; actions: PetAction[]; isLoading: boolean
  loadPet: (coupleId: string) => Promise<void>
  createPet: (coupleId: string, name: string, petType: string) => Promise<void>
  feedPet: (userId: string) => Promise<void>
  playWithPet: (userId: string) => Promise<void>
  renamePet: (name: string) => Promise<void>
  uploadSprite: (spriteKey: string, file: File, cols?: number, rows?: number, fps?: number) => Promise<void>
  canFeed: () => boolean
  canPlay: () => boolean
  _checkLevelUp: () => Promise<void>
}

export const usePetStore = create<PetState>()(persist((set, get) => ({
  pet: null, actions: [], isLoading: false,

  loadPet: async (coupleId) => {
    set({ isLoading: true })
    const s = getSupabaseClient()

    // Ensure pets storage bucket exists (idempotent)
    try {
      const { error: createErr } = await s.storage.createBucket('pets', { public: true })
      // "Bucket already exists" is fine — only throw on real errors
      if (createErr && !createErr.message?.includes('already exists')) {
        console.error('[pet] createBucket error:', createErr)
      }
    } catch (e: any) {
      // ignore if bucket already exists
      if (!e?.message?.includes('already exists')) {
        console.error('[pet] createBucket exception:', e)
      }
    }

    const { data } = await s.from('virtual_pets').select('*').eq('couple_id', coupleId).limit(1).single()

    if (data) {
      // Apply time-based decay
      const now = Date.now()
      let happiness = data.happiness
      let hunger = data.hunger

      if (data.last_played_at) {
        const hoursSince = (now - new Date(data.last_played_at).getTime()) / (1000 * 60 * 60)
        happiness = clampStat(happiness - Math.floor(hoursSince * 2))
      }
      if (data.last_fed_at) {
        const hoursSince = (now - new Date(data.last_fed_at).getTime()) / (1000 * 60 * 60)
        hunger = clampStat(hunger - Math.floor(hoursSince * 2))
      }

      // Update decayed stats if changed
      if (happiness !== data.happiness || hunger !== data.hunger) {
        await s.from('virtual_pets').update({ happiness, hunger }).eq('id', data.id)
      }

      set({ pet: { ...data, happiness, hunger }, isLoading: false })

      // Load recent actions
      const { data: acts } = await s.from('pet_actions').select('*').eq('pet_id', data.id)
        .order('created_at', { ascending: false }).limit(20)
      if (acts) set({ actions: acts })
    } else {
      set({ pet: null, isLoading: false })
    }
  },

  createPet: async (coupleId, name, petType) => {
    const s = getSupabaseClient()
    const { data, error } = await s.from('virtual_pets').insert({
      couple_id: coupleId, name, pet_type: petType,
      happiness: 80, hunger: 50,
    }).select().single()
    if (!error && data) set({ pet: data })
  },

  feedPet: async (userId) => {
    const { pet, canFeed } = get()
    if (!pet || !canFeed()) return
    const s = getSupabaseClient()

    const newHunger = clampStat(pet.hunger + 20)
    const newExp = pet.exp + 5
    const now = new Date().toISOString()

    const { data } = await s.from('virtual_pets').update({
      hunger: newHunger, exp: newExp, last_fed_at: now,
    }).eq('id', pet.id).select().single()

    if (data) {
      set({ pet: data })
      // Record action
      await s.from('pet_actions').insert({ pet_id: pet.id, user_id: userId, action_type: 'feed', value: 20 })
      // Check level up
      get()._checkLevelUp()
    }
  },

  playWithPet: async (userId) => {
    const { pet, canPlay } = get()
    if (!pet || !canPlay()) return
    const s = getSupabaseClient()

    const newHappiness = clampStat(pet.happiness + 15)
    const newExp = pet.exp + 8
    const now = new Date().toISOString()

    const { data } = await s.from('virtual_pets').update({
      happiness: newHappiness, exp: newExp, last_played_at: now,
    }).eq('id', pet.id).select().single()

    if (data) {
      set({ pet: data })
      await s.from('pet_actions').insert({ pet_id: pet.id, user_id: userId, action_type: 'play', value: 15 })
      get()._checkLevelUp()
    }
  },

  renamePet: async (name) => {
    const { pet } = get()
    if (!pet) return
    const s = getSupabaseClient()
    const { data } = await s.from('virtual_pets').update({ name }).eq('id', pet.id).select().single()
    if (data) set({ pet: data })
  },

  uploadSprite: async (spriteKey, file, cols = 1, rows = 1, fps = 8) => {
    const { pet } = get()
    if (!pet) return
    const s = getSupabaseClient()

    // Ensure bucket exists before upload
    try {
      await s.storage.createBucket('pets', { public: true })
    } catch {
      // already exists — fine
    }

    const filePath = `${pet.id}/${spriteKey}-${Date.now()}.${file.name.split('.').pop()}`
    const { data: uploadData, error: uploadError } = await s.storage.from('pets').upload(filePath, file, {
      contentType: file.type || 'image/png',
      upsert: true,
    })
    if (uploadError) {
      console.error('[pet] sprite upload error:', uploadError)
      throw new Error(uploadError.message?.includes('Bucket not found')
        ? '请先在 Supabase Dashboard → Storage 中创建名为 "pets" 的存储桶'
        : uploadError.message)
    }

    // Try public URL first, fall back to signed URL
    const { data: urlData } = s.storage.from('pets').getPublicUrl(filePath)
    let spriteUrl = urlData.publicUrl

    try {
      const res = await fetch(spriteUrl, { method: 'HEAD' })
      if (!res.ok) {
        const { data: signed } = await s.storage.from('pets').createSignedUrl(filePath, 365 * 24 * 60 * 60)
        if (signed?.signedUrl) spriteUrl = signed.signedUrl
      }
    } catch {
      const { data: signed } = await s.storage.from('pets').createSignedUrl(filePath, 365 * 24 * 60 * 60)
      if (signed?.signedUrl) spriteUrl = signed.signedUrl
    }

    const sprites = { ...(pet.custom_sprites || {}), [spriteKey]: { url: spriteUrl, cols, rows, fps } }

    const { data } = await s.from('virtual_pets').update({ custom_sprites: sprites }).eq('id', pet.id).select().single()
    if (data) set({ pet: data })
  },

  canFeed: () => {
    const { pet } = get()
    if (!pet || !pet.last_fed_at) return true
    return Date.now() - new Date(pet.last_fed_at).getTime() > FEED_COOLDOWN
  },

  canPlay: () => {
    const { pet } = get()
    if (!pet || !pet.last_played_at) return true
    return Date.now() - new Date(pet.last_played_at).getTime() > PLAY_COOLDOWN
  },

  // Internal: check and apply level up
  _checkLevelUp: async () => {
    const { pet } = get()
    if (!pet) return
    const required = expForLevel(pet.level)
    if (pet.exp < required) return

    const s = getSupabaseClient()
    const { data } = await s.from('virtual_pets').update({
      level: pet.level + 1,
      exp: pet.exp - required,
    }).eq('id', pet.id).select().single()
    if (data) set({ pet: data })
  },
}), { name: 'onlyus-pet', storage: createJSONStorage(() => localStorage), partialize: (s) => ({ pet: s.pet }) }))

export { PET_TYPES, expForLevel }
