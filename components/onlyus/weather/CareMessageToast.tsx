'use client'

import { useEffect, useState } from 'react'
import { useCareStore, type CareMessage } from '@/stores/onlyus/careStore'

interface Props {
  userId: string
  senderName: string
}

export default function CareMessageToast({ userId, senderName }: Props) {
  const { subscribeToNew, markRead } = useCareStore()
  const [toast, setToast] = useState<CareMessage | null>(null)

  useEffect(() => {
    if (!userId) return
    const unsub = subscribeToNew(userId, (msg) => {
      setToast(msg)
      // Auto dismiss after 4s
      setTimeout(() => {
        setToast(null)
        markRead(msg.id)
      }, 4000)
    })
    return unsub
  }, [userId, subscribeToNew, markRead])

  if (!toast) return null

  return (
    <div style={{
      position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999,
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: 16,
      padding: '14px 20px',
      boxShadow: '0 8px 32px rgba(196,120,90,0.2)',
      border: '1px solid rgba(232,132,156,0.2)',
      display: 'flex', alignItems: 'center', gap: 12,
      animation: 'toast-in 0.4s cubic-bezier(0.16,1,0.3,1) both',
      maxWidth: 360,
    }}>
      <span style={{ fontSize: 24 }}>💕</span>
      <div>
        <p style={{
          margin: 0, fontSize: 13, fontWeight: 500,
          fontFamily: "'DM Sans', sans-serif", color: '#3D2318',
        }}>{senderName} 的关怀</p>
        <p style={{
          margin: '2px 0 0', fontSize: 12,
          fontFamily: "'Cormorant Garamond', serif",
          color: 'rgba(196,120,90,0.7)', fontStyle: 'italic',
        }}>{toast.message_text}</p>
      </div>
      <button onClick={() => { setToast(null); markRead(toast.id) }} style={{
        border: 'none', background: 'transparent',
        color: 'rgba(61,35,24,0.3)', cursor: 'pointer', fontSize: 16,
        padding: '0 0 0 8px',
      }}>✕</button>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}
