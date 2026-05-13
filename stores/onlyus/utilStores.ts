'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { getSupabaseClient } from '@/lib/supabase-client'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Calendar
export interface CalendarEvent {
  id: string; couple_id: string; created_by: string; title: string
  date: string; end_date: string; color: string | null; note: string | null; created_at: string
}
interface CalendarState {
  events: CalendarEvent[]; isLoading: boolean
  loadEvents: (coupleId: string) => Promise<void>
  addEvent: (e: Omit<CalendarEvent, 'id' | 'created_at'>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
}
export const useCalendarStore = create<CalendarState>()(persist((set) => ({
  events: [], isLoading: false,
  loadEvents: async (coupleId) => {
    set({ isLoading: true })
    const s = getSupabaseClient()
    const { data } = await s.from('calendar_events').select('*').eq('couple_id', coupleId).order('date', { ascending: true })
    set({ events: data || [], isLoading: false })
  },
  addEvent: async (event) => {
    const s = getSupabaseClient()
    const { data, error } = await s.from('calendar_events').insert(event).select().single()
    if (error) throw error
    if (data) set((st) => ({ events: [...st.events, data].sort((a, b) => a.date.localeCompare(b.date)) }))
  },
  deleteEvent: async (id) => {
    const s = getSupabaseClient()
    await s.from('calendar_events').delete().eq('id', id)
    set((st) => ({ events: st.events.filter((e) => e.id !== id) }))
  },
}), { name: 'onlyus-calendar', storage: createJSONStorage(() => localStorage), partialize: (s) => ({ events: s.events }) }))

// Ping
interface PingState {
  lastPingAt: number | null; incomingPing: number | null; channel: RealtimeChannel | null
  sendPing: (senderId: string, receiverId: string) => Promise<void>
  subscribeToIncoming: (myId: string) => void
  clearIncoming: () => void
  unsubscribe: () => void
}
export const usePingStore = create<PingState>((set, get) => ({
  lastPingAt: null, incomingPing: null, channel: null,
  sendPing: async (senderId, receiverId) => {
    const { lastPingAt } = get()
    if (lastPingAt && Date.now() - lastPingAt < 30000) return
    const s = getSupabaseClient()
    await s.from('pings').insert({ sender_id: senderId, receiver_id: receiverId })
    set({ lastPingAt: Date.now() })
  },
  subscribeToIncoming: (myId) => {
    const s = getSupabaseClient()
    const { channel: ex } = get(); if (ex) s.removeChannel(ex)
    const ch = s.channel('ping-web')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pings', filter: `receiver_id=eq.${myId}` }, () => set({ incomingPing: Date.now() }))
      .subscribe()
    set({ channel: ch })
  },
  clearIncoming: () => set({ incomingPing: null }),
  unsubscribe: () => { const s = getSupabaseClient(); const { channel } = get(); if (channel) { s.removeChannel(channel); set({ channel: null }) } },
}))

// Goodnight
const todayStr = () => new Date().toISOString().split('T')[0]
interface GoodnightState {
  myCheckin: boolean; partnerCheckin: boolean; bothCheckedIn: boolean
  streak: number; isLoading: boolean; channel: RealtimeChannel | null
  loadToday: (myId: string, partnerId: string) => Promise<void>
  loadStreak: (myId: string, partnerId: string) => Promise<void>
  checkin: (userId: string) => Promise<void>
  subscribeToPartner: (partnerId: string) => void
  unsubscribe: () => void
}
export const useGoodnightStore = create<GoodnightState>((set, get) => ({
  myCheckin: false, partnerCheckin: false, bothCheckedIn: false, streak: 0, isLoading: false, channel: null,
  loadToday: async (myId, partnerId) => {
    set({ isLoading: true })
    const date = todayStr(); const s = getSupabaseClient()
    const [my, partner] = await Promise.all([
      s.from('goodnights').select('id').eq('user_id', myId).eq('checkin_date', date).maybeSingle(),
      s.from('goodnights').select('id').eq('user_id', partnerId).eq('checkin_date', date).maybeSingle(),
    ])
    const mc = !!my.data, pc = !!partner.data
    set({ myCheckin: mc, partnerCheckin: pc, bothCheckedIn: mc && pc, isLoading: false })
  },
  loadStreak: async (myId, partnerId) => {
    const s = getSupabaseClient()
    const { data } = await s.from('goodnights').select('user_id,checkin_date').in('user_id', [myId, partnerId]).order('checkin_date', { ascending: false }).limit(120)
    if (!data) return
    const byDate = new Map<string, Set<string>>()
    for (const r of data) { if (!byDate.has(r.checkin_date)) byDate.set(r.checkin_date, new Set()); byDate.get(r.checkin_date)!.add(r.user_id) }
    let streak = 0; const d = new Date()
    while (true) { const k = d.toISOString().split('T')[0]; const u = byDate.get(k); if (u?.has(myId) && u?.has(partnerId)) { streak++; d.setDate(d.getDate() - 1) } else break }
    set({ streak })
  },
  checkin: async (userId) => {
    const s = getSupabaseClient()
    const { error } = await s.from('goodnights').insert({ user_id: userId, checkin_date: todayStr() })
    if (error) throw error
    const { partnerCheckin } = get(); set({ myCheckin: true, bothCheckedIn: partnerCheckin })
  },
  subscribeToPartner: (partnerId) => {
    const s = getSupabaseClient(); const { channel: ex } = get(); if (ex) s.removeChannel(ex)
    const ch = s.channel('goodnight-web')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'goodnights', filter: `user_id=eq.${partnerId}` }, (p: any) => {
        if (p.new?.checkin_date === todayStr()) { const { myCheckin } = get(); set({ partnerCheckin: true, bothCheckedIn: myCheckin }) }
      }).subscribe()
    set({ channel: ch })
  },
  unsubscribe: () => { const s = getSupabaseClient(); const { channel } = get(); if (channel) { s.removeChannel(channel); set({ channel: null }) } },
}))

