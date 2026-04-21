'use client'

// app/register/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Mail } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', name: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  async function handleSubmit() {
    if (!form.email || !form.name || !form.password) {
      setError('请填写所有字段'); return
    }
    if (form.password !== form.confirm) {
      setError('两次密码不一致'); return
    }
    if (form.password.length < 6) {
      setError('密码至少 6 位'); return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, name: form.name, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '注册失败'); setLoading(false); return }
      setDone(true)
    } catch {
      setError('网络错误，请重试')
      setLoading(false)
    }
  }

  // 注册成功后显示"去收邮件"提示
  if (done) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tighter text-gray-900">
              ARC<span className="text-blue-600">.</span>
            </h1>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-10 shadow-sm">
            <div className="flex justify-center mb-6">
              <Mail className="w-12 h-12 text-blue-500" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-3">验证邮件已发送</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-2">
              请前往 <strong className="text-gray-700">{form.email}</strong> 查收验证邮件，点击邮件中的链接激活账号。
            </p>
            <p className="text-xs text-gray-400 mb-8">链接 24 小时内有效，记得检查垃圾邮件文件夹。</p>
            <Link
              href="/login"
              className="inline-block text-sm font-bold text-blue-600 hover:underline"
            >
              已验证？去登录 →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-black tracking-tighter text-gray-900">
            ARC<span className="text-blue-600">.</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">创建账号，参与讨论</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">昵称</label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="你的显示名称"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">邮箱</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="your@email.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">密码</label>
            <input
              type="password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder="至少 6 位"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">确认密码</label>
            <input
              type="password"
              value={form.confirm}
              onChange={e => set('confirm', e.target.value)}
              placeholder="再输一遍"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs font-medium bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-sm py-3 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            注册
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          已有账号？
          <Link href="/login" className="text-blue-600 font-bold hover:underline ml-1">
            登录
          </Link>
        </p>
      </div>
    </div>
  )
}
