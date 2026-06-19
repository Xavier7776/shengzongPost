'use client'

import { useState, useEffect, useRef } from 'react'
import { useOnlyUsAuthStore } from '@/stores/onlyus/authStore'
import { useMemoryStore, useAlbumStore, useWishlistStore, type Memory, type Photo } from '@/stores/onlyus/timelineStores'
import dayjs from 'dayjs'
import { useIsMobile } from '@/lib/hooks'

// ── 视差时间轴条目 ────────────────────────────────────────────────────
function MemoryCard({ memory, index }: { memory: Memory; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const isLeft = index % 2 === 0
  const isMobile = useIsMobile()

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.15 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const cardContent = (
    <div style={{
      background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(12px)',
      borderRadius: 16, border: '1px solid rgba(196,120,90,0.12)',
      padding: '16px 18px',
      boxShadow: '0 2px 12px rgba(196,120,90,0.07)',
      maxWidth: isMobile ? '100%' : 300,
      width: '100%',
    }}>
      {memory.photo_urls?.[0] && (
        <div style={{
          width: '100%', height: 120, borderRadius: 10, overflow: 'hidden',
          marginBottom: 12,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={memory.photo_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#3D2318', fontFamily: "'DM Sans', sans-serif" }}>
        {memory.title}
      </p>
      {memory.description && (
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(61,35,24,0.5)', lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
          {memory.description}
        </p>
      )}
      <p style={{ margin: 0, fontSize: 10, color: 'rgba(196,120,90,0.6)', fontFamily: "'Cormorant Garamond', serif", letterSpacing: '0.06em' }}>
        {dayjs(memory.happened_at).format('YYYY · MM · DD')}
      </p>
    </div>
  )

  if (isMobile) {
    return (
      <div ref={ref} style={{
        display: 'grid',
        gridTemplateColumns: '24px 1fr',
        gap: 0, marginBottom: 8,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : `translateY(20px)`,
        transition: `opacity 0.6s ease ${index * 0.08}s, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 0.08}s`,
      }}>
        {/* 左侧时间轴 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #C4785A, #E8849C)',
            boxShadow: '0 0 0 3px rgba(196,120,90,0.15)',
            marginTop: 16, zIndex: 2,
          }} />
          <div style={{ flex: 1, width: 1, background: 'linear-gradient(to bottom, rgba(196,120,90,0.3), rgba(232,132,156,0.15))' }} />
        </div>
        {/* 右侧内容 */}
        <div style={{ paddingLeft: 12, paddingBottom: 8 }}>
          {cardContent}
        </div>
      </div>
    )
  }

  return (
    <div ref={ref} style={{
      display: 'grid',
      gridTemplateColumns: '1fr 40px 1fr',
      gap: 0, marginBottom: 8,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : `translateY(20px)`,
      transition: `opacity 0.6s ease ${index * 0.08}s, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 0.08}s`,
    }}>
      {/* 左侧内容 or 空 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 20, paddingBottom: 8 }}>
        {isLeft && cardContent}
      </div>

      {/* 中间轴 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #C4785A, #E8849C)',
          boxShadow: '0 0 0 3px rgba(196,120,90,0.15)',
          marginTop: 16, zIndex: 2,
        }} />
        <div style={{ flex: 1, width: 1, background: 'linear-gradient(to bottom, rgba(196,120,90,0.3), rgba(232,132,156,0.15))' }} />
      </div>

      {/* 右侧内容 or 空 */}
      <div style={{ paddingLeft: 20, paddingBottom: 8 }}>
        {!isLeft && cardContent}
      </div>
    </div>
  )
}

// ── Masonry 相册 ─────────────────────────────────────────────────────
function MasonryAlbum({ photos, onUpload, onDelete, isUploading, myId, mobile = false }: {
  photos: Photo[]; isUploading: boolean; myId: string; mobile?: boolean
  onUpload: (file: File, caption?: string) => void
  onDelete: (id: string, path: string) => void
}) {
  const [lightbox, setLightbox] = useState<Photo | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
          style={{
            padding: '8px 18px', borderRadius: 10, border: 'none',
            background: isUploading ? 'rgba(196,120,90,0.2)' : 'linear-gradient(135deg, #C4785A, #E8849C)',
            color: '#fff', fontSize: 12, fontFamily: "'DM Sans', sans-serif",
            cursor: isUploading ? 'not-allowed' : 'pointer',
          }}
        >
          {isUploading ? '上传中…' : '+ 添加照片'}
        </button>
        <input
          ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = '' }}
        />
      </div>

      {photos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📷</div>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14, color: 'rgba(61,35,24,0.35)', margin: 0 }}>
            还没有照片，上传第一张吧
          </p>
        </div>
      ) : (
        <div style={{ columns: mobile ? 1 : '2 200px', columnGap: 10 }}>
          {photos.map(photo => (
            <div
              key={photo.id}
              style={{ breakInside: 'avoid', marginBottom: 10, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
              onClick={() => setLightbox(photo)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.storage_path} alt={photo.caption ?? ''}
                style={{ width: '100%', display: 'block', borderRadius: 12 }}
              />
              {photo.uploader_id === myId && (
                <button
                  onClick={e => { e.stopPropagation(); onDelete(photo.id, photo.storage_path) }}
                  style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 22, height: 22, borderRadius: '50%',
                    border: 'none', background: 'rgba(0,0,0,0.4)',
                    color: '#fff', cursor: 'pointer', fontSize: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >×</button>
              )}
              {photo.caption && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '20px 10px 8px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
                  borderRadius: '0 0 12px 12px',
                }}>
                  <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.85)', fontFamily: "'DM Sans', sans-serif" }}>
                    {photo.caption}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.storage_path} alt=""
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 16, objectFit: 'contain' }}
            onClick={e => e.stopPropagation()}
          />
          {lightbox.caption && (
            <p style={{
              position: 'absolute', bottom: 32, left: 0, right: 0, textAlign: 'center',
              color: 'rgba(255,255,255,0.7)', fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {lightbox.caption}
            </p>
          )}
        </div>
      )}
    </>
  )
}

// ── 愿望清单 ─────────────────────────────────────────────────────────
function WishlistSection({ coupleId }: { coupleId: string }) {
  const { pendingItems, completedItems, isLoading, loadItems, addItem, completeItem, deleteItem } = useWishlistStore()
  const [newWish, setNewWish] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => { loadItems(coupleId) }, [coupleId, loadItems])

  const handleAdd = async () => {
    if (!newWish.trim()) return
    setAdding(true)
    await addItem(coupleId, newWish.trim())
    setNewWish('')
    setAdding(false)
  }

  return (
    <div>
      {/* 添加输入 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={newWish}
          onChange={e => setNewWish(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
          placeholder="想一起做什么？…"
          style={{
            flex: 1, padding: '9px 14px', borderRadius: 10,
            border: '1px solid rgba(196,120,90,0.18)',
            background: 'rgba(255,255,255,0.6)',
            fontSize: 13, color: '#3D2318',
            fontFamily: "'DM Sans', sans-serif", outline: 'none',
          }}
        />
        <button onClick={handleAdd} disabled={adding || !newWish.trim()} style={{
          padding: '9px 16px', borderRadius: 10, border: 'none',
          background: newWish.trim() ? '#C4785A' : 'rgba(196,120,90,0.2)',
          color: '#fff', fontSize: 13, cursor: newWish.trim() ? 'pointer' : 'not-allowed',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          添加
        </button>
      </div>

      {/* 待完成 */}
      <div style={{ marginBottom: 16 }}>
        {pendingItems.map(item => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 0', borderBottom: '1px solid rgba(196,120,90,0.06)',
          }}>
            <button
              onClick={() => completeItem(item.id)}
              style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                border: '1.5px solid rgba(196,120,90,0.35)',
                background: 'transparent', cursor: 'pointer',
              }}
            />
            <span style={{ flex: 1, fontSize: 13, color: '#3D2318', fontFamily: "'DM Sans', sans-serif" }}>
              {item.title}
            </span>
            <button onClick={() => deleteItem(item.id)} style={{
              width: 20, height: 20, border: 'none', background: 'transparent',
              color: 'rgba(61,35,24,0.25)', cursor: 'pointer', fontSize: 14,
            }}>×</button>
          </div>
        ))}
        {pendingItems.length === 0 && !isLoading && (
          <p style={{ fontSize: 12, color: 'rgba(61,35,24,0.3)', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
            加点儿想一起做的事吧 ✨
          </p>
        )}
      </div>

      {/* 已完成 */}
      {completedItems.length > 0 && (
        <div>
          <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.5)', fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>
            已完成 {completedItems.length}
          </p>
          {completedItems.map(item => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0', opacity: 0.6,
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                background: 'linear-gradient(135deg, #C4785A, #E8849C)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={{ flex: 1, fontSize: 12, color: 'rgba(61,35,24,0.5)', fontFamily: "'DM Sans', sans-serif", textDecoration: 'line-through' }}>
                {item.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 添加记忆弹窗 ─────────────────────────────────────────────────────
function AddMemoryModal({ coupleId, onClose }: { coupleId: string; onClose: () => void }) {
  const { addMemory } = useMemoryStore()
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [saving, setSaving] = useState(false)
  const isMobile = useIsMobile()

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    await addMemory({ couple_id: coupleId, title: title.trim(), description: desc.trim(), photo_urls: [], happened_at: date })
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(61,35,24,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 12 : 24 }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: isMobile ? '100%' : 480, background: 'rgba(255,252,248,0.97)', borderRadius: isMobile ? 16 : 24, padding: isMobile ? '24px 20px' : '36px 40px', boxShadow: '0 24px 64px rgba(61,35,24,0.18)', border: '1px solid rgba(196,120,90,0.15)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 400, fontSize: 22, color: '#3D2318', margin: '0 0 24px' }}>
          记录一段故事
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="这段记忆叫什么？" style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(196,120,90,0.2)', background: 'rgba(255,255,255,0.7)', fontSize: 14, color: '#3D2318', fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="写点什么…（选填）" rows={3} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(196,120,90,0.2)', background: 'rgba(255,255,255,0.7)', fontSize: 13, color: '#3D2318', fontFamily: "'DM Sans', sans-serif", outline: 'none', resize: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.65)', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>发生于</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(196,120,90,0.2)', background: 'rgba(255,255,255,0.7)', fontSize: 13, color: '#3D2318', fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />
          </div>
        </div>
        <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(196,120,90,0.2)', background: 'transparent', color: 'rgba(61,35,24,0.5)', fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}>取消</button>
          <button onClick={handleSave} disabled={saving || !title.trim()} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: title.trim() ? 'linear-gradient(135deg, #C4785A, #E8849C)' : 'rgba(196,120,90,0.2)', color: '#fff', fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: title.trim() ? 'pointer' : 'not-allowed' }}>
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 主页面 ──────────────────────────────────────────────────────────
export default function TimelinePage() {
  const { profile, partner, coupleInfo } = useOnlyUsAuthStore()
  const isMobile = useIsMobile()
  const { memories, isLoading: memoriesLoading, loadMemories } = useMemoryStore()
  const { photos, isLoading: albumLoading, isUploading, loadPhotos, uploadPhoto, deletePhoto } = useAlbumStore()
  const [tab, setTab] = useState<'timeline' | 'album' | 'wishlist'>('timeline')
  const [showAddMemory, setShowAddMemory] = useState(false)

  const coupleId = coupleInfo?.id ?? ''

  useEffect(() => {
    if (!coupleId) return
    if (tab === 'timeline') loadMemories(coupleId)
    else if (tab === 'album') loadPhotos(coupleId)
  }, [tab, coupleId, loadMemories, loadPhotos])

  const handleUpload = (file: File) => {
    if (!coupleId || !profile?.id) return
    uploadPhoto(coupleId, profile.id, file)
  }

  const TABS = [
    { key: 'timeline', icon: '📖', label: '故事轴' },
    { key: 'album',    icon: '📷', label: '相册' },
    { key: 'wishlist', icon: '✨', label: '愿望清单' },
  ] as const

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
        @keyframes card-rise { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        input:focus, textarea:focus { border-color: rgba(196,120,90,0.4) !important; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: rgba(196,120,90,0.2); border-radius: 2px; }
      `}</style>

      <div style={{ minHeight: '100%', padding: isMobile ? '20px 16px 80px' : '40px 40px 60px', maxWidth: 900, margin: '0 auto' }}>

        {/* 标题行 */}
        <div style={{ animation: 'card-rise 0.5s ease both', marginBottom: 28, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', gap: isMobile ? 12 : 0 }}>
          <div>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.6)', margin: '0 0 6px' }}>
              我们的
            </p>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 400, color: '#3D2318', margin: 0 }}>
              故事
            </h1>
          </div>

          {/* Tab */}
          <div style={{ display: 'flex', gap: 2, background: 'rgba(196,120,90,0.08)', borderRadius: 12, padding: 3 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: '7px 16px', borderRadius: 9, border: 'none',
                background: tab === t.key ? 'rgba(255,255,255,0.8)' : 'transparent',
                color: tab === t.key ? '#C4785A' : 'rgba(61,35,24,0.4)',
                fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                fontWeight: tab === t.key ? 600 : 400, cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: tab === t.key ? '0 1px 4px rgba(196,120,90,0.12)' : 'none',
              }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 故事轴 */}
        {tab === 'timeline' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
              <button onClick={() => setShowAddMemory(true)} style={{
                padding: '8px 18px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #C4785A, #E8849C)',
                color: '#fff', fontSize: 12, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
              }}>
                + 记录故事
              </button>
            </div>

            {memoriesLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(61,35,24,0.35)', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}>加载中…</div>
            ) : memories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📖</div>
                <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 16, color: 'rgba(61,35,24,0.35)', margin: '0 0 8px' }}>
                  还没有故事
                </p>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, color: 'rgba(61,35,24,0.25)', margin: 0 }}>
                  把你们的第一段记忆记录下来吧
                </p>
              </div>
            ) : (
              <div>
                {/* 时间轴起点 */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                  <div style={{
                    padding: '5px 16px', borderRadius: 20,
                    background: 'linear-gradient(135deg, rgba(196,120,90,0.12), rgba(232,132,156,0.08))',
                    border: '1px solid rgba(196,120,90,0.18)',
                    fontSize: 11, color: '#C4785A',
                    fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
                  }}>
                    故事开始
                  </div>
                </div>
                {memories.map((m, i) => <MemoryCard key={m.id} memory={m} index={i} />)}
              </div>
            )}
          </div>
        )}

        {/* 相册 */}
        {tab === 'album' && (
          <div style={{
            background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)',
            borderRadius: 20, border: '1px solid rgba(196,120,90,0.1)', padding: '24px 28px',
            animation: 'card-rise 0.4s ease both',
          }}>
            <MasonryAlbum
              photos={photos}
              isUploading={isUploading}
              myId={profile?.id ?? ''}
              mobile={isMobile}
              onUpload={handleUpload}
              onDelete={deletePhoto}
            />
          </div>
        )}

        {/* 愿望清单 */}
        {tab === 'wishlist' && coupleId && (
          <div style={{
            background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)',
            borderRadius: 20, border: '1px solid rgba(196,120,90,0.1)', padding: '28px 32px',
            maxWidth: 520, animation: 'card-rise 0.4s ease both',
          }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.7)', margin: '0 0 18px' }}>
              想一起做的事
            </p>
            <WishlistSection coupleId={coupleId} />
          </div>
        )}
      </div>

      {showAddMemory && coupleId && (
        <AddMemoryModal coupleId={coupleId} onClose={() => setShowAddMemory(false)} />
      )}
    </>
  )
}