// Morning Checkin
interface MorningState {
  myCheckin: boolean; partnerCheckin: boolean; bothCheckedIn: boolean
  streak: number; isLoading: boolean; channel: RealtimeChannel | null
  loadToday: (myId: string, partnerId: string) => Promise<void>
  loadStreak: (myId: string, partnerId: string) => Promise<void>
  checkin: (userId: string) => Promise<void>
  subscribeToPartner: (partnerId: string) => void
  unsubscribe: () => void
}
export const useMorningStore = create<MorningState>((set, get) => ({
  myCheckin: false, partnerCheckin: false, bothCheckedIn: false, streak: 0, isLoading: false, channel: null,
  loadToday: async (myId, partnerId) => {
    set({ isLoading: true })
    const date = todayStr(); const s = getSupabaseClient()
    const [my, partner] = await Promise.all([
      s.from('morning_checkins').select('id').eq('user_id', myId).eq('checkin_date', date).maybeSingle(),
      s.from('morning_checkins').select('id').eq('user_id', partnerId).eq('checkin_date', date).maybeSingle(),
    ])
    const mc = !!my.data, pc = !!partner.data
    set({ myCheckin: mc, partnerCheckin: pc, bothCheckedIn: mc && pc, isLoading: false })
  },
  loadStreak: async (myId, partnerId) => {
    const s = getSupabaseClient()
    const { data } = await s.from('morning_checkins').select('user_id,checkin_date').in('user_id', [myId, partnerId]).order('checkin_date', { ascending: false }).limit(120)
    if (!data) return
    const byDate = new Map<string, Set<string>>()
    for (const r of data) { if (!byDate.has(r.checkin_date)) byDate.set(r.checkin_date, new Set()); byDate.get(r.checkin_date)!.add(r.user_id) }
    let streak = 0; const d = new Date()
    while (true) { const k = d.toISOString().split('T')[0]; const u = byDate.get(k); if (u?.has(myId) && u?.has(partnerId)) { streak++; d.setDate(d.getDate() - 1) } else break }
    set({ streak })
  },
  checkin: async (userId) => {
    const s = getSupabaseClient()
    const { error } = await s.from('morning_checkins').insert({ user_id: userId, checkin_date: todayStr() })
    if (error) throw error
    const { partnerCheckin } = get(); set({ myCheckin: true, bothCheckedIn: partnerCheckin })
  },
  subscribeToPartner: (partnerId) => {
    const s = getSupabaseClient(); const { channel: ex } = get(); if (ex) s.removeChannel(ex)
    const ch = s.channel('morning-web')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'morning_checkins', filter: `user_id=eq.${partnerId}` }, (p: any) => {
        if (p.new?.checkin_date === todayStr()) { const { myCheckin } = get(); set({ partnerCheckin: true, bothCheckedIn: myCheckin }) }
      }).subscribe()
    set({ channel: ch })
  },
  unsubscribe: () => { const s = getSupabaseClient(); const { channel } = get(); if (channel) { s.removeChannel(channel); set({ channel: null }) } },
}))

