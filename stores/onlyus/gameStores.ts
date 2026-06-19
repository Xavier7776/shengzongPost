'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { getSupabaseClient } from '@/lib/supabase-client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import dayjs from 'dayjs'

// Expense
export interface Expense { id: string; couple_id: string; user_id: string; amount: number; category: string; note: string | null; expense_date: string; created_at: string }
export const EXPENSE_CATEGORIES = [{ key: '交通', emoji: '🚗' }, { key: '餐饮', emoji: '🍜' }, { key: '礼物', emoji: '🎁' }, { key: '住宿', emoji: '🏨' }, { key: '娱乐', emoji: '🎬' }, { key: '其他', emoji: '📝' }]
interface ExpenseState {
  expenses: Expense[]; isLoading: boolean; channel: RealtimeChannel | null; currentMonth: string
  setCurrentMonth: (m: string) => void
  loadExpenses: (coupleId: string) => Promise<void>
  addExpense: (e: Omit<Expense, 'id' | 'created_at'>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  subscribe: (coupleId: string) => void
  unsubscribe: () => void
  getMonthTotal: () => number
  getCategoryBreakdown: () => Record<string, number>
  getPerPersonSplit: (myId: string) => { myTotal: number; partnerTotal: number }
}
export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [], isLoading: false, channel: null, currentMonth: dayjs().format('YYYY-MM'),
  setCurrentMonth: (m) => set({ currentMonth: m }),
  loadExpenses: async (coupleId) => {
    set({ isLoading: true }); const s = getSupabaseClient(); const month = get().currentMonth
    const start = `${month}-01`; const end = dayjs(start).endOf('month').format('YYYY-MM-DD')
    const { data } = await s.from('expenses').select('*').eq('couple_id', coupleId).gte('expense_date', start).lte('expense_date', end).order('expense_date', { ascending: false })
    set({ expenses: (data as Expense[]) || [], isLoading: false })
  },
  addExpense: async (expense) => { const s = getSupabaseClient(); const { data, error } = await s.from('expenses').insert(expense).select().single(); if (!error && data) set({ expenses: [data as Expense, ...get().expenses] }) },
  deleteExpense: async (id) => { const s = getSupabaseClient(); await s.from('expenses').delete().eq('id', id); set({ expenses: get().expenses.filter((e) => e.id !== id) }) },
  subscribe: (coupleId) => { const s = getSupabaseClient(); const { channel: ex } = get(); if (ex) s.removeChannel(ex); const ch = s.channel(`expenses-web-${coupleId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `couple_id=eq.${coupleId}` }, () => get().loadExpenses(coupleId)).subscribe(); set({ channel: ch }) },
  unsubscribe: () => { const s = getSupabaseClient(); const { channel } = get(); if (channel) { s.removeChannel(channel); set({ channel: null }) } },
  getMonthTotal: () => get().expenses.reduce((sum, e) => sum + Number(e.amount), 0),
  getCategoryBreakdown: () => { const b: Record<string, number> = {}; for (const e of get().expenses) b[e.category] = (b[e.category] || 0) + Number(e.amount); return b },
  getPerPersonSplit: (myId) => { let my = 0, pt = 0; for (const e of get().expenses) e.user_id === myId ? (my += Number(e.amount)) : (pt += Number(e.amount)); return { myTotal: my, partnerTotal: pt } },
}))

// Gomoku
export type Stone = 0 | 1 | 2
export type Board = Stone[][]
export const createEmptyBoard = (): Board => Array.from({ length: 15 }, () => Array(15).fill(0))
export interface GomokuGame { id: string; couple_id: string; black_player: string; white_player: string; board: Board; current_turn: number; winner: number | null; win_line: [number, number][] | null; move_count: number; status: string }
interface GomokuState { game: GomokuGame | null; myColor: Stone; isLoading: boolean; channel: RealtimeChannel | null; loadOrCreateGame: (coupleId: string, myId: string, partnerId: string) => Promise<void>; makeMove: (r: number, c: number) => Promise<void>; restartGame: () => Promise<void>; subscribeToGame: () => void; unsubscribe: () => void }
export const useGomokuStore = create<GomokuState>((set, get) => ({
  game: null, myColor: 1, isLoading: false, channel: null,
  loadOrCreateGame: async (coupleId, myId, partnerId) => {
    set({ isLoading: true }); const s = getSupabaseClient()
    const { data: ex } = await s.from('gomoku_games').select('*').eq('couple_id', coupleId).eq('status', 'playing').order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (ex) { set({ game: ex as GomokuGame, myColor: ex.black_player === myId ? 1 : 2, isLoading: false }); return }
    const isBlack = Math.random() < 0.5
    const { data: c } = await s.from('gomoku_games').insert({ couple_id: coupleId, black_player: isBlack ? myId : partnerId, white_player: isBlack ? partnerId : myId, board: createEmptyBoard(), current_turn: 1, winner: null, win_line: null, move_count: 0, status: 'playing' }).select().single()
    if (c) set({ game: c as GomokuGame, myColor: c.black_player === myId ? 1 : 2, isLoading: false })
  },
  makeMove: async (r, c) => {
    const { game, myColor } = get()
    if (!game || game.status !== 'playing' || game.current_turn !== myColor || game.board[r]?.[c] !== 0) return
    const s = getSupabaseClient(); const nb: Board = game.board.map((row) => [...row]); nb[r][c] = myColor
    const win = checkWin(nb, r, c, myColor); const updates: any = { board: nb, current_turn: myColor === 1 ? 2 : 1, move_count: game.move_count + 1 }
    if (win) { updates.winner = myColor; updates.win_line = win; updates.status = 'finished' }
    const { data } = await s.from('gomoku_games').update(updates).eq('id', game.id).select().single()
    if (data) set({ game: data as GomokuGame })
  },
  restartGame: async () => {
    const { game } = get(); if (!game) return; const s = getSupabaseClient()
    const { data } = await s.from('gomoku_games').update({ board: createEmptyBoard(), current_turn: 1, winner: null, win_line: null, move_count: 0, status: 'playing', black_player: game.white_player, white_player: game.black_player }).eq('id', game.id).select().single()
    if (data) { const myId = get().myColor === 1 ? game.black_player : game.white_player; set({ game: data as GomokuGame, myColor: data.black_player === myId ? 1 : 2 }) }
  },
  subscribeToGame: () => {
    const { game } = get(); if (!game) return; const s = getSupabaseClient(); const { channel: ex } = get(); if (ex) s.removeChannel(ex)
    const ch = s.channel(`gomoku-web-${game.id}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'gomoku_games', filter: `id=eq.${game.id}` }, (p: any) => { if (p.new) set({ game: p.new as GomokuGame }) }).subscribe()
    set({ channel: ch })
  },
  unsubscribe: () => { const s = getSupabaseClient(); const { channel } = get(); if (channel) { s.removeChannel(channel); set({ channel: null }) } },
}))
export function checkWin(board: Board, r: number, c: number, player: Stone): [number, number][] | null {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]]
  for (const [dr,dc] of dirs) {
    const line: [number,number][] = [[r,c]]
    for (let i=1;i<5;i++){const nr=r+dr*i,nc=c+dc*i;if(nr<0||nr>=15||nc<0||nc>=15||board[nr][nc]!==player)break;line.push([nr,nc])}
    for (let i=1;i<5;i++){const nr=r-dr*i,nc=c-dc*i;if(nr<0||nr>=15||nc<0||nc>=15||board[nr][nc]!==player)break;line.push([nr,nc])}
    if(line.length>=5)return line
  }
  return null
}

