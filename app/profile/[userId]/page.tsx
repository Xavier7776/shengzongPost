'use client'

// app/profile/[userId]/page.tsx
import React from 'react'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, UserCheck, UserPlus, Users,
  Loader2, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react'

interface UserInfo {
  id: number
  name: string
  avatar: string | null
  bio: string | null
}
interface FollowUser {
  id: number
  name: string
  avatar: string | null
  bio: string | null
  isMutual: boolean
}
interface FollowInfo {
  isFollowing: boolean
  isMutual: boolean
  following: number
  followers: number
}

// ── 头像兜底 ──────────────────────────────────────────────────────────────────
function AvatarWithFallback({
  src, name, size, className,
  bgClass = 'bg-blue-100', textClass = 'text-blue-600 text-sm',
}: {
  src: string | null; name: string; size: number
  className?: string; bgClass?: string; textClass?: string
}) {
  const [err, setErr] = React.useState(false)
  return (
    <div className={`rounded-full overflow-hidden flex-shrink-0 ${className ?? ''}`}>
      {src && !err
        ? <Image src={src} alt={name} width={size} height={size}
            className="w-full h-full object-cover" onError={() => setErr(true)} />
        : <div className={`w-full h-full flex items-center justify-center ${bgClass}`}>
            <span className={`font-black ${textClass}`}>{name.charAt(0).toUpperCase()}</span>
          </div>
      }
    </div>
  )
}

