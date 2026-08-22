'use client'

// components/sections/NewsletterForm.tsx
// 邮件订阅表单：内联反馈，无跳转

import { useState } from 'react'
import { Mail, Loader2 } from 'lucide-react'

export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (state === 'loading') return
    setState('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok) {
        setState('done')
        setMessage(data.message ?? '订阅成功')
        setEmail('')
      } else {
        setState('error')
        setMessage(data.error ?? '订阅失败，请稍后再试')
      }
    } catch {
      setState('error')
      setMessage('网络异常，请稍后再试')
    }
  }

  return (
    <div className="max-w-md">
      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
        <Mail className="w-3.5 h-3.5" />
        Newsletter
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 min-w-0 px-4 py-2.5 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
        />
        <button
          type="submit"
          disabled={state === 'loading'}
          className="px-5 py-2.5 rounded-full bg-gray-900 text-white text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {state === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          订阅
        </button>
      </form>
      {message && (
        <p className={`mt-2 text-xs font-bold ${state === 'error' ? 'text-red-500' : 'text-blue-600'}`}>
          {message}
        </p>
      )}
      <p className="mt-2 text-xs text-gray-300">新文章与作品更新时收到通知，随时可退订。</p>
    </div>
  )
}
