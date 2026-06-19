'use client'

// app/onlyus/gate/page.tsx

import { useState, useRef, useTransition, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { verifyPasscode } from './actions'

type Status = 'idle' | 'loading' | 'error' | 'success'

function GateForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('from') || '/onlyus'

  const [passcode, setPasscode] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [shake, setShake] = useState(false)
  const [visible, setVisible] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()

  // 入场动画：仅在客户端触发，避免 SSR/CSR 不一致
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 600)
  }

  const handleSubmit = () => {
    if (!passcode.trim() || isPending) return
    startTransition(async () => {
      setStatus('loading')
      const result = await verifyPasscode(passcode)
      if (result.ok) {
        setStatus('success')
        setTimeout(() => router.replace(redirectTo), 500)
      } else {
        setStatus('error')
        triggerShake()
        setPasscode('')
        setTimeout(() => {
          setStatus('idle')
          inputRef.current?.focus()
        }, 800)
      }
    })
  }

  const isSuccess = status === 'success'
  const isError = status === 'error'

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 380,
        margin: '0 24px',
        background: 'rgba(255,255,255,0.62)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 28,
        border: '1px solid rgba(196,120,90,0.14)',
        boxShadow: '0 8px 48px rgba(196,120,90,0.10), 0 1px 0 rgba(255,255,255,0.8) inset',
        padding: '44px 40px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        zIndex: 10,
        // 用 CSS transition 代替 animation，避免 SSR 产生不一致的 animation 字符串
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.97)',
        transition: 'opacity 0.75s cubic-bezier(0.16,1,0.3,1), transform 0.75s cubic-bezier(0.16,1,0.3,1)',
        animation: shake ? 'gate-shake 0.55s ease forwards' : 'none',
      }}
    >
      {/* Lock / Check icon */}
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: isSuccess
          ? 'linear-gradient(135deg, rgba(196,120,90,0.22), rgba(232,132,156,0.18))'
          : 'linear-gradient(135deg, rgba(196,120,90,0.15), rgba(196,120,90,0.06))',
        border: `1.5px solid ${isSuccess ? 'rgba(196,120,90,0.5)' : 'rgba(196,120,90,0.2)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
        transition: 'all 0.4s ease',
      }}>
        {isSuccess ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#C4785A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="11" width="18" height="11" rx="3" stroke="#C4785A" strokeWidth="1.8"/>
            <path d="M7 11V7a5 5 0 0110 0v4" stroke="#C4785A" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        )}
      </div>

      <h1 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 26, fontWeight: 400,
        color: '#2E1810', letterSpacing: '-0.01em',
        margin: '0 0 6px', textAlign: 'center',
      }}>
        {isSuccess ? 'Welcome back 💛' : 'Only Us'}
      </h1>

      <p style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontStyle: 'italic', fontSize: 14,
        color: '#8B5E52', opacity: 0.75,
        margin: '0 0 32px', textAlign: 'center', letterSpacing: '0.03em',
      }}>
        {isSuccess ? '正在进入我们的小世界…' : '这里只属于我们两个人'}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, width: '100%' }}>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, rgba(196,120,90,0.25))' }} />
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(196,120,90,0.4)' }} />
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, rgba(196,120,90,0.25))' }} />
      </div>

      {!isSuccess && (
        <div style={{ width: '100%', marginBottom: 14 }}>
          <input
            ref={inputRef}
            type="password"
            value={passcode}
            onChange={e => setPasscode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="输入访问密码"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            disabled={isPending}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '13px 18px', borderRadius: 14,
              border: `1.5px solid ${isError ? 'rgba(220,80,80,0.45)' : 'rgba(196,120,90,0.22)'}`,
              background: isError ? 'rgba(255,240,240,0.5)' : 'rgba(255,255,255,0.55)',
              color: '#2E1810', fontSize: 15,
              fontFamily: 'system-ui, sans-serif',
              letterSpacing: '0.08em', outline: 'none',
              transition: 'border-color 0.2s, background 0.2s',
              textAlign: 'center',
            }}
          />
          <div style={{ height: 20, marginTop: 8, textAlign: 'center' }}>
            {isError && (
              <span style={{
                fontSize: 12, color: 'rgba(200,70,70,0.85)',
                letterSpacing: '0.02em',
              }}>
                密码不正确，请再试一次
              </span>
            )}
          </div>
        </div>
      )}

      {!isSuccess && (
        <button
          onClick={handleSubmit}
          disabled={isPending || !passcode.trim()}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
            background: passcode.trim()
              ? 'linear-gradient(135deg, #C4785A, #D4886A)'
              : 'rgba(196,120,90,0.18)',
            color: passcode.trim() ? '#fff' : 'rgba(196,120,90,0.5)',
            fontSize: 14, fontWeight: 500,
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: '0.06em',
            cursor: passcode.trim() && !isPending ? 'pointer' : 'default',
            transition: 'all 0.25s ease',
            boxShadow: passcode.trim() ? '0 4px 20px rgba(196,120,90,0.3)' : 'none',
          }}
        >
          {isPending ? '验证中…' : 'Enter'}
        </button>
      )}

      <p style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 10, letterSpacing: '0.3em',
        textTransform: 'uppercase',
        color: 'rgba(196,120,90,0.4)',
        margin: '24px 0 0',
      }}>
        Just the two of us
      </p>
    </div>
  )
}

export default function OnlyUsGatePage() {
  return (
    <>
      {/* 字体用 <link> 放到 head，不用 @import，避免 SSR hydration 差异 */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap"
      />
      <style>{`
        @keyframes gate-shake {
          0%,100% { transform: translateX(0); }
          15%  { transform: translateX(-7px); }
          30%  { transform: translateX(7px); }
          45%  { transform: translateX(-5px); }
          60%  { transform: translateX(5px); }
          75%  { transform: translateX(-3px); }
          90%  { transform: translateX(3px); }
        }
        @keyframes gate-glow {
          0%,100% { opacity: 0.55; transform: translate(-50%,-50%) scale(1); }
          50%      { opacity: 0.8;  transform: translate(-50%,-50%) scale(1.12); }
        }
      `}</style>

      <div style={{
        position: 'fixed', inset: 0,
        background: 'linear-gradient(160deg, #FDF8F5 0%, #FAF2EE 50%, #F7EEF2 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '38%', left: '50%',
          width: 600, height: 600, borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(ellipse, rgba(196,120,90,0.11) 0%, rgba(232,132,156,0.07) 45%, transparent 70%)',
          animation: 'gate-glow 12s ease-in-out infinite',
          transform: 'translate(-50%,-50%)',
        }} />

        <Suspense fallback={
          <div style={{ display: 'flex', gap: 6 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#C4785A', opacity: 0.5,
              }} />
            ))}
          </div>
        }>
          <GateForm />
        </Suspense>
      </div>
    </>
  )
}