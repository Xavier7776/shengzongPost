'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ThumbsUp, ThumbsDown, Bookmark, BookmarkCheck } from 'lucide-react'

interface Props { slug: string }

interface ReactionState {
  likes: number
  dislikes: number
  userReaction: 'like' | 'dislike' | null
  bookmarked: boolean
  loading: boolean
}

export default function PostActions({ slug }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [state, setState] = useState<ReactionState>({
    likes: 0, dislikes: 0, userReaction: null, bookmarked: false, loading: true,
  })

  useEffect(() => {
    Promise.all([
      fetch(`/api/reactions?slug=${encodeURIComponent(slug)}`).then(r => r.json()),
      session
        ? fetch(`/api/bookmarks?slug=${encodeURIComponent(slug)}`).then(r => r.json())
        : Promise.resolve({ bookmarked: false }),
    ]).then(([reactions, bm]) => {
      setState(s => ({ ...s, ...reactions, bookmarked: bm.bookmarked, loading: false }))
    })
  }, [slug, session])

  function requireLogin() { router.push('/login') }

  async function handleReaction(type: 'like' | 'dislike') {
  if (!session) { requireLogin(); return }
  const res = await fetch('/api/reactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, type }),
  })
  if (res.ok) {
    const data = await res.json()
    setState(s => ({ ...s, ...data }))
  }
}

  async function handleBookmark() {
    if (!session) { requireLogin(); return }
    const res = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    })
    if (res.ok) {
      const { bookmarked } = await res.json()
      setState(s => ({ ...s, bookmarked }))
    }
  }

  if (state.loading) return <div className="h-12" />

  return (
    <div className="flex items-center gap-3 my-10 py-6 border-t border-b border-gray-100">
      {/* 点赞 */}
      <button
        onClick={() => handleReaction('like')}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
          state.userReaction === 'like'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
            : 'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600'
        }`}
      >
        <ThumbsUp className="w-4 h-4" />
        <span>{state.likes}</span>
      </button>

      {/* 踩 */}
      <button
        onClick={() => handleReaction('dislike')}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
          state.userReaction === 'dislike'
            ? 'bg-red-500 text-white shadow-md shadow-red-200'
            : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500'
        }`}
      >
        <ThumbsDown className="w-4 h-4" />
        <span>{state.dislikes}</span>
      </button>

      <div className="flex-1" />

      {/* 收藏 */}
      <button
        onClick={handleBookmark}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
          state.bookmarked
            ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
            : 'bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-500'
        }`}
      >
        {state.bookmarked
          ? <BookmarkCheck className="w-4 h-4" />
          : <Bookmark className="w-4 h-4" />
        }
        {state.bookmarked ? '已收藏' : '收藏'}
      </button>
    </div>
  )
}
