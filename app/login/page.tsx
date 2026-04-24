'use client'

// app/login/page.tsx
import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Loader2, Eye, EyeOff, ShieldCheck, Check, ArrowLeft } from 'lucide-react'

// ─── 忘记密码弹层 ──────────────────────────────────────────────────────────────
function ForgotPassword({ onClose }: { onClose: () => void }) {
  const [email, setEmail]     = useState('')
  const [step, setStep]       = useState<'email'|'sending'|'code'|'changing'|'done'>('email')
  const [code, setCode]       = useState('')
  const [newPw, setNewPw]     = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw]   = useState(false)
  const [error, setError]     = useState('')
  const [masked, setMasked]   = useState('')

  async function sendCode() {
    if (!email.trim()) { setError('请填写邮箱'); return }
    setError(''); setStep('sending')
    const res = await fetch('/api/user/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const d = await res.json()
    if (!res.ok) { setError(d.error ?? '发送失败'); setStep('email'); return }
    setMasked(d.email); setStep('code')
  }

  async function resetPw() {
    if (!code.trim())       { setError('请输入验证码'); return }
    if (newPw.length < 8)  { setError('新密码至少 8 位'); return }
    if (newPw !== confirm)  { setError('两次密码不一致'); return }
    setError(''); setStep('changing')
    const res = await fetch('/api/user/forgot-password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword: newPw }),
    })
    const d = await res.json()
    if (!res.ok) { setError(d.error ?? '重置失败'); setStep('code'); return }
    setStep('done')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-300 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-black tracking-tighter text-gray-900 mb-1">重置密码</h2>

        {step === 'done' ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <p className="font-black text-gray-900">密码已重置</p>
            <p className="text-xs text-gray-400 text-center">请用新密码重新登录</p>
            <button onClick={onClose} className="mt-2 text-sm text-blue-600 font-bold hover:underline">返回登录</button>
          </div>
        ) : step === 'email' || step === 'sending' ? (
          <div className="space-y-4 mt-4">
            <p className="text-xs text-gray-400">输入注册邮箱，我们将发送 6 位验证码</p>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">邮箱</label>
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="your@email.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-colors" />
            </div>
            {error && <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
            <button onClick={sendCode} disabled={step === 'sending'}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm py-3 rounded-xl transition-colors disabled:opacity-60">
              {step === 'sending' ? <><Loader2 className="w-4 h-4 animate-spin" />发送中…</> : <><ShieldCheck className="w-4 h-4" />发送验证码</>}
            </button>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <p className="text-xs text-gray-400">验证码已发至 <span className="font-bold text-gray-600">{masked}</span>，10 分钟内有效</p>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">验证码</label>
              <input value={code} onChange={e => { setCode(e.target.value); setError('') }}
                maxLength={6} placeholder="6 位数字"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono tracking-[.3em] focus:outline-none focus:border-blue-400 transition-colors" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">新密码</label>
              <div className="relative">
                <input value={newPw} onChange={e => { setNewPw(e.target.value); setError('') }}
                  type={showPw ? 'text' : 'password'} placeholder="至少 8 位"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-blue-400 transition-colors" />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">确认新密码</label>
              <input value={confirm} onChange={e => { setConfirm(e.target.value); setError('') }}
                type={showPw ? 'text' : 'password'} placeholder="再输入一次"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-colors" />
            </div>
            {error && <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
            <button onClick={resetPw} disabled={step === 'changing'}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm py-3 rounded-xl transition-colors disabled:opacity-60">
              {step === 'changing' ? <><Loader2 className="w-4 h-4 animate-spin" />重置中…</> : '确认重置'}
            </button>
            <button onClick={() => { setStep('email'); setCode(''); setNewPw(''); setConfirm('') }}
              className="w-full text-xs text-gray-400 hover:text-blue-600 transition-colors py-1">
              重新发送 / 更换邮箱
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── 登录主体 ─────────────────────────────────────────────────────────────────
function LoginContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const raw          = searchParams.get('callbackUrl') ?? '/'
  const callbackUrl  = raw.startsWith('/') ? raw : '/'

  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)
  const [forgot, setForgot]   = useState(false)

  function set(field: string, value: string) { setForm(prev => ({ ...prev, [field]: value })); setError('') }

  async function handleSubmit() {
    if (!form.email || !form.password) { setError('请填写邮箱和密码'); return }
    setLoading(true)
    const result = await signIn('credentials', { email: form.email, password: form.password, redirect: false })
    if (result?.ok) {
      router.push(callbackUrl)
    } else {
      setError('邮箱或密码错误，或邮箱尚未验证')
      setLoading(false)
    }
  }

  return (
    <>
      {forgot && <ForgotPassword onClose={() => setForgot(false)} />}
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <Image src="/logo.png" alt="MindStack" width={36} height={36} className="rounded-full" unoptimized />
              <span className="text-3xl font-black tracking-tighter text-gray-900">
                Mind<span className="text-blue-600">Stack</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm">登录以参与评论</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">邮箱</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="your@email.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">密码</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={e => set('password', e.target.value)} placeholder="••••••"
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end mt-1.5">
                <button type="button" onClick={() => setForgot(true)}
                  className="text-[10px] font-bold text-blue-500 hover:text-blue-700 transition-colors">
                  忘记密码？
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 text-xs font-medium bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-sm py-3 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              登录
            </button>
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            还没有账号？
            <Link href="/register" className="text-blue-600 font-bold hover:underline ml-1">注册</Link>
          </p>
        </div>
      </div>
    </>
  )
}

export default function LoginPage() {
  return <Suspense><LoginContent /></Suspense>
}