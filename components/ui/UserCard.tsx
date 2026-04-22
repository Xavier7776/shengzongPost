'use client'

// components/ui/UserCard.tsx
// 点击评论头像时弹出的用户信息卡片

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { Loader2, UserPlus, UserCheck, Users } from 'lucide-react'

interface UserCardProps {
  userId: number
  userName: string
  userAvatar: string | null
  userRole: string
  anchorEl: HTMLElement | null   // 触发弹出的 DOM 元素
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

export default function UserCard({ userId, userName, userAvatar, userRole, anchorEl, onClose }: UserCardProps) {
  const { data: session } = useSession()
  const cardRef = useRef<HTMLDivElement>(null)
  const [followData, setFollowData] = useState<FollowData | null>(null)
  const [toggling, setToggling] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const myId = Number((session?.user as { id?: string })?.id ?? 0)
  const isSelf = myId === userId
  const isAiBot = userRole === 'ai'

  // ── 计算弹出位置 ──
  useEffect(() => {
    if (!anchorEl || !cardRef.current) return
    const rect = anchorEl.getBoundingClientRect()
    const cardW = 260
    const cardH = 200
    let left = rect.right + 8 + window.scrollX
    let top = rect.top + window.scrollY

    // 右侧放不下则放左侧
    if (left + cardW > window.innerWidth) left = rect.left - cardW - 8 + window.scrollX
    // 底部放不下则上移
    if (top + cardH > window.innerHeight + window.scrollY) top = rect.bottom - cardH + window.scrollY

    setPos({ top, left })
  }, [anchorEl])

  // ── 加载关注状态 ──
  useEffect(() => {
    if (isAiBot) return
    fetch(`/api/follows?targetId=${userId}`)
      .then(r => r.json())
      .then(setFollowData)
      .catch(() => {})
  }, [userId, isAiBot])

  // ── 点击外部关闭 ──
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node) &&
          anchorEl && !anchorEl.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [anchorEl, onClose])

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

  return (
    <div
      ref={cardRef}
      style={{ position: 'absolute', top: pos.top, left: pos.left, zIndex: 9999 }}
      className="w-[260px] bg-white rounded-2xl shadow-xl border border-gray-100 p-4 animate-in fade-in zoom-in-95 duration-150"
    >
      {/* 头部：头像 + 名字 */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-blue-100 flex items-center justify-center">
          {userAvatar
            ? <Image src={userAvatar} alt={userName} width={48} height={48} unoptimized className="w-full h-full object-cover" />
            : <span className="text-blue-600 font-black text-lg">{userName.charAt(0).toUpperCase()}</span>
          }
        </div>
        <div className="min-w-0">
          <p className="font-black text-gray-900 text-sm truncate">{userName}</p>
          {isAiBot && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md bg-gradient-to-r from-violet-500 to-indigo-500 text-white mt-0.5">
              AI 助手
            </span>
          )}
          {userRole === 'admin' && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md bg-blue-600 text-white mt-0.5">
              管理员
            </span>
          )}
        </div>
      </div>

      {/* AI Bot 提示 */}
      {isAiBot ? (
        <p className="text-xs text-gray-400 leading-relaxed">
          这是由 AI 自动生成的评论账户，不代表真实用户观点。
        </p>
      ) : (
        <>
          {/* 关注数 */}
          {followData && (
            <div className="flex gap-4 mb-3">
              <div className="text-center">
                <p className="text-sm font-black text-gray-900">{followData.following}</p>
                <p className="text-[10px] text-gray-400 font-bold">关注</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-gray-900">{followData.followers}</p>
                <p className="text-[10px] text-gray-400 font-bold">粉丝</p>
              </div>
              {followData.isMutual && (
                <div className="flex items-center gap-1 text-[10px] text-violet-500 font-black ml-auto self-center">
                  <Users className="w-3 h-3" />
                  互相关注
                </div>
              )}
            </div>
          )}

          {/* 关注按钮 */}
          {session?.user && !isSelf && (
            <button
              onClick={handleToggleFollow}
              disabled={toggling || !followData}
              className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-colors disabled:opacity-50 ${
                followData?.isFollowing
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {toggling
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : followData?.isFollowing
                  ? <><UserCheck className="w-3.5 h-3.5" />已关注</>
                  : <><UserPlus className="w-3.5 h-3.5" />关注</>
              }
            </button>
          )}

          {!session?.user && (
            <p className="text-xs text-gray-400 text-center">登录后可关注用户</p>
          )}

          {isSelf && (
            <p className="text-xs text-gray-400 text-center">这是你自己</p>
          )}
        </>
      )}
    </div>
  )
}
