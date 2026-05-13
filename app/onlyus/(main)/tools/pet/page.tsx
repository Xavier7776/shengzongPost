'use client'

import { useEffect, useState } from 'react'
import { useOnlyUsAuthStore } from '@/stores/onlyus/authStore'
import { usePetStore, PET_TYPES } from '@/stores/onlyus/petStore'
import PetSprite from '@/components/onlyus/pet/PetSprite'
import PetStats from '@/components/onlyus/pet/PetStats'
import PetActions from '@/components/onlyus/pet/PetActions'
import SpriteUpload from '@/components/onlyus/pet/SpriteUpload'

export default function PetPage() {
  const { profile, coupleInfo } = useOnlyUsAuthStore()
  const { pet, isLoading, loadPet, createPet, feedPet, playWithPet, renamePet, uploadSprite, canFeed, canPlay } = usePetStore()

  const [petName, setPetName] = useState('')
  const [petType, setPetType] = useState('cat')
  const [showRename, setShowRename] = useState(false)
  const [newName, setNewName] = useState('')

  const coupleId = coupleInfo?.id
  const userId = profile?.id
  const shouldShowCreate = !isLoading && !pet && !!coupleId

  useEffect(() => {
    if (coupleId) loadPet(coupleId)
  }, [coupleId, loadPet])

  const handleCreate = async () => {
    if (!petName.trim() || !coupleId) return
    await createPet(coupleId, petName.trim(), petType)
  }

  const handleRename = async () => {
    if (!newName.trim()) return
    await renamePet(newName.trim())
    setShowRename(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@400;500&display=swap');
        @keyframes card-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .pet-card { animation: card-rise 0.55s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      <div style={{ minHeight: '100%', padding: '40px 24px 80px', maxWidth: 500, margin: '0 auto' }}>
        {/* Title */}
        <div className="pet-card" style={{ marginBottom: 24 }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: 11,
            letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'rgba(196,120,90,0.7)', margin: '0 0 6px',
          }}>Virtual Pet</p>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 400, color: '#3D2318', margin: 0,
          }}>我们的宠物</h1>
        </div>

        {isLoading ? (
          <p style={{
            textAlign: 'center', padding: '48px 0',
            fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
            fontSize: 14, color: 'rgba(61,35,24,0.3)',
          }}>加载中...</p>
        ) : pet ? (
          <>
            <div className="pet-card" style={{
              animationDelay: '80ms',
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(16px)',
              borderRadius: 20,
              border: '1px solid rgba(196,120,90,0.12)',
              overflow: 'hidden',
            }}>
              <PetSprite pet={pet} />
            </div>

            <div className="pet-card" style={{ animationDelay: '120ms' }}>
              <PetStats pet={pet} />
            </div>

            <div className="pet-card" style={{ animationDelay: '160ms' }}>
              <PetActions
                canFeed={canFeed()}
                canPlay={canPlay()}
                onFeed={() => userId && feedPet(userId)}
                onPlay={() => userId && playWithPet(userId)}
                onRename={() => { setNewName(pet.name); setShowRename(true) }}
              />
            </div>

            <div className="pet-card" style={{ animationDelay: '200ms' }}>
              <SpriteUpload pet={pet} onUpload={uploadSprite} />
            </div>
          </>
        ) : shouldShowCreate ? (
          <div className="pet-card" style={{
            animationDelay: '80ms',
            background: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(16px)',
            borderRadius: 20,
            border: '1px solid rgba(196,120,90,0.12)',
            padding: '28px 24px',
          }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 20, fontWeight: 400, color: '#3D2318',
              margin: '0 0 20px',
            }}>领养一只宠物</h2>

            <label style={labelStyle}>选择类型</label>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              {PET_TYPES.map((t) => (
                <button key={t.key} onClick={() => setPetType(t.key)} style={{
                  flex: 1, padding: '16px 0',
                  borderRadius: 14, border: petType === t.key ? '2px solid rgba(196,120,90,0.4)' : '1px solid rgba(196,120,90,0.1)',
                  background: petType === t.key ? 'rgba(196,120,90,0.08)' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.2s',
                }}>
                  <span style={{ fontSize: 32, display: 'block', marginBottom: 4 }}>{t.emoji}</span>
                  <span style={{
                    fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                    color: petType === t.key ? '#C4785A' : 'rgba(61,35,24,0.4)',
                  }}>{t.label}</span>
                </button>
              ))}
            </div>

            <label style={labelStyle}>给它取个名字</label>
            <input
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="输入宠物名字..."
              style={inputStyle}
              maxLength={20}
            />

            <button
              onClick={handleCreate}
              disabled={!petName.trim()}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 14,
                border: 'none',
                background: 'linear-gradient(135deg, #C4785A, #E8849C)',
                color: '#fff', fontSize: 14, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                opacity: petName.trim() ? 1 : 0.5,
              }}
            >
              领养 {PET_TYPES.find(t => t.key === petType)?.emoji}
            </button>
          </div>
        ) : null}
      </div>

      {/* Rename modal */}
      {showRename && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(61,35,24,0.3)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }} onClick={() => setShowRename(false)}>
          <div style={{
            background: '#F8F6F3', borderRadius: 20,
            padding: '28px 24px', width: '100%', maxWidth: 360,
            boxShadow: '0 20px 60px rgba(61,35,24,0.2)',
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif", fontSize: 20,
              color: '#3D2318', margin: '0 0 16px', fontWeight: 400,
            }}>改名</h2>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="新名字..."
              style={inputStyle}
              maxLength={20}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowRename(false)} style={{
                flex: 1, padding: '10px 0', borderRadius: 12,
                border: '1px solid rgba(196,120,90,0.2)', background: 'transparent',
                color: 'rgba(61,35,24,0.5)', fontSize: 13, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}>取消</button>
              <button onClick={handleRename} disabled={!newName.trim()} style={{
                flex: 1, padding: '10px 0', borderRadius: 12,
                border: 'none', background: 'linear-gradient(135deg, #C4785A, #E8849C)',
                color: '#fff', fontSize: 13, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                opacity: newName.trim() ? 1 : 0.5,
              }}>确定</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, marginBottom: 6,
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
