'use client'

import { create } from 'zustand'
import { getSupabaseClient } from '@/lib/supabase-client'

export interface MovieRecord {
  id: string
  couple_id: string
  added_by: string
  title: string
  poster_url: string | null
  overview: string | null
  director: string | null
  actors: string | null
  genre: string | null
  rating: number | null
  release_year: number | null
  watched_at: string | null
  watch_note: string | null
  tmdb_id: number | null
  created_at: string
}

export interface TMDBResult {
  id: number
  title: string
  original_title: string
  overview: string
  poster_path: string | null
  release_date: string
  vote_average: number
  genre_ids: number[]
}

interface MovieState {
  movies: MovieRecord[]
  isLoading: boolean
  searchResults: TMDBResult[]
  isSearching: boolean
  loadMovies: (coupleId: string) => Promise<void>
  addMovie: (movie: Omit<MovieRecord, 'id' | 'created_at'>) => Promise<void>
  updateMovie: (id: string, updates: Partial<MovieRecord>) => Promise<void>
  deleteMovie: (id: string) => Promise<void>
  searchTMDB: (query: string) => Promise<void>
  clearSearch: () => void
  fetchMovieDetail: (tmdbId: number) => Promise<{ director: string; actors: string; genres: string } | null>
}

const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMG = 'https://image.tmdb.org/t/p'

function getTMDBKey(): string {
  return process.env.NEXT_PUBLIC_TMDB_API_KEY || ''
}

export const useMovieStore = create<MovieState>()((set, get) => ({
  movies: [],
  isLoading: false,
  searchResults: [],
  isSearching: false,

  loadMovies: async (coupleId) => {
    set({ isLoading: true })
    const s = getSupabaseClient()
    const { data } = await s.from('movie_records')
      .select('*')
      .eq('couple_id', coupleId)
      .order('watched_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
    set({ movies: data || [], isLoading: false })
  },

  addMovie: async (movie) => {
    const s = getSupabaseClient()
    const { data, error } = await s.from('movie_records')
      .insert(movie)
      .select()
      .single()
    if (!error && data) {
      set({ movies: [data, ...get().movies] })
    }
  },

  updateMovie: async (id, updates) => {
    const s = getSupabaseClient()
    const { data, error } = await s.from('movie_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      set({ movies: get().movies.map(m => m.id === id ? data : m) })
    }
  },

  deleteMovie: async (id) => {
    const s = getSupabaseClient()
    await s.from('movie_records').delete().eq('id', id)
    set({ movies: get().movies.filter(m => m.id !== id) })
  },

  searchTMDB: async (query) => {
    if (!query.trim()) { set({ searchResults: [] }); return }
    const key = getTMDBKey()
    if (!key) {
      console.warn('[movie] TMDB API key not set (NEXT_PUBLIC_TMDB_API_KEY)')
      set({ searchResults: [] })
      return
    }
    set({ isSearching: true })
    try {
      const res = await fetch(
        `${TMDB_BASE}/search/movie?api_key=${key}&query=${encodeURIComponent(query)}&language=zh-CN&page=1`
      )
      const json = await res.json()
      set({ searchResults: json.results || [] })
    } catch (err) {
      console.error('[movie] TMDB search error:', err)
      set({ searchResults: [] })
    } finally {
      set({ isSearching: false })
    }
  },

  clearSearch: () => set({ searchResults: [] }),

  fetchMovieDetail: async (tmdbId) => {
    const key = getTMDBKey()
    if (!key) return null
    try {
      const [movieRes, creditsRes] = await Promise.all([
        fetch(`${TMDB_BASE}/movie/${tmdbId}?api_key=${key}&language=zh-CN`),
        fetch(`${TMDB_BASE}/movie/${tmdbId}/credits?api_key=${key}&language=zh-CN`),
      ])
      const movie = await movieRes.json()
      const credits = await creditsRes.json()
      const director = (credits.crew || []).find((c: any) => c.job === 'Director')?.name || ''
      const actors = (credits.cast || []).slice(0, 5).map((a: any) => a.name).join('、')
      const genres = (movie.genres || []).map((g: any) => g.name).join('、')
      return { director, actors, genres }
    } catch {
      return null
    }
  },
}))

export function tmdbPosterUrl(path: string | null, size: string = 'w342'): string {
  if (!path) return ''
  return `${TMDB_IMG}/${size}${path}`
}
