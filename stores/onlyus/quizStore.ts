'use client'

import { create } from 'zustand'
import { getSupabaseClient } from '@/lib/supabase-client'

export interface QuizQuestion {
  id: string; question_text: string; question_type: 'open' | 'choice'
  options: string[] | null; category: string
}

export interface QuizSession {
  id: string; couple_id: string; question_id: string; mode: string
  user1_answer: string | null; user2_answer: string | null
  user1_answered_at: string | null; user2_answered_at: string | null
  is_match: boolean | null; score_awarded: number
  time_limit_seconds: number; status: string; created_at: string
  question?: QuizQuestion
}

export interface QuizScore {
  couple_id: string; user_id: string
  total_score: number; total_matches: number; total_played: number
}

interface QuizState {
  questions: QuizQuestion[]; currentSession: QuizSession | null
  scores: QuizScore[]; history: QuizSession[]; isLoading: boolean
  loadError: string | null
  loadQuestions: () => Promise<void>
  loadScores: (coupleId: string) => Promise<void>
  loadHistory: (coupleId: string) => Promise<void>
  startSession: (coupleId: string, questionId: string, mode?: string) => Promise<QuizSession | null>
  submitAnswer: (sessionId: string, userId: string, answer: string) => Promise<void>
  setCurrentSession: (s: QuizSession | null) => void
  subscribeToSession: (sessionId: string, onUpdate: (session: QuizSession) => void) => () => void
}

export const useQuizStore = create<QuizState>()((set, get) => ({
  questions: [], currentSession: null, scores: [], history: [], isLoading: false, loadError: null,

  loadQuestions: async () => {
    const s = getSupabaseClient()
    set({ isLoading: true, loadError: null })
    try {
      const { data, error, status, statusText } = await s.from('quiz_questions').select('*').order('created_at')
      console.log('[quiz] questions result:', { status, statusText, count: data?.length, error })
      if (error) {
        const msg = `${status || ''} ${error.message || JSON.stringify(error)}`
        console.error('[quiz] loadQuestions error:', msg)
        set({ loadError: msg })
        return
      }
      set({ questions: data || [], loadError: null })
    } catch (err: any) {
      const msg = err?.message || String(err)
      console.error('[quiz] loadQuestions exception:', msg)
      set({ loadError: msg })
    } finally {
      set({ isLoading: false })
    }
  },

  loadScores: async (coupleId) => {
    const s = getSupabaseClient()
    const { data } = await s.from('quiz_scores').select('*').eq('couple_id', coupleId)
    if (data) set({ scores: data })
  },

  loadHistory: async (coupleId) => {
    set({ isLoading: true })
    const s = getSupabaseClient()
    const { data } = await s.from('quiz_sessions').select('*, question:quiz_questions(*)')
      .eq('couple_id', coupleId).order('created_at', { ascending: false }).limit(20)
    set({ history: data || [], isLoading: false })
  },

  startSession: async (coupleId, questionId, mode = 'quiz') => {
    const s = getSupabaseClient()
    const question = get().questions.find(q => q.id === questionId)
    const { data, error } = await s.from('quiz_sessions').insert({
      couple_id: coupleId, question_id: questionId, mode,
      time_limit_seconds: mode === 'compatibility' ? 60 : 0,
      status: 'waiting',
    }).select().single()
    if (error) {
      console.error('[quiz] startSession error:', error)
      throw new Error(error.message || '创建会话失败')
    }
    if (data) {
      const session = { ...data, question }
      set({ currentSession: session })
      return session
    }
    return null
  },

  submitAnswer: async (sessionId, userId, answer) => {
    const s = getSupabaseClient()
    const session = get().currentSession
    if (!session) return

    const isUser1 = userId === '11111111-1111-1111-1111-111111111111'
    const field = isUser1 ? 'user1_answer' : 'user2_answer'
    const timeField = isUser1 ? 'user1_answered_at' : 'user2_answered_at'

    const { data, error } = await s.from('quiz_sessions').update({
      [field]: answer, [timeField]: new Date().toISOString(),
    }).eq('id', sessionId).select().single()

    if (!error && data) {
      // Check if both answered
      const updated = data
      if (updated.user1_answer && updated.user2_answer) {
        const isMatch = updated.user1_answer.trim().toLowerCase() === updated.user2_answer.trim().toLowerCase()
        await s.from('quiz_sessions').update({
          is_match: isMatch, status: 'revealed',
          score_awarded: isMatch ? 10 : 0,
        }).eq('id', sessionId)

        // Update scores
        const scoreField = isUser1 ? updated.user1_answer : updated.user2_answer
        if (isMatch) {
          await s.from('quiz_scores').upsert({
            couple_id: session.couple_id, user_id: userId,
            total_score: 10, total_matches: 1, total_played: 1,
          }, { onConflict: 'couple_id,user_id', ignoreDuplicates: false })
        }

        const finalSession = { ...updated, is_match: isMatch, status: 'revealed', score_awarded: isMatch ? 10 : 0, question: session.question }
        set({ currentSession: finalSession })
      } else {
        set({ currentSession: { ...updated, question: session.question } })
      }
    }
  },

  setCurrentSession: (s) => set({ currentSession: s }),

  subscribeToSession: (sessionId, onUpdate) => {
    const supabase = getSupabaseClient()
    const channel = supabase.channel(`quiz-session-${sessionId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'quiz_sessions',
        filter: `id=eq.${sessionId}`,
      }, (payload) => {
        const updated = payload.new as QuizSession
        const current = get().currentSession
        onUpdate({ ...updated, question: current?.question })
        set({ currentSession: { ...updated, question: current?.question } })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  },
}))
