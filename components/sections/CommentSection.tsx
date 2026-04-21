'use client'

// components/sections/CommentSection.tsx
import { useEffect, useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { Loader2, MessageCircle, Send } from 'lucide-react'
import Link from 'next/link'

interface Comment {
  id: number
  user_name: string
  content: string
  created_at: string
}

export default function CommentSection({ slug }: { slug: string }) {
  const { data: session, status } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/comments?slug=${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(data => { setComments(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [slug])

  async function handleSubmit() {
    if (!content.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_slug: slug, content: content.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '提交失败'); setSubmitting(false); return }
      setContent('')
      setSubmitted(true)
    } catch {
      setError('网络错误，请重试')
    }
    setSubmitting(false)
  }

  return (
    <section className="mt-20 pt-12 border-t border-gray-100">
      <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-gray-900 mb-8">
        <MessageCircle className="w-5 h-5 text-blue-500" />
        评论
        {comments.length > 0 && (
          <span className="text-sm font-bold text-gray-400 ml-1">({comments.length})</span>
        )}
      </h2>

      {/* 评论列表 */}
      {loading ? (
        <div className="flex items-center gap-2 text-gray-300 py-8">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">加载中…</span>
        </div>
      ) : comments.length === 0 ? (
        <p className="text-gray-300 text-sm py-8">还没有评论，来说点什么吧</p>
      ) : (
        <div className="space-y-5 mb-10">
          {comments.map(c => (
            <div key={c.id} className="flex gap-4">
              {/* 头像 */}
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 text-sm font-black">
                  {c.user_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-bold text-gray-900">{c.user_name}</span>
                  <time className="text-xs text-gray-400 font-mono">{c.created_at.slice(0, 10)}</time>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 输入区 */}
      <div className="bg-gray-50 rounded-2xl p-5">
        {status === 'loading' ? null : !session ? (
          <div className="text-center py-4 space-y-3">
            <p className="text-sm text-gray-500">登录后参与评论</p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/login"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold rounded-xl transition-colors"
              >
                注册
              </Link>
            </div>
          </div>
        ) : submitted ? (
          <div className="text-center py-4 space-y-2">
            <p className="text-sm font-bold text-gray-700">✓ 评论已提交</p>
            <p className="text-xs text-gray-400">审核通过后将显示在页面上</p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-xs text-blue-500 hover:underline mt-1"
            >
              继续评论
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 text-xs font-black">
                  {session.user?.name?.charAt(0).toUpperCase() ?? '?'}
                </span>
              </div>
              <span className="text-sm font-bold text-gray-700">{session.user?.name}</span>
            </div>
            <textarea
              value={content}
              onChange={e => { setContent(e.target.value); setError('') }}
              placeholder="写下你的想法…"
              rows={3}
              maxLength={1000}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors resize-none"
            />
            {error && (
              <p className="text-red-500 text-xs">{error}</p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300">{content.length}/1000</span>
              <button
                onClick={handleSubmit}
                disabled={submitting || !content.trim()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                {submitting
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Send className="w-3.5 h-3.5" />}
                提交
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
