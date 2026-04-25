'use client'

// 路径：components/sections/AuthorCard.tsx  ← 这是新建文件，不是修改已有文件
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { UserPlus, UserCheck } from 'lucide-react'

interface AuthorCardProps {
  name: string
  avatar: string | null
  bio: string | null
  authorId?: number | null
}

export default function AuthorCard({ name, avatar, bio, authorId }: AuthorCardProps) {
  const initial = name.charAt(0).toUpperCase()
  const { data: session } = useSession()
  const [isFollowing, setIsFollowing] = useState(false)
  const [followers, setFollowers] = useState(0)
  const [loading, setLoading] = useState(false)

  const myId = Number((session?.user as { id?: string })?.id ?? 0)
  const isSelf = !!(authorId && myId && myId === authorId)

  useEffect(() => {
    if (!authorId) return
    fetch(`/api/follows?targetId=${authorId}`)
      .then(r => r.json())
      .then(d => {
        setIsFollowing(!!d.isFollowing)
        setFollowers(Number(d.followers) || 0)
      })
      .catch(() => {})
  }, [authorId])

  async function handleFollow(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!session) { window.location.href = '/login'; return }
    if (!authorId) return
    setLoading(true)
    try {
      const res = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: authorId }),
      })
      const d = await res.json()
      setIsFollowing(!!d.isFollowing)
      setFollowers(Number(d.followers) || 0)
    } catch {}
    setLoading(false)
  }

  const card = (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-8 hover:bg-gray-100/70 hover:border-gray-200 transition-colors group/card">
      <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center ring-2 ring-white shadow-sm">
        {avatar
          ? <Image src={avatar} alt={name} width={48} height={48} className="w-full h-full object-cover" unoptimized />
          : <span className="text-white font-black text-base">{initial}</span>
        }
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">作者</p>
        <p className="text-sm font-black text-gray-900 group-hover/card:text-blue-600 transition-colors">{name}</p>
        {bio && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{bio}</p>}
      </div>

      {/* 关注按钮：有 authorId、且不是自己 */}
      {!!authorId && !isSelf && (
        <button
          onClick={handleFollow}
          disabled={loading}
          className={[
            'flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all disabled:opacity-60',
            isFollowing
              ? 'bg-white text-gray-500 hover:bg-red-50 hover:text-red-500 border border-gray-200'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
          ].join(' ')}
        >
          {isFollowing
            ? <><UserCheck className="w-3.5 h-3.5" /><span>已关注</span></>
            : <><UserPlus className="w-3.5 h-3.5" /><span>关注</span></>
          }
          {followers > 0 && (
            <span className={`text-[10px] tabular-nums ${isFollowing ? 'text-gray-400' : 'text-blue-200'}`}>
              {followers}
            </span>
          )}
        </button>
      )}
    </div>
  )

  return authorId
    ? <Link href={`/profile/${authorId}`} className="block no-underline">{card}</Link>
    : card
}