// ── 关注列表里的单个用户行 → 点击跳到对方简介页 ──────────────────────────────
function UserRow({ user }: { user: FollowUser }) {
  return (
    <Link
      href={`/profile/${user.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors rounded-xl"
    >
      <AvatarWithFallback src={user.avatar} name={user.name} size={36} className="w-9 h-9" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-gray-900 truncate">{user.name}</span>
          {user.isMutual && (
            <span className="flex-shrink-0 text-[9px] font-black bg-green-100 text-green-600 px-1.5 py-0.5 rounded-md">
              互相关注
            </span>
          )}
        </div>
        {user.bio && <p className="text-xs text-gray-400 truncate mt-0.5">{user.bio}</p>}
      </div>
    </Link>
  )
}

// ── 主页面 ────────────────────────────────────────────────────────────────────
export default function UserProfilePage() {
  const { userId }        = useParams<{ userId: string }>()
  const searchParams      = useSearchParams()
  const { data: session } = useSession()
  const myId     = session ? Number((session.user as { id?: string }).id) : null
  const targetId = Number(userId)
  const isMe     = myId === targetId

  const [user, setUser]     = useState<UserInfo | null>(null)
  const [follow, setFollow] = useState<FollowInfo>({
    isFollowing: false, isMutual: false, following: 0, followers: 0,
  })
  const [loadingUser,   setLoadingUser]   = useState(true)
  const [loadingFollow, setLoadingFollow] = useState(false)

  // 关注列表
  const initTab = (searchParams.get('tab') as 'followers' | 'following') ?? 'followers'
  const [showList,     setShowList]     = useState(!!searchParams.get('tab'))
  const [tab,          setTab]          = useState<'followers' | 'following'>(initTab)
  const [list,         setList]         = useState<FollowUser[]>([])
  const [loadingList,  setLoadingList]  = useState(false)

  // 加载用户信息 + 关注状态
  useEffect(() => {
    setLoadingUser(true)
    fetch(`/api/user/profile?id=${targetId}`)
      .then(r => r.json())
      .then(d => { setUser(d); setLoadingUser(false) })
      .catch(() => setLoadingUser(false))

    fetch(`/api/follows?targetId=${targetId}`)
      .then(r => r.json())
      .then(d => setFollow(d))
  }, [targetId, myId])

  // 加载关注列表（展开时才请求）
  useEffect(() => {
    if (!showList) return
    setLoadingList(true)
    fetch(`/api/follows?userId=${targetId}&list=${tab}`)
      .then(r => r.json())
      .then(d => { setList(Array.isArray(d) ? d : []); setLoadingList(false) })
      .catch(() => setLoadingList(false))
  }, [targetId, tab, showList])

  async function handleFollow() {
    if (!session) { window.location.href = '/login'; return }
    setLoadingFollow(true)
    const res = await fetch('/api/follows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId }),
    })
    if (res.ok) setFollow(await res.json())
    setLoadingFollow(false)
  }

  function openTab(t: 'followers' | 'following') {
    setTab(t)
    setShowList(true)
  }

  if (loadingUser) return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
    </div>
  )
  if (!user) return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
      <p className="text-gray-400">用户不存在</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-24 pb-20 px-4">
      <div className="max-w-lg mx-auto space-y-4">

        {/* 返回 */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-black tracking-widest text-gray-400 hover:text-gray-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />返回首页
        </Link>

        {/* ── 主卡片：用户简介 ── */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          {/* 封面 */}
          <div className="h-24 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600" />

          <div className="px-6 pb-6">
            {/* 头像 + 按钮行 */}
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className="ring-4 ring-white rounded-full">
                <AvatarWithFallback
                  src={user.avatar} name={user.name} size={80}
                  className="w-20 h-20"
                  bgClass="bg-blue-600"
                  textClass="text-white text-2xl"
                />
              </div>

              {isMe ? (
                <Link
                  href="/profile"
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-colors"
                >
                  编辑资料
                </Link>
              ) : (
                <button
                  onClick={handleFollow}
                  disabled={loadingFollow}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 disabled:opacity-60 ${
                    follow.isMutual
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : follow.isFollowing
                      ? 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {loadingFollow
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : follow.isMutual
                    ? <><RefreshCw className="w-3.5 h-3.5" />互相关注</>
                    : follow.isFollowing
                    ? <><UserCheck className="w-3.5 h-3.5" />已关注</>
                    : <><UserPlus className="w-3.5 h-3.5" />关注</>
                  }
                </button>
              )}
            </div>

            {/* 名称 */}
            <h1 className="text-xl font-black text-gray-900">{user.name}</h1>

            {/* Bio */}
            {user.bio ? (
              <p className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-wrap">
                {user.bio}
              </p>
            ) : (
              <p className="text-sm text-gray-300 mt-2 italic">
                {isMe ? '还没有填写简介，去编辑资料添加吧' : '该用户还没有填写简介'}
              </p>
            )}

            {/* 关注数据（点击展开列表） */}
            <div className="flex items-center gap-5 mt-5 pt-5 border-t border-gray-50">
              <button
                onClick={() => openTab('followers')}
                className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
              >
                <Users className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-sm font-black text-gray-900">{follow.followers}</span>
                <span className="text-xs text-gray-400">粉丝</span>
              </button>
              <span className="w-px h-4 bg-gray-100" />
              <button
                onClick={() => openTab('following')}
                className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
              >
                <span className="text-sm font-black text-gray-900">{follow.following}</span>
                <span className="text-xs text-gray-400">关注</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── 关注/粉丝列表（折叠） ── */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="flex border-b border-gray-100">
            {(['followers', 'following'] as const).map(t => (
              <button
                key={t}
                onClick={() => {
                  if (tab === t && showList) setShowList(false)
                  else openTab(t)
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-black transition-colors ${
                  tab === t && showList
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                <Users className="w-4 h-4" />
                {t === 'followers' ? `粉丝 ${follow.followers}` : `关注 ${follow.following}`}
              </button>
            ))}
            <button
              onClick={() => setShowList(v => !v)}
              className="px-4 text-gray-300 hover:text-gray-500 transition-colors"
            >
              {showList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {showList && (
            <div className="p-2 min-h-[80px]">
              {loadingList ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
                </div>
              ) : list.length === 0 ? (
                <p className="text-center text-gray-300 text-sm py-8">
                  {tab === 'followers' ? '还没有粉丝' : '还没有关注任何人'}
                </p>
              ) : (
                list.map(u => <UserRow key={u.id} user={u} />)
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