// Drawing
export interface Stroke { points: { x: number; y: number }[]; color: string; width: number }
export interface DrawingGame {
  id: string; couple_id: string; drawer: string; guesser: string; word: string;
  strokes: Stroke[]; guess_text: string | null;
  status: 'drawing' | 'correct' | 'skipped';
  round: number; drawer_score: number; guesser_score: number;
  hint_revealed: number; wrong_guesses: number;
  skip_requested: boolean; hint_requested: boolean;
}
const WORDS = [
  '猫咪','小狗','金鱼','小鸟','兔子','熊猫','老虎','狮子','大象','长颈鹿',
  '企鹅','蝴蝶','螃蟹','海豚','鲨鱼','考拉','袋鼠','刺猬',
  '苹果','香蕉','蛋糕','汉堡','披萨','面条','寿司','冰淇淋','糖果','巧克力',
  '甜甜圈','草莓','西瓜','葡萄','柠檬',
  '手机','电脑','雨伞','眼镜','钥匙','钟表','灯泡','剪刀','书本','铅笔',
  '相机','耳机','帽子','闹钟',
  '太阳','月亮','星星','云朵','彩虹','闪电','雪花','树木','花朵','山川',
  '海洋','火焰','龙卷风',
  '汽车','飞机','火车','轮船','自行车','热气球','火箭','潜艇',
  '房子','城堡','桥梁','灯塔','金字塔','摩天轮',
  '礼物','气球','钻石','爱心','王冠','风筝','足球','篮球','雪人','机器人',
  '吉他','钢琴','沙漏','魔方',
]
const rw = () => WORDS[Math.floor(Math.random() * WORDS.length)]
const MAX_WRONG = 3
function normalize(s: string): string {
  return s.trim().replace(/\s+/g, '').replace(/[，。！？、,.!?]/g, '').toLowerCase()
}
interface DrawingState {
  game: DrawingGame | null; myRole: 'drawer' | 'guesser'; myId: string;
  isLoading: boolean; channel: RealtimeChannel | null;
  loadOrCreateGame: (coupleId: string, myId: string, partnerId: string) => Promise<void>;
  addStroke: (stroke: Stroke) => Promise<void>;
  clearCanvas: () => Promise<void>;
  submitGuess: (guess: string) => Promise<void>;
  requestHint: () => Promise<void>;
  skipRound: () => Promise<void>;
  nextRound: () => Promise<void>;
  subscribeToGame: () => void;
  unsubscribe: () => void;
}
export const useDrawingStore = create<DrawingState>((set, get) => ({
  game: null, myRole: 'drawer', myId: '', isLoading: false, channel: null,
  loadOrCreateGame: async (coupleId, myId, partnerId) => {
    set({ isLoading: true, myId }); const s = getSupabaseClient()
    const { data: ex } = await s.from('drawing_games').select('*').eq('couple_id', coupleId).in('status', ['drawing']).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (ex) { set({ game: ex as DrawingGame, myRole: ex.drawer === myId ? 'drawer' : 'guesser', isLoading: false }); return }
    const roles = Math.random() < 0.5 ? { drawer: myId, guesser: partnerId } : { drawer: partnerId, guesser: myId }
    const { data: c } = await s.from('drawing_games').insert({ couple_id: coupleId, ...roles, word: rw(), strokes: [], status: 'drawing', round: 1, drawer_score: 0, guesser_score: 0, hint_revealed: 0, wrong_guesses: 0, skip_requested: false, hint_requested: false }).select().single()
    if (c) set({ game: c as DrawingGame, myRole: c.drawer === myId ? 'drawer' : 'guesser', isLoading: false })
  },
  addStroke: async (stroke) => { const { game } = get(); if (!game) return; const s = getSupabaseClient(); const ns = [...game.strokes, stroke]; await s.from('drawing_games').update({ strokes: ns }).eq('id', game.id); set({ game: { ...game, strokes: ns } }) },
  clearCanvas: async () => { const { game } = get(); if (!game) return; const s = getSupabaseClient(); await s.from('drawing_games').update({ strokes: [] }).eq('id', game.id); set({ game: { ...game, strokes: [] } }) },
  submitGuess: async (guess) => {
    const { game } = get(); if (!game || game.status !== 'drawing') return
    const s = getSupabaseClient(); const ok = normalize(guess) === normalize(game.word)
    const u: Record<string, unknown> = { guess_text: guess.trim() }
    if (ok) { u.status = 'correct'; u.guesser_score = game.guesser_score + 1 }
    else { const wg = (game.wrong_guesses || 0) + 1; u.wrong_guesses = wg; if (wg >= MAX_WRONG) u.status = 'skipped' }
    await s.from('drawing_games').update(u).eq('id', game.id); set({ game: { ...game, ...u } as DrawingGame })
  },
  requestHint: async () => {
    const { game } = get(); if (!game || game.status !== 'drawing') return
    const next = game.hint_revealed + 1; if (next >= game.word.length) return
    const s = getSupabaseClient(); await s.from('drawing_games').update({ hint_revealed: next }).eq('id', game.id)
    set({ game: { ...game, hint_revealed: next } })
  },
  skipRound: async () => {
    const { game } = get(); if (!game || game.status !== 'drawing') return
    const s = getSupabaseClient(); await s.from('drawing_games').update({ status: 'skipped', skip_requested: true }).eq('id', game.id)
    set({ game: { ...game, status: 'skipped', skip_requested: true } })
  },
  nextRound: async () => {
    const { game, myId } = get(); if (!game) return; const s = getSupabaseClient()
    const { data } = await s.from('drawing_games').update({ drawer: game.guesser, guesser: game.drawer, word: rw(), strokes: [], guess_text: null, status: 'drawing', round: game.round + 1, hint_revealed: 0, wrong_guesses: 0, skip_requested: false, hint_requested: false }).eq('id', game.id).select().single()
    if (data) set({ game: data as DrawingGame, myRole: data.drawer === myId ? 'drawer' : 'guesser' })
  },
  subscribeToGame: () => {
    const { game, myId } = get(); if (!game) return; const s = getSupabaseClient(); const { channel: ex } = get(); if (ex) s.removeChannel(ex)
    const ch = s.channel(`drawing-web-${game.id}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'drawing_games', filter: `id=eq.${game.id}` }, (p: { new: DrawingGame }) => { if (p.new) set({ game: p.new, myRole: p.new.drawer === myId ? 'drawer' : 'guesser' }) }).subscribe()
    set({ channel: ch })
  },
  unsubscribe: () => { const s = getSupabaseClient(); const { channel } = get(); if (channel) { s.removeChannel(channel); set({ channel: null }) } },
}))
