'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2, MessageCircle, Send, Reply, ChevronDown, ChevronUp, Shield } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Comment {
  id: number
  user_id: number
  user_name: string
  user_role: string
  user_avatar: string | null
  content: string
  created_at: string
  parent_id: number | null
  replies?: Comment[]
}

function UserBadge({ role }: { role: string }) {
  if (role === 'admin') return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-md">
      <Shield className="w-2.5 h-2.5" />管理员
    </span>
  )
  if (role === 'author') return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-violet-500 text-white text-[9px] font-black uppercase tracking-widest rounded-md">
      作者
    </span>
  )
  return null
}

function Avatar({ name, avatar, size = 9 }: { name: string; avatar: string | null; size?: number }) {
  const cls = `flex-shrink-0 w-${size} h-${size} rounded-full overflow-hidden`
  if (avatar) return (
    <div className={cls}>
      <Image src={avatar} alt={name} width={size * 4} height={size * 4} className="w-full h-full object-cover" />
    </div>
  )
  return (
    <div className={`${cls} bg-blue-100 flex items-center justify-center`}>
      <span className="text-blue-600 text-xs font-black">{name.charAt(0).toUpperCase()}</span>
    </div>
  )
}

interface CommentItemProps {
  comment: Comment
  depth: number
  onReply: (id: number, name: string) => void
}

function CommentItem({ comment: c, depth, onReply }: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(true)
  const hasReplies = (c.replies?.length ?? 0) > 0
  const isNested = depth > 0

  return (
    <div className={`${isNested ? 'ml-10 mt-3' : ''}`}>
      <div className="flex gap-3 group">
        <Avatar name={c.user_name} avatar={c.user_avatar} size={isNested ? 7 : 9} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-black text-gray-900">{c.user_name}</span>
            <UserBadge role={c.user_role} />
            <time className="text-xs text-gray-400 font-mono">{c.created_at.slice(0, 10)}</time>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{c.content}</p>
          {/* 回复按钮 */}
          <button
            onClick={() => onReply(c.id, c.user_name)}
            className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-all duration-150"
          >
            <Reply className="w-3 h-3" />
            回复
          </button>
        </div>
      </div>

      {/* 嵌套回复 */}
      {hasReplies && (
        <div className="ml-10 mt-2">
          <button
            onClick={() => setShowReplies(v => !v)}
            className="flex items-center gap-1 text-xs text-blue-500 font-bold mb-2 hover:text-blue-700"
          >
            {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showReplies ? '收起' : `展开`} {c.replies!.length} 条回复
          </button>
          {showReplies && (
            <div className="border-l-2 border-gray-100 pl-4 space-y-4">
              {c.replies!.map(r => (
                <CommentItem key={r.id} comment={r} depth={depth + 1} onReply={onReply} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CommentSection({ slug }: { slug: string }) {
  const { data: session, status } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ✅ 修复：用 useCallback 稳定函数引用，slug 作为依赖
  const loadComments = useCallback(() => {
    fetch(`/api/comments?slug=${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(data => { setComments(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [slug])

  // ✅ 修复：依赖数组改为 [loadComments]，lint 规则满足，且无无限循环风险
  useEffect(() => { loadComments() }, [loadComments])

  function handleReply(id: number, name: string) {
    setReplyTo({ id, name })
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  async function handleSubmit() {
    if (!content.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_slug: slug, content: content.trim(), parent_id: replyTo?.id ?? null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '提交失败'); return }
      setContent('')
      setReplyTo(null)
      setSubmitted(true)
    } catch { setError('网络错误，请重试') }
    finally { setSubmitting(false) }
  }

  const total = comments.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0)
  const userAvatar = (session?.user as { image?: string })?.image ?? null
  const userName = session?.user?.name ?? ''

  return (
    <section className="mt-20 pt-12 border-t border-gray-100">
      <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-gray-900 mb-8">
        <MessageCircle className="w-5 h-5 text-blue-500" />
        评论
        {total > 0 && <span className="text-sm font-bold text-gray-400">({total})</span>}
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
        <div className="space-y-6 mb-10">
          {comments.map(c => (
            <CommentItem key={c.id} comment={c} depth={0} onReply={handleReply} />
          ))}
        </div>
      )}

      {/* 输入区 */}
      <div className="bg-gray-50 rounded-2xl p-5">
        {status === 'loading' ? null : !session ? (
          <div className="text-center py-4 space-y-3">
            <p className="text-sm text-gray-500">登录后参与评论</p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/login" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors">登录</Link>
              <Link href="/register" className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold rounded-xl transition-colors">注册</Link>
            </div>
          </div>
        ) : submitted ? (
          <div className="text-center py-4 space-y-2">
            <p className="text-sm font-bold text-gray-700">✓ 评论已提交，审核后显示</p>
            <button onClick={() => { setSubmitted(false); loadComments() }} className="text-xs text-blue-500 hover:underline mt-1">继续评论</button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* 用户信息行 */}
            <div className="flex items-center gap-2">
              <Avatar name={userName} avatar={userAvatar} size={7} />
              <span className="text-sm font-bold text-gray-700">{userName}</span>
            </div>

            {/* 回复提示 */}
            {replyTo && (
              <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-1.5">
                <Reply className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs text-blue-600 font-bold">回复 @{replyTo.name}</span>
                <button onClick={() => setReplyTo(null)} className="ml-auto text-xs text-gray-400 hover:text-gray-600">✕</button>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={content}
              onChange={e => { setContent(e.target.value); setError('') }}
              placeholder={replyTo ? `回复 @${replyTo.name}…` : '写下你的想法…'}
              rows={3}
              maxLength={1000}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors resize-none"
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300">{content.length}/1000</span>
              <button
                onClick={handleSubmit}
                disabled={submitting || !content.trim()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                提交
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
