'use client'

import { type BucketItem } from '@/stores/onlyus/bucketListStore'

interface Props {
  item: BucketItem
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (item: BucketItem) => void
}

const CATEGORY_COLORS: Record<string, string> = {
  '旅行': '#4A90D9', '美食': '#E8849C', '冒险': '#D4A847',
  '学习': '#6BC5A0', '浪漫': '#C4785A', '其他': '#9B8EC4',
}

export default function BucketCard({ item, onComplete, onDelete, onEdit }: Props) {
  const isComplete = !!item.completed_at
  const catColor = CATEGORY_COLORS[item.category] || '#9B8EC4'

  return (
    <div style={{
      background: 'rgba(255,255,255,0.55)',
      backdropFilter: 'blur(16px)',
      borderRadius: 16,
      border: isComplete ? '1px solid rgba(107,197,160,0.3)' : '1px solid rgba(196,120,90,0.12)',
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s',
      position: 'relative',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(196,120,90,0.12)' }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
    onClick={() => onEdit(item)}
    >
      {/* 封面图 */}
      {item.cover_photo_url ? (
        <div style={{
          width: '100%', height: 120, objectFit: 'cover',
          backgroundImage: `url(${item.cover_photo_url})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: isComplete ? 'grayscale(0.3)' : 'none',
        }} />
      ) : (
        <div style={{
          width: '100%', height: 80,
          background: `linear-gradient(135deg, ${catColor}15, ${catColor}08)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 28, opacity: 0.4 }}>✨</span>
        </div>
      )}

      <div style={{ padding: '12px 14px' }}>
        {/* 分类标签 */}
        <span style={{
          display: 'inline-block', fontSize: 10, padding: '2px 8px',
          borderRadius: 10, background: `${catColor}15`, color: catColor,
          fontFamily: "'DM Sans', sans-serif", marginBottom: 6,
        }}>{item.category}</span>

        {/* 标题 */}
        <h3 style={{
          margin: '0 0 6px', fontSize: 14, fontWeight: 500,
          fontFamily: "'Playfair Display', serif",
          color: isComplete ? 'rgba(61,35,24,0.5)' : '#3D2318',
          textDecoration: isComplete ? 'line-through' : 'none',
        }}>{item.title}</h3>

        {/* 进度条 */}
        {!isComplete && (
          <div style={{ marginBottom: 8 }}>
            <div style={{
              width: '100%', height: 4, borderRadius: 2,
              background: 'rgba(196,120,90,0.1)',
            }}>
              <div style={{
                width: `${item.progress}%`, height: '100%', borderRadius: 2,
                background: `linear-gradient(90deg, ${catColor}, ${catColor}CC)`,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <span style={{
              fontSize: 10, color: 'rgba(61,35,24,0.4)',
              fontFamily: "'DM Sans', sans-serif",
            }}>{item.progress}%</span>
          </div>
        )}

        {/* 完成标记 */}
        {isComplete && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 12 }}>✅</span>
            <span style={{
              fontSize: 11, color: 'rgba(107,197,160,0.8)',
              fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
            }}>已完成</span>
          </div>
        )}

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
          {!isComplete && (
            <button
              onClick={() => onComplete(item.id)}
              style={{
                flex: 1, padding: '5px 0', borderRadius: 8,
                border: '1px solid rgba(107,197,160,0.3)', background: 'rgba(107,197,160,0.08)',
                color: '#6BC5A0', fontSize: 11, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >完成 ✨</button>
          )}
          <button
            onClick={() => onDelete(item.id)}
            style={{
              padding: '5px 10px', borderRadius: 8,
              border: '1px solid rgba(220,80,80,0.2)', background: 'rgba(220,80,80,0.05)',
              color: 'rgba(220,80,80,0.6)', fontSize: 11, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >删除</button>
        </div>
      </div>
    </div>
  )
}
