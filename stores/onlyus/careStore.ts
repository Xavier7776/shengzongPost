'use client'

import { create } from 'zustand'
import { getSupabaseClient } from '@/lib/supabase-client'

export interface CareMessage {
  id: string; sender_id: string; receiver_id: string
  message_type: string; message_text: string; read: boolean; created_at: string
}

interface CareState {
  messages: CareMessage[]; unreadCount: number
  loadMessages: (userId: string) => Promise<void>
  sendCare: (senderId: string, receiverId: string, type: string, text: string) => Promise<void>
  markRead: (id: string) => void
  subscribeToNew: (userId: string, onNew: (msg: CareMessage) => void) => () => void
}

export const useCareStore = create<CareState>()((set, get) => ({
  messages: [], unreadCount: 0,
  loadMessages: async (userId) => {
    const s = getSupabaseClient()
    const { data } = await s.from('care_messages').select('*')
      .eq('receiver_id', userId).order('created_at', { ascending: false }).limit(20)
    if (data) set({ messages: data, unreadCount: data.filter(m => !m.read).length })
  },
  sendCare: async (senderId, receiverId, type, text) => {
    const s = getSupabaseClient()
    const { data, error } = await s.from('care_messages').insert({
      sender_id: senderId, receiver_id: receiverId,
      message_type: type, message_text: text,
    }).select().single()
    if (!error && data) set((st) => ({ messages: [data, ...st.messages] }))
  },
  markRead: (id) => {
    set((st) => ({
      messages: st.messages.map(m => m.id === id ? { ...m, read: true } : m),
      unreadCount: Math.max(0, st.unreadCount - 1),
    }))
    const s = getSupabaseClient()
    s.from('care_messages').update({ read: true }).eq('id', id)
  },
  subscribeToNew: (userId, onNew) => {
    const s = getSupabaseClient()
    const channel = s.channel(`care-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'care_messages',
        filter: `receiver_id=eq.${userId}`,
      }, (payload) => {
        const msg = payload.new as CareMessage
        onNew(msg)
        set((st) => ({ messages: [msg, ...st.messages], unreadCount: st.unreadCount + 1 }))
      })
      .subscribe()
    return () => { s.removeChannel(channel) }
  },
}))
