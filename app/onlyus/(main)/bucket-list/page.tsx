'use client'

import { useEffect, useState, useCallback } from 'react'
import { useOnlyUsAuthStore } from '@/stores/onlyus/authStore'
import { useBucketListStore, CATEGORIES, type BucketItem } from '@/stores/onlyus/bucketListStore'
import { useMedalStore } from '@/stores/onlyus/medalStore'
import BucketCard from '@/components/onlyus/bucket/BucketCard'
import BucketStats from '@/components/onlyus/bucket/BucketStats'
import CompletionCelebration from '@/components/onlyus/bucket/CompletionCelebration'

const CATEGORIES_ICONS: Record<string, string> = {
  '全部': '🌈', '旅行': '✈️', '美食': '🍰', '冒险': '🏔️',
  '学习': '📚', '浪漫': '💕', '其他': '✨',
}

export default function BucketListPage() {
  const { profile, coupleInfo } = useOnlyUsAuthStore()
  const { items, isLoading, activeCategory, setActiveCategory, loadItems, addItem, updateItem, deleteItem, markComplete } = useBucketListStore()
  const { checkAndUnlock } = useMedalStore()

  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<BucketItem | null>(null)
  const [celebrating, setCelebrating] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('旅行')
  const [progress, setProgress] = useState(0)
  const [coverUrl, setCoverUrl] = useState('')
  const [saving, setSaving] = useState(false)

  const coupleId = coupleInfo?.id
  const userId = profile?.id

  useEffect(() => {
    if (coupleId) loadItems(coupleId)
  }, [coupleId, loadItems])

  const filtered = activeCategory === '全部' ? items : items.filter(i => i.category === activeCategory)
  const totalItems = items.length
  const completedItems = items.filter(i => i.completed_at).length

  const openAdd = () => {
    setEditingItem(null)
    setTitle(''); setDescription(''); setCategory('旅行'); setProgress(0); setCoverUrl('')
    setShowModal(true)
  }

  const openEdit = (item: BucketItem) => {
    setEditingItem(item)
    setTitle(item.title); setDescription(item.description || '')
    setCategory(item.category); setProgress(item.progress); setCoverUrl(item.cover_photo_url || '')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!title.trim() || !coupleId || !userId) return
    setSaving(true)
    try {
      if (editingItem) {
        await updateItem(editingItem.id, {
          title: title.trim(), description: description || null,
          category, progress, cover_photo_url: coverUrl || null,
        })
      } else {
        await addItem({
          couple_id: coupleId, title: title.trim(), description: description || null,
          category, progress, cover_photo_url: coverUrl || null, created_by: userId,
        })
        // Check bucket_first medal
        if (userId) checkAndUnlock(userId, coupleId, 'bucket_first')
      }
      setShowModal(false)
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = useCallback(async (id: string) => {
    await markComplete(id)
    setCelebrating(true)
    // Check bucket_complete_5 medal
    const newCompleted = items.filter(i => i.completed_at || i.id === id).length
    if (newCompleted >= 5 && userId && coupleId) {
      checkAndUnlock(userId, coupleId, 'bucket_complete_5')
    }
  }, [markComplete, items, userId, coupleId, checkAndUnlock])

  const handleDelete = useCallback(async (id: string) => {
    if (confirm('确定删除这个心愿吗？')) await deleteItem(id)
  }, [deleteItem])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@400;500&display=swap');
        @keyframes card-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .bucket-card { animation: card-rise 0.55s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      <div style={{ minHeight: '100%', padding: '40px 24px 80px', maxWidth: 960, margin: '0 auto' }}>
        {/* 标题 */}
        <div className="bucket-card" style={{ marginBottom: 24 }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: 11,
            letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'rgba(196,120,90,0.7)', margin: '0 0 6px',
          }}>Bucket List</p>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 400, color: '#3D2318', margin: 0,
          }}>心愿清单</h1>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: 13,
            color: 'rgba(196,120,90,0.5)', margin: '4px 0 0', fontStyle: 'italic',
          }}>记录想一起做的每一件事</p>
        </div>

        {/* 统计 */}
        <div className="bucket-card" style={{ animationDelay: '80ms', marginBottom: 20 }}>
          <BucketStats total={totalItems} completed={completedItems} />
        </div>

        {/* 分类筛选 */}
        <div className="bucket-card" style={{
          animationDelay: '120ms', marginBottom: 24,
          display: 'flex', gap: 8, flexWrap: 'wrap',
        }}>
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              padding: '6px 14px', borderRadius: 20,
              border: activeCategory === cat ? '1px solid rgba(196,120,90,0.4)' : '1px solid rgba(196,120,90,0.12)',
              background: activeCategory === cat ? 'rgba(196,120,90,0.1)' : 'rgba(255,255,255,0.5)',
              color: activeCategory === cat ? '#C4785A' : 'rgba(61,35,24,0.5)',
              fontSize: 12, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.2s',
            }}>
              {CATEGORIES_ICONS[cat]} {cat}
            </button>
          ))}
        </div>

        {/* 心愿卡片网格 */}
        {isLoading ? (
          <p style={{ textAlign: 'center', color: 'rgba(61,35,24,0.3)', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}>
            加载中...
          </p>
        ) : filtered.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}>
            {filtered.map((item, i) => (
              <div key={item.id} className="bucket-card" style={{ animationDelay: `${150 + i * 50}ms` }}>
                <BucketCard
                  item={item}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                  onEdit={openEdit}
                />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>✨</span>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
              fontSize: 14, color: 'rgba(61,35,24,0.3)', margin: 0,
            }}>
              {activeCategory === '全部' ? '还没有心愿，点击右下角添加第一个吧' : `还没有${activeCategory}类的心愿`}
            </p>
          </div>
        )}
      </div>

      {/* 浮动添加按钮 */}
      <button onClick={openAdd} style={{
        position: 'fixed', bottom: 90, right: 24,
        width: 52, height: 52, borderRadius: '50%',
        background: 'linear-gradient(135deg, #C4785A, #E8849C)',
        border: 'none', color: '#fff', fontSize: 24,
        cursor: 'pointer', zIndex: 100,
        boxShadow: '0 6px 20px rgba(196,120,90,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform 0.2s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >+</button>

      {/* 添加/编辑弹窗 */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(61,35,24,0.3)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: '#F8F6F3', borderRadius: 20,
            padding: '28px 24px', width: '100%', maxWidth: 420,
            boxShadow: '0 20px 60px rgba(61,35,24,0.2)',
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif", fontSize: 20,
              color: '#3D2318', margin: '0 0 20px', fontWeight: 400,
            }}>{editingItem ? '编辑心愿' : '添加心愿'}</h2>

            {/* 标题 */}
            <label style={labelStyle}>心愿名称</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="想一起做的事..." style={inputStyle} />

            {/* 描述 */}
            <label style={labelStyle}>描述（可选）</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="详细描述..." style={{ ...inputStyle, height: 60, resize: 'vertical' }} />

            {/* 分类 */}
            <label style={labelStyle}>分类</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {CATEGORIES.filter(c => c !== '全部').map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)} style={{
                  padding: '4px 12px', borderRadius: 14, fontSize: 12,
                  border: category === cat ? '1px solid rgba(196,120,90,0.4)' : '1px solid rgba(196,120,90,0.12)',
                  background: category === cat ? 'rgba(196,120,90,0.1)' : 'transparent',
                  color: category === cat ? '#C4785A' : 'rgba(61,35,24,0.5)',
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}>{CATEGORIES_ICONS[cat]} {cat}</button>
              ))}
            </div>

            {/* 封面图 URL */}
            <label style={labelStyle}>封面图 URL（可选）</label>
            <input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." style={inputStyle} />

            {/* 进度 */}
            <label style={labelStyle}>进度：{progress}%</label>
            <input type="range" min={0} max={100} value={progress} onChange={(e) => setProgress(Number(e.target.value))} style={{ width: '100%', marginBottom: 20, accentColor: '#C4785A' }} />

            {/* 按钮 */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowModal(false)} style={{
                flex: 1, padding: '10px 0', borderRadius: 12,
                border: '1px solid rgba(196,120,90,0.2)', background: 'transparent',
                color: 'rgba(61,35,24,0.5)', fontSize: 13, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}>取消</button>
              <button onClick={handleSave} disabled={saving || !title.trim()} style={{
                flex: 1, padding: '10px 0', borderRadius: 12,
                border: 'none', background: 'linear-gradient(135deg, #C4785A, #E8849C)',
                color: '#fff', fontSize: 13, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                opacity: saving || !title.trim() ? 0.5 : 1,
              }}>{saving ? '保存中...' : (editingItem ? '保存' : '添加')}</button>
            </div>
          </div>
        </div>
      )}

      {/* 完成庆祝 */}
      {celebrating && <CompletionCelebration onDone={() => setCelebrating(false)} />}
    </>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, marginBottom: 4,
  fontFamily: "'Cormorant Garamond', serif",
  letterSpacing: '0.1em', color: 'rgba(196,120,90,0.7)',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  border: '1px solid rgba(196,120,90,0.15)',
  background: 'rgba(255,255,255,0.6)',
  fontFamily: "'DM Sans', sans-serif", fontSize: 13,
  color: '#3D2318', outline: 'none', marginBottom: 14,
  boxSizing: 'border-box',
}
