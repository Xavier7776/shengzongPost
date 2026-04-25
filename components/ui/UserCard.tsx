'use client'

// components/ui/UserCard.tsx
// 点击评论头像时弹出的用户信息卡片 —— modal 形式，有遮罩、有过渡

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2, UserPlus, UserCheck, Users, X, ExternalLink } from 'lucide-react'
import RoleBadge from '@/components/ui/RoleBadge'

interface UserCardProps {
  userId: number
  userName: string
  userAvatar: string | null
  userRole: string
  anchorEl: HTMLElement | null
  onClose: () => void
}

interface FollowData {
  isFollowing: boolean
  isMutual: boolean
  following: number
  followers: number
}

interface UserProfile {
  id: number
  name: string
  avatar: string | null
  bio: string | null
  role: string
}

export default function UserCard({ userId, userName, userAvatar, userRole, onClose }: UserCardProps) {
  const { data: session } = useSession()
  const cardRef = useRef<HTMLDivElement>(null)
  const [followData, setFollowData] = useState<FollowData | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [toggling, setToggling] = useState(false)
  const [visible, setVisible] = useState(false)

  const myId = Number((session?.user as { id?: string })?.id ?? 0)
  const isSelf = myId === userId
  const isAiBot = userRole === 'ai'

  // 入场动画
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  // 加载关注状态 + 用户 profile
  useEffect(() => {
    if (isAiBot) return
    fetch(`/api/follows?targetId=${userId}`)
      .then(r => r.json())
      .then(setFollowData)
      .catch(() => {})

    // 尝试从 profile API 拿 bio（若无此接口则忽略）
    fetch(`/api/profile/${userId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setProfile(d))
      .catch(() => {})
  }, [userId, isAiBot])

  // ESC 关闭
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 200)
  }

  async function handleToggleFollow() {
    if (!session?.user || isSelf) return
    setToggling(true)
    try {
      const res = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: userId }),
      })
      const data = await res.json()
      setFollowData(prev => prev ? { ...prev, ...data } : data)
    } finally {
      setToggling(false)
    }
  }

  const displayAvatar = profile?.avatar ?? userAvatar
  const displayBio = profile?.bio

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-all duration-200 ${
        visible ? 'bg-black/30 backdrop-blur-[2px]' : 'bg-transparent'
      }`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div
        ref={cardRef}
        className={`relative w-full sm:w-[340px] bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-200 ${
          visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'
        }`}
      >
        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
        >
          <X className="w-3.5 h-3.5 text-gray-500" />
        </button>

        {/* 顶部背景条 */}
        <div className="h-16 bg-gradient-to-br from-blue-50 to-indigo-100" />

        {/* 头像（叠在背景条上） */}
        <div className="px-5 -mt-8 mb-3 flex items-end justify-between">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-blue-100 flex items-center justify-center ring-4 ring-white shadow-md flex-shrink-0">
            {displayAvatar
              ? <Image src={displayAvatar} alt={userName} width={64} height={64} unoptimized className="w-full h-full object-cover" />
              : <span className="text-blue-600 font-black text-2xl">{userName.charAt(0).toUpperCase()}</span>
            }
          </div>
          {!isAiBot && (
            <Link
              href={`/profile/${userId}`}
              onClick={handleClose}
              className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors mb-1"
            >
              主页 <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>

        {/* 用户名 + 角色 */}
        <div className="px-5 mb-4">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-black text-gray-900 text-base">{userName}</p>
            <RoleBadge role={userRole} size="sm" />
          </div>
          {displayBio && (
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{displayBio}</p>
          )}
          {isAiBot && (
            <p className="text-xs text-gray-400 leading-relaxed mt-1">
              这是由 AI 自动生成的评论账户，不代表真实用户观点。
            </p>
          )}
        </div>

        {!isAiBot && (
          <div className="px-5 pb-5 space-y-3">
            {followData && (
              <div className="flex items-center gap-5 py-3 border-t border-b border-gray-50">
                <div>
                  <p className="text-sm font-black text-gray-900">{followData.following}</p>
                  <p className="text-[10px] text-gray-400 font-bold">关注</p>
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900">{followData.followers}</p>
                  <p className="text-[10px] text-gray-400 font-bold">粉丝</p>
                </div>
                {followData.isMutual && (
                  <div className="flex items-center gap-1 text-[10px] text-violet-500 font-black ml-auto">
                    <Users className="w-3 h-3" />
                    互相关注
                  </div>
                )}
              </div>
            )}

            {session?.user && !isSelf && (
              <button
                onClick={handleToggleFollow}
                disabled={toggling || !followData}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-colors disabled:opacity-50 ${
                  followData?.isFollowing
                    ? 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {toggling
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : followData?.isFollowing
                    ? <><UserCheck className="w-4 h-4" />已关注</>
                    : <><UserPlus className="w-4 h-4" />关注</>
                }
              </button>
            )}

            {!session?.user && (
              <p className="text-xs text-gray-400 text-center py-1">
                <Link href="/login" className="text-blue-500 font-bold hover:underline">登录</Link>后可关注用户
              </p>
            )}

            {isSelf && (
              <p className="text-xs text-gray-400 text-center py-1">这是你自己的账号</p>
            )}
          </div>
        )}

        {isAiBot && <div className="pb-4" />}
      </div>
    </div>
  )
}