// Question
export interface DailyQuestion { id: string; question_text: string; date: string }
export interface QuestionAnswer { id: string; question_id: string; user_id: string; answer: string; created_at: string }
interface QuestionState {
  todayQuestion: DailyQuestion | null; myAnswer: QuestionAnswer | null; partnerAnswer: QuestionAnswer | null
  history: { question: DailyQuestion; myAnswer: QuestionAnswer | null; partnerAnswer: QuestionAnswer | null }[]
  isLoading: boolean
  loadToday: (userId: string, partnerId: string) => Promise<void>
  submitAnswer: (questionId: string, userId: string, answer: string) => Promise<void>
  loadHistory: (userId: string, partnerId: string) => Promise<void>
}
export const useQuestionStore = create<QuestionState>()(persist((set) => ({
  todayQuestion: null, myAnswer: null, partnerAnswer: null, history: [], isLoading: false,
  loadToday: async (userId, partnerId) => {
    set({ isLoading: true })
    const s = getSupabaseClient(); const today = new Date().toISOString().split('T')[0]
    const { data: q } = await s.from('daily_questions').select('*').eq('date', today).single()
    if (q) {
      const [my, partner] = await Promise.all([
        s.from('question_answers').select('*').eq('question_id', q.id).eq('user_id', userId).single(),
        s.from('question_answers').select('*').eq('question_id', q.id).eq('user_id', partnerId).single(),
      ])
      set({ todayQuestion: q, myAnswer: my.data ?? null, partnerAnswer: partner.data ?? null, isLoading: false })
    } else set({ todayQuestion: null, myAnswer: null, partnerAnswer: null, isLoading: false })
  },
  submitAnswer: async (questionId, userId, answer) => {
    const s = getSupabaseClient()
    const { error } = await s.from('question_answers').upsert({ question_id: questionId, user_id: userId, answer }, { onConflict: 'question_id,user_id' })
    if (!error) { const { data } = await s.from('question_answers').select('*').eq('question_id', questionId).eq('user_id', userId).single(); set({ myAnswer: data }) }
  },
  loadHistory: async (userId, partnerId) => {
    const s = getSupabaseClient(); const today = new Date().toISOString().split('T')[0]
    const { data: questions } = await s.from('daily_questions').select('*').lt('date', today).order('date', { ascending: false }).limit(10)
    if (!questions) return
    const history = await Promise.all(questions.map(async (q) => {
      const [my, partner] = await Promise.all([
        s.from('question_answers').select('*').eq('question_id', q.id).eq('user_id', userId).single(),
        s.from('question_answers').select('*').eq('question_id', q.id).eq('user_id', partnerId).single(),
      ])
      return { question: q, myAnswer: my.data ?? null, partnerAnswer: partner.data ?? null }
    }))
    set({ history })
  },
}), { name: 'onlyus-questions', storage: createJSONStorage(() => localStorage), partialize: (s) => ({ todayQuestion: s.todayQuestion, myAnswer: s.myAnswer, partnerAnswer: s.partnerAnswer, history: s.history }) }))
