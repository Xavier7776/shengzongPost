'use client'

import { useEffect, useState } from 'react'
import { useMedalStore, type Medal } from '@/stores/onlyus/medalStore'
import MedalCard from './MedalCard'

interface Props {
  coupleId: string
}

const CATEGORY_LABELS: Record<string, string> = {
  milestone: '里程碑',
  streak: '连续打卡',
  achievement: '成就',
}

export default function MedalGrid({ coupleId }: Props) {
  const { medals, userMedals, loadMedals, loadUserMedals } = useMedalStore()
  const [selected, setSelected] = useState<{ medal: Medal; unlocked: boolean; unlockedAt?: string } | null>(null)

  useEffect(() => {
    loadMedals()
    if (coupleId) loadUserMedals(coupleId)
  }, [coupleId, loadMedals, loadUserMedals])

  const grouped = medals.reduce<Record<string, Medal[]>>((acc, m) => {
    const cat = m.category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(m)
    return acc
  }, {})

  return (
    <div>
      <style>{`
        @keyframes medal-pop {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes medal-overlay-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {Object.entries(grouped).map(([category, catMedals]) => (
        <div key={category} style={{ marginBottom: 20 }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 11, letterSpacing: '0.15em',
            color: 'rgba(196,120,90,0.5)',
            margin: '0 0 10px',
          }}>
            {CATEGORY_LABELS[category] || category}
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: 10,
          }}>
            {catMedals.map((medal) => {
              const um = userMedals.find(u => u.medal_id === medal.id)
              return (
                <MedalCard
                  key={medal.id}
                  medal={medal}
                  unlocked={!!um}
                  unlockedAt={um?.unlocked_at}
                  onClick={() => setSelected({ medal, unlocked: !!um, unlockedAt: um?.unlocked_at })}
                />
              )
            })}
          </div>
        </div>
      ))}

      {/* Detail modal */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(61,35,24,0.25)',
            backdropFilter: 'blur(6px)',
            animation: 'medal-overlay-in 0.2s ease both',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              animation: 'medal-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both',
              width: '85%', maxWidth: 320,
              background: selected.unlocked
                ? 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(248,246,243,0.95))'
                : 'linear-gradient(145deg, rgba(248,246,243,0.9), rgba(240,236,230,0.95))',
              backdropFilter: 'blur(20px)',
              borderRadius: 24,
              border: selected.unlocked
                ? '1px solid rgba(196,120,90,0.2)'
                : '1px solid rgba(196,120,90,0.08)',
              padding: '36px 28px 28px',
              textAlign: 'center',
              boxShadow: '0 24px 60px rgba(61,35,24,0.18)',
            }}
          >
            {/* Glow */}
            {selected.unlocked && (
              <div style={{
                position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)',
                width: 120, height: 120, borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(196,120,90,0.15), transparent 70%)',
                pointerEvents: 'none',
              }} />
            )}

            {/* Emoji */}
            <div style={{
              fontSize: 56, marginBottom: 16,
              filter: selected.unlocked ? 'none' : 'grayscale(1) opacity(0.3)',
              transform: selected.unlocked ? 'scale(1)' : 'scale(0.9)',
              transition: 'transform 0.3s ease',
            }}>
              {selected.medal.emoji}
            </div>

            {/* Title */}
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 22, fontWeight: 400,
              color: selected.unlocked ? '#3D2318' : 'rgba(61,35,24,0.35)',
              margin: '0 0 10px',
            }}>
              {selected.medal.title}
            </h2>

            {/* Description */}
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 14, fontStyle: 'italic',
              color: selected.unlocked ? 'rgba(196,120,90,0.7)' : 'rgba(61,35,24,0.25)',
              margin: '0 0 16px', lineHeight: 1.5,
            }}>
              {selected.medal.description}
            </p>

            {/* Status */}
            {selected.unlocked ? (
              <div style={{
                display: 'inline-block',
                background: 'rgba(123,184,126,0.1)',
                border: '1px solid rgba(123,184,126,0.2)',
                borderRadius: 20,
                padding: '6px 18px',
              }}>
                <p style={{
                  margin: 0, fontSize: 12,
                  fontFamily: "'DM Sans', sans-serif",
                  color: '#6BC5A0',
                }}>
                  ✓ 已解锁
                  {selected.unlockedAt && (
                    <span style={{ marginLeft: 8, opacity: 0.7 }}>
                      {new Date(selected.unlockedAt).toLocaleDateString('zh-CN')}
                    </span>
                  )}
                </p>
              </div>
            ) : (
              <div style={{
                display: 'inline-block',
                background: 'rgba(196,120,90,0.06)',
                border: '1px solid rgba(196,120,90,0.1)',
                borderRadius: 20,
                padding: '6px 18px',
              }}>
                <p style={{
                  margin: 0, fontSize: 12,
                  fontFamily: "'DM Sans', sans-serif",
                  color: 'rgba(61,35,24,0.35)',
                }}>
                  🔒 尚未解锁
                </p>
              </div>
            )}

            {/* Close hint */}
            <p style={{
              margin: '18px 0 0', fontSize: 10,
              fontFamily: "'DM Sans', sans-serif",
              color: 'rgba(61,35,24,0.2)',
            }}>
              点击空白处关闭
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
