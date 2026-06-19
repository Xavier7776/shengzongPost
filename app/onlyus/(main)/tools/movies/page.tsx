'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useOnlyUsAuthStore } from '@/stores/onlyus/authStore'
import { useMovieStore, tmdbPosterUrl, type MovieRecord, type TMDBResult } from '@/stores/onlyus/movieStore'

export default function MoviesPage() {
  const { profile, coupleInfo } = useOnlyUsAuthStore()
  const {
    movies, isLoading, searchResults, isSearching,
    loadMovies, addMovie, updateMovie, deleteMovie, searchTMDB, clearSearch, fetchMovieDetail,
  } = useMovieStore()

  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTMDB, setSelectedTMDB] = useState<TMDBResult | null>(null)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formOverview, setFormOverview] = useState('')
  const [formDirector, setFormDirector] = useState('')
  const [formActors, setFormActors] = useState('')
  const [formGenre, setFormGenre] = useState('')
  const [formRating, setFormRating] = useState('')
  const [formYear, setFormYear] = useState('')
  const [formWatchedAt, setFormWatchedAt] = useState('')
  const [formNote, setFormNote] = useState('')
  const [formPosterUrl, setFormPosterUrl] = useState('')
  const [formTmdbId, setFormTmdbId] = useState<number | null>(null)

  const searchTimer = useRef<ReturnType<typeof setTimeout>>()
  const coupleId = coupleInfo?.id
  const userId = profile?.id

  useEffect(() => {
    if (coupleId) loadMovies(coupleId)
  }, [coupleId, loadMovies])

  // Debounced TMDB search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!searchQuery.trim()) { clearSearch(); return }
    searchTimer.current = setTimeout(() => {
      searchTMDB(searchQuery)
    }, 400)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [searchQuery, searchTMDB, clearSearch])

  const resetForm = useCallback(() => {
    setFormTitle(''); setFormOverview(''); setFormDirector(''); setFormActors('')
    setFormGenre(''); setFormRating(''); setFormYear(''); setFormWatchedAt('')
    setFormNote(''); setFormPosterUrl(''); setFormTmdbId(null)
    setSelectedTMDB(null); setSearchQuery(''); setEditId(null); clearSearch()
  }, [clearSearch])

  const openAdd = () => { resetForm(); setShowAdd(true) }

  const openEdit = (movie: MovieRecord) => {
    setEditId(movie.id)
    setFormTitle(movie.title); setFormOverview(movie.overview || '')
    setFormDirector(movie.director || ''); setFormActors(movie.actors || '')
    setFormGenre(movie.genre || ''); setFormRating(movie.rating?.toString() || '')
    setFormYear(movie.release_year?.toString() || ''); setFormWatchedAt(movie.watched_at || '')
    setFormNote(movie.watch_note || ''); setFormPosterUrl(movie.poster_url || '')
    setFormTmdbId(movie.tmdb_id); setShowAdd(true)
  }

  const handleSelectTMDB = async (result: TMDBResult) => {
    setSelectedTMDB(result)
    setFormTitle(result.title)
    setFormOverview(result.overview)
    setFormYear(result.release_date?.slice(0, 4) || '')
    setFormRating(result.vote_average?.toString() || '')
    setFormPosterUrl(result.poster_path ? tmdbPosterUrl(result.poster_path, 'w500') : '')
    setFormTmdbId(result.id)
    clearSearch(); setSearchQuery('')
    // Fetch detail for director and actors
    const detail = await fetchMovieDetail(result.id)
    if (detail) {
      setFormDirector(detail.director)
      setFormActors(detail.actors)
      setFormGenre(detail.genres)
    }
  }

  const handleSave = async () => {
    if (!formTitle.trim() || !coupleId || !userId) return
    if (editId) {
      await updateMovie(editId, {
        title: formTitle, overview: formOverview || null,
        director: formDirector || null, actors: formActors || null,
        genre: formGenre || null, rating: formRating ? parseFloat(formRating) : null,
        release_year: formYear ? parseInt(formYear) : null,
        watched_at: formWatchedAt || null, watch_note: formNote || null,
        poster_url: formPosterUrl || null, tmdb_id: formTmdbId,
      })
    } else {
      await addMovie({
        couple_id: coupleId, added_by: userId,
        title: formTitle, overview: formOverview || null,
        director: formDirector || null, actors: formActors || null,
        genre: formGenre || null, rating: formRating ? parseFloat(formRating) : null,
        release_year: formYear ? parseInt(formYear) : null,
        watched_at: formWatchedAt || null, watch_note: formNote || null,
        poster_url: formPosterUrl || null, tmdb_id: formTmdbId,
      })
    }
    setShowAdd(false); resetForm()
  }

  const handleDelete = async (id: string) => {
    if (confirm('确定删除这条记录？')) await deleteMovie(id)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@400;500&display=swap');
        @keyframes card-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .movie-card { animation: card-rise 0.55s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      <div style={{ minHeight: '100%', padding: '40px 24px 80px', maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div className="movie-card" style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif", fontSize: 11,
              letterSpacing: '0.3em', textTransform: 'uppercase',
              color: 'rgba(196,120,90,0.7)', margin: '0 0 6px',
            }}>Movie Journal</p>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(24px, 4vw, 32px)',
              fontWeight: 400, color: '#3D2318', margin: 0,
            }}>我们的电影</h1>
          </div>
          <button onClick={openAdd} style={{
            width: 44, height: 44, borderRadius: 14,
            border: '1px solid rgba(232,132,156,0.3)',
            background: 'rgba(232,132,156,0.08)',
            color: '#E8849C', fontSize: 22, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>+</button>
        </div>

        {/* Movie Grid */}
        {isLoading ? (
          <p style={{
            textAlign: 'center', padding: '40px 0',
            fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
            fontSize: 14, color: 'rgba(61,35,24,0.4)',
          }}>加载中...</p>
        ) : movies.length === 0 ? (
          <div className="movie-card" style={{
            animationDelay: '80ms',
            background: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(16px)',
            borderRadius: 20, border: '1px solid rgba(196,120,90,0.12)',
            padding: '48px 24px', textAlign: 'center',
          }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>🎬</span>
            <p style={{
              fontFamily: "'Playfair Display', serif", fontSize: 18,
              color: '#3D2318', margin: '0 0 8px',
            }}>还没有记录</p>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
              fontSize: 13, color: 'rgba(196,120,90,0.5)', margin: 0,
            }}>点击右上角 + 添加你们一起看过的电影</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {movies.map((movie, i) => (
              <div key={movie.id} className="movie-card" style={{
                animationDelay: `${i * 60}ms`,
                background: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(16px)',
                borderRadius: 20,
                border: expandedId === movie.id ? '1px solid rgba(232,132,156,0.3)' : '1px solid rgba(196,120,90,0.12)',
                overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}>
                {/* Poster */}
                {movie.poster_url && (
                  <div style={{
                    width: '100%', height: 200, overflow: 'hidden',
                    borderRadius: '20px 20px 0 0',
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={movie.poster_url} alt={movie.title} style={{
                      width: '100%', height: '100%', objectFit: 'cover',
                    }} />
                  </div>
                )}
                <div style={{ padding: '16px 18px' }}>
                  {/* Title + Year */}
                  <h3 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 16, fontWeight: 400, color: '#3D2318',
                    margin: '0 0 4px', lineHeight: 1.3,
                  }}>
                    {movie.title}
                    {movie.release_year && (
                      <span style={{
                        fontSize: 12, color: 'rgba(196,120,90,0.5)',
                        marginLeft: 6, fontFamily: "'DM Sans', sans-serif",
                      }}>({movie.release_year})</span>
                    )}
                  </h3>

                  {/* Rating */}
                  {movie.rating != null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: '#F5A623' }}>★</span>
                      <span style={{
                        fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                        color: 'rgba(61,35,24,0.6)',
                      }}>{movie.rating.toFixed(1)}</span>
                    </div>
                  )}

                  {/* Director */}
                  {movie.director && (
                    <p style={{
                      fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                      color: 'rgba(61,35,24,0.45)', margin: '0 0 2px',
                    }}>导演: {movie.director}</p>
                  )}

                  {/* Actors (truncated) */}
                  {movie.actors && (
                    <p style={{
                      fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                      color: 'rgba(61,35,24,0.35)', margin: '0 0 6px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{movie.actors}</p>
                  )}

                  {/* Watched date */}
                  {movie.watched_at && (
                    <p style={{
                      fontSize: 10, fontFamily: "'Cormorant Garamond', serif",
                      color: 'rgba(232,132,156,0.6)', margin: '0 0 8px',
                    }}>观影: {new Date(movie.watched_at).toLocaleDateString('zh-CN')}</p>
                  )}

                  {/* Expand / Actions */}
                  <button onClick={() => setExpandedId(expandedId === movie.id ? null : movie.id)} style={{
                    width: '100%', padding: '6px 0', border: 'none',
                    background: 'transparent', cursor: 'pointer',
                    fontSize: 11, color: 'rgba(196,120,90,0.5)',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>{expandedId === movie.id ? '收起' : '详情'}</button>

                  {expandedId === movie.id && (
                    <div style={{ animation: 'fade-in 0.2s ease', marginTop: 4 }}>
                      {movie.genre && (
                        <p style={{ fontSize: 11, color: 'rgba(61,35,24,0.4)', margin: '0 0 4px' }}>
                          类型: {movie.genre}
                        </p>
                      )}
                      {movie.overview && (
                        <p style={{
                          fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                          color: 'rgba(61,35,24,0.5)', margin: '0 0 8px',
                          lineHeight: 1.6,
                        }}>{movie.overview}</p>
                      )}
                      {movie.watch_note && (
                        <div style={{
                          background: 'rgba(232,132,156,0.06)',
                          borderRadius: 10, padding: '10px 12px',
                          border: '1px solid rgba(232,132,156,0.1)',
                          marginBottom: 10,
                        }}>
                          <p style={{
                            fontSize: 10, fontFamily: "'Cormorant Garamond', serif",
                            letterSpacing: '0.1em', color: 'rgba(232,132,156,0.6)',
                            margin: '0 0 4px', textTransform: 'uppercase',
                          }}>观影笔记</p>
                          <p style={{
                            fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                            color: '#3D2318', margin: 0, lineHeight: 1.5,
                          }}>{movie.watch_note}</p>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={() => openEdit(movie)} style={{
                          padding: '5px 14px', borderRadius: 8,
                          border: '1px solid rgba(196,120,90,0.2)',
                          background: 'rgba(196,120,90,0.06)',
                          color: '#C4785A', fontSize: 11, cursor: 'pointer',
                          fontFamily: "'DM Sans', sans-serif",
                        }}>编辑</button>
                        <button onClick={() => handleDelete(movie.id)} style={{
                          padding: '5px 14px', borderRadius: 8,
                          border: '1px solid rgba(232,100,100,0.2)',
                          background: 'rgba(232,100,100,0.06)',
                          color: '#E86464', fontSize: 11, cursor: 'pointer',
                          fontFamily: "'DM Sans', sans-serif",
                        }}>删除</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAdd && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(61,35,24,0.3)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }} onClick={() => { setShowAdd(false); resetForm() }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: 480, maxHeight: '85vh', overflow: 'auto',
            background: '#F8F6F3',
            borderRadius: 24, padding: '28px 24px',
            boxShadow: '0 24px 80px rgba(61,35,24,0.2)',
            animation: 'slide-up 0.35s cubic-bezier(0.16,1,0.3,1) both',
          }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 20, fontWeight: 400, color: '#3D2318',
              margin: '0 0 20px',
            }}>{editId ? '编辑电影' : '添加电影'}</h2>

            {/* TMDB Search (only for new movies) */}
            {!editId && (
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>搜索电影 (TMDB)</label>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="输入电影名称..."
                  style={inputStyle}
                />
                {isSearching && (
                  <p style={{ fontSize: 11, color: 'rgba(196,120,90,0.6)', margin: '6px 0' }}>搜索中...</p>
                )}
                {searchResults.length > 0 && (
                  <div style={{
                    marginTop: 8, maxHeight: 200, overflow: 'auto',
                    borderRadius: 12, border: '1px solid rgba(196,120,90,0.15)',
                    background: 'rgba(255,255,255,0.7)',
                  }}>
                    {searchResults.slice(0, 8).map(r => (
                      <button key={r.id} onClick={() => handleSelectTMDB(r)} style={{
                        width: '100%', padding: '10px 14px',
                        border: 'none', borderBottom: '1px solid rgba(196,120,90,0.08)',
                        background: 'transparent', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 10,
                        textAlign: 'left',
                      }}>
                        {r.poster_path ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={tmdbPosterUrl(r.poster_path, 'w92')} alt="" style={{
                            width: 36, height: 52, objectFit: 'cover', borderRadius: 4,
                          }} />
                        ) : (
                          <div style={{
                            width: 36, height: 52, borderRadius: 4,
                            background: 'rgba(196,120,90,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, color: 'rgba(196,120,90,0.4)',
                          }}>🎬</div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            margin: 0, fontSize: 13, color: '#3D2318',
                            fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                          }}>{r.title}</p>
                          <p style={{
                            margin: '2px 0 0', fontSize: 11,
                            color: 'rgba(61,35,24,0.4)',
                          }}>{r.release_date?.slice(0, 4) || '未知'} · ★ {r.vote_average?.toFixed(1)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>电影名称 *</label>
                <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="电影名称" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>导演</label>
                  <input value={formDirector} onChange={e => setFormDirector(e.target.value)} placeholder="导演" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>年份</label>
                  <input value={formYear} onChange={e => setFormYear(e.target.value)} placeholder="2024" type="number" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>主演</label>
                <input value={formActors} onChange={e => setFormActors(e.target.value)} placeholder="演员1、演员2..." style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>类型</label>
                  <input value={formGenre} onChange={e => setFormGenre(e.target.value)} placeholder="爱情、喜剧..." style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>评分</label>
                  <input value={formRating} onChange={e => setFormRating(e.target.value)} placeholder="8.5" type="number" step="0.1" min="0" max="10" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>观看日期</label>
                <input value={formWatchedAt} onChange={e => setFormWatchedAt(e.target.value)} type="date" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>简介</label>
                <textarea value={formOverview} onChange={e => setFormOverview(e.target.value)} placeholder="电影简介..." style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
              </div>
              <div>
                <label style={labelStyle}>观影笔记</label>
                <textarea value={formNote} onChange={e => setFormNote(e.target.value)} placeholder="你们的感受..." style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowAdd(false); resetForm() }} style={{
                padding: '10px 24px', borderRadius: 12,
                border: '1px solid rgba(196,120,90,0.2)',
                background: 'rgba(255,255,255,0.5)',
                color: 'rgba(61,35,24,0.6)', fontSize: 14, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}>取消</button>
              <button onClick={handleSave} disabled={!formTitle.trim()} style={{
                padding: '10px 28px', borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #C4785A, #E8849C)',
                color: '#fff', fontSize: 14, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                opacity: formTitle.trim() ? 1 : 0.4,
              }}>{editId ? '保存' : '添加'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 10, marginBottom: 4,
  fontFamily: "'Cormorant Garamond', serif",
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'rgba(196,120,90,0.6)',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1px solid rgba(196,120,90,0.15)',
  background: 'rgba(255,255,255,0.6)',
  fontFamily: "'DM Sans', sans-serif", fontSize: 13,
  color: '#3D2318', outline: 'none', boxSizing: 'border-box',
}
