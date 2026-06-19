'use client'

import { useState } from 'react'
import type { Pet, SpriteFrame } from '@/stores/onlyus/petStore'

interface Props {
  pet: Pet
  onUpload: (spriteKey: string, file: File, cols: number, rows: number, fps: number) => Promise<void>
}

const SPRITE_KEYS = [
  { key: 'idle', label: '待机', desc: '默认状态动画' },
  { key: 'happy', label: '开心', desc: '心情好时播放' },
  { key: 'hungry', label: '饥饿', desc: '饿了时播放' },
]

export default function SpriteUpload({ pet, onUpload }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Per-sprite config
  const [cols, setCols] = useState(4)
  const [rows, setRows] = useState(1)
  const [fps, setFps] = useState(4)
  const [removeBg, setRemoveBg] = useState(true)
  const [tolerance, setTolerance] = useState(30)

  // Remove background from image using canvas
  const removeBackground = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // Sample background color from top-left corner
        const bgR = data[0], bgG = data[1], bgB = data[2]

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2]
          const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2)
          if (dist < tolerance) {
            data[i + 3] = 0 // set alpha to 0
          }
        }

        ctx.putImageData(imageData, 0, 0)
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/png' }))
          } else {
            resolve(file)
          }
        }, 'image/png')
      }
      img.onerror = () => resolve(file)
      img.src = URL.createObjectURL(file)
    })
  }

  const handleFileChange = async (spriteKey: string, file: File | undefined) => {
    if (!file) return
    setError(null)
    setUploading(spriteKey)
    try {
      const processedFile = removeBg ? await removeBackground(file) : file
      await onUpload(spriteKey, processedFile, cols, rows, fps)
    } catch (err: any) {
      setError(err?.message || '上传失败')
    } finally {
      setUploading(null)
    }
  }

  const sprites = pet.custom_sprites || {}

  return (
    <div style={{
      background: 'rgba(255,255,255,0.45)',
      backdropFilter: 'blur(16px)',
      borderRadius: 16,
      border: '1px solid rgba(196,120,90,0.1)',
      overflow: 'hidden',
    }}>
      {/* Toggle header */}
      <button onClick={() => setExpanded(!expanded)} style={{
        width: '100%', padding: '14px 20px',
        background: 'transparent', border: 'none',
        cursor: 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 12, letterSpacing: '0.15em',
          color: 'rgba(196,120,90,0.6)', textTransform: 'uppercase',
        }}>自定义雪碧图</span>
        <span style={{
          transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.2s',
          color: 'rgba(196,120,90,0.4)',
          fontSize: 14,
        }}>▾</span>
      </button>

      {expanded && (
        <div style={{ padding: '0 20px 16px' }}>
          <p style={{
            fontSize: 11, color: 'rgba(61,35,24,0.35)',
            fontFamily: "'DM Sans', sans-serif",
            margin: '0 0 16px', lineHeight: 1.5,
          }}>
            上传精灵图（一张图包含多帧动画），系统会自动按帧播放
          </p>

          {/* Sprite sheet config */}
          <div style={{
            display: 'flex', gap: 12, marginBottom: 12,
            padding: '12px', borderRadius: 12,
            background: 'rgba(196,120,90,0.04)',
            border: '1px solid rgba(196,120,90,0.08)',
          }}>
            <div style={{ flex: 1 }}>
              <label style={smallLabel}>列数</label>
              <input type="number" min={1} max={20} value={cols}
                onChange={(e) => setCols(Number(e.target.value))}
                style={smallInput} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={smallLabel}>行数</label>
              <input type="number" min={1} max={20} value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
                style={smallInput} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={smallLabel}>帧率</label>
              <input type="number" min={1} max={30} value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                style={smallInput} />
            </div>
          </div>

          {/* Background removal */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
            padding: '10px 12px', borderRadius: 12,
            background: removeBg ? 'rgba(123,184,126,0.06)' : 'rgba(196,120,90,0.04)',
            border: '1px solid rgba(196,120,90,0.08)',
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1 }}>
              <input type="checkbox" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)}
                style={{ accentColor: '#C4785A', width: 16, height: 16 }} />
              <span style={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif", color: 'rgba(61,35,24,0.6)' }}>
                去除背景色
              </span>
            </label>
            {removeBg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: 'rgba(61,35,24,0.3)', whiteSpace: 'nowrap' }}>容差</span>
                <input type="range" min={10} max={80} value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  style={{ width: 60, accentColor: '#C4785A' }} />
                <span style={{ fontSize: 10, color: 'rgba(61,35,24,0.3)', minWidth: 20 }}>{tolerance}</span>
              </div>
            )}
          </div>

          {SPRITE_KEYS.map(({ key, label, desc }) => {
            const sprite = sprites[key] as SpriteFrame | undefined
            return (
              <div key={key} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                marginBottom: 10, padding: '8px 0',
                borderBottom: '1px solid rgba(196,120,90,0.06)',
              }}>
                {/* Preview */}
                <div style={{
                  width: 48, height: 48, borderRadius: 10,
                  background: 'rgba(196,120,90,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', flexShrink: 0,
                }}>
                  {sprite?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sprite.url} alt={label} style={{
                      width: '100%', height: '100%', objectFit: 'cover',
                      objectPosition: '0 0',
                    }} />
                  ) : (
                    <span style={{ fontSize: 18, opacity: 0.3 }}>🐾</span>
                  )}
                </div>

                {/* Label */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 13, color: '#3D2318', margin: 0,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>{label}</p>
                  <p style={{
                    fontSize: 10, color: 'rgba(61,35,24,0.3)', margin: '2px 0 0',
                  }}>
                    {sprite ? `${sprite.cols}×${sprite.rows} 帧, ${sprite.fps}fps` : desc}
                  </p>
                </div>

                {/* Upload button */}
                <label style={{
                  padding: '4px 12px', borderRadius: 8,
                  background: uploading === key ? 'rgba(196,120,90,0.2)' : 'rgba(196,120,90,0.08)',
                  color: '#C4785A', fontSize: 11, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'background 0.2s',
                }}>
                  {uploading === key ? '上传中...' : '选择'}
                  <input
                    type="file"
                    accept="image/png,image/gif,image/webp"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileChange(key, e.target.files?.[0])}
                  />
                </label>
              </div>
            )
          })}

          {error && (
            <p style={{
              fontSize: 11, color: 'rgba(180,60,60,0.7)',
              fontFamily: "'DM Sans', sans-serif",
              margin: '8px 0 0',
            }}>{error}</p>
          )}
        </div>
      )}
    </div>
  )
}

const smallLabel: React.CSSProperties = {
  display: 'block', fontSize: 10, marginBottom: 4,
  fontFamily: "'DM Sans', sans-serif",
  color: 'rgba(196,120,90,0.6)',
}

const smallInput: React.CSSProperties = {
  width: '100%', padding: '6px 8px', borderRadius: 8,
  border: '1px solid rgba(196,120,90,0.15)',
  background: 'rgba(255,255,255,0.6)',
  fontFamily: "'DM Sans', sans-serif", fontSize: 13,
  color: '#3D2318', outline: 'none',
  boxSizing: 'border-box',
  textAlign: 'center',
}
