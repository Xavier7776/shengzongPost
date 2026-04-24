'use client'

// app/profile/[userId]/userId.tsx
import React, { useEffect, useState, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, UserCheck, UserPlus, Users,
  Loader2, RefreshCw, MapPin, Calendar, LinkIcon,
  FileText, Heart, Bookmark, ChevronDown, ChevronUp,
  MessageCircle, Clock,
} from 'lucide-react'

// ── 类型定义 ──────────────────────────────────────────────────────────────────
interface UserInfo {
  id: number
  name: string
  avatar: string | null
  bio: string | null
  location?: string | null
  website?: string | null
  createdAt?: string | null
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
interface Post {
  id: number
  slug: string
  title: string
  excerpt: string | null
  tags: string[] | null
  created_at: string
  cover_image: string | null
  views?: number
  reactions?: number
  comments?: number
  read_time?: number
}

type ProfileTab = 'posts' | 'likes' | 'bookmarks'

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

// ── 关注列表用户行 ─────────────────────────────────────────────────────────────
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

// ── 文章卡片（桌面端列表样式）────────────────────────────────────────────────
function PostCardDesktop({ post }: { post: Post }) {
  const date = new Date(post.created_at).toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
  const readMin = post.read_time ?? Math.max(1, Math.ceil((post.excerpt?.length ?? 300) / 300))

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="block px-6 py-5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60 transition-colors group"
    >
      <h3 className="text-[15px] font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
        {post.title}
      </h3>
      {post.excerpt && (
        <p className="text-sm text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
          {post.excerpt}
        </p>
      )}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>{date}</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {readMin} 分钟
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          {(post.reactions ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {post.reactions}
            </span>
          )}
          {(post.comments ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {post.comments}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

// ── 文章卡片（手机端卡片样式，原版本）────────────────────────────────────────
function PostCardMobile({ post }: { post: Post }) {
  const date = new Date(post.created_at).toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="block bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow group"
    >
      <h3 className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
        {post.title}
      </h3>
      {post.excerpt && (
        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
          {post.excerpt}
        </p>
      )}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <span className="text-[10px] text-gray-400">{date}</span>
        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          {(post.reactions ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" /> {post.reactions}
            </span>
          )}
          {(post.comments ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" /> {post.comments}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

// ── 空状态 ────────────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-gray-300">
      <Icon className="w-8 h-8" />
      <p className="text-sm">{text}</p>
    </div>
  )
}

// ── 主页面 ────────────────────────────────────────────────────────────────────
function UserProfileContent() {
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

  // Tab 状态
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts')
  const [posts, setPosts]         = useState<Post[]>([])
  const [bookmarks, setBookmarks] = useState<Post[]>([])
  const [loadingPosts,     setLoadingPosts]     = useState(false)
  const [loadingBookmarks, setLoadingBookmarks] = useState(false)

  // 关注列表折叠状态
  const initTab = (searchParams.get('tab') as 'followers' | 'following') ?? 'followers'
  const [showList, setShowList]   = useState(!!searchParams.get('tab'))
  const [followTab, setFollowTab] = useState<'followers' | 'following'>(initTab)
  const [list, setList]           = useState<FollowUser[]>([])
  const [loadingList, setLoadingList] = useState(false)

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

  // 加载文章
  useEffect(() => {
    setLoadingPosts(true)
    fetch(`/api/user/posts?userId=${targetId}`)
      .then(r => r.json())
      .then(d => { setPosts(Array.isArray(d) ? d : []); setLoadingPosts(false) })
      .catch(() => setLoadingPosts(false))
  }, [targetId])

  // 加载收藏（只有自己才能看）
  useEffect(() => {
    if (!isMe || activeTab !== 'bookmarks') return
    setLoadingBookmarks(true)
    fetch('/api/bookmarks')
      .then(r => r.json())
      .then(d => { setBookmarks(Array.isArray(d) ? d : []); setLoadingBookmarks(false) })
      .catch(() => setLoadingBookmarks(false))
  }, [isMe, activeTab])

  // 关注列表
  useEffect(() => {
    if (!showList) return
    setLoadingList(true)
    fetch(`/api/follows?userId=${targetId}&list=${followTab}`)
      .then(r => r.json())
      .then(d => { setList(Array.isArray(d) ? d : []); setLoadingList(false) })
      .catch(() => setLoadingList(false))
  }, [targetId, followTab, showList])

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

  function openFollowTab(t: 'followers' | 'following') {
    setFollowTab(t)
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

  // 关注/编辑按钮（共用）
  const followBtn = isMe ? (
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
  )

  // ════════════════════════════════════════════════════════════════════════════
  // 桌面端布局（≥ 768px）：左 sidebar + 右主内容，对应截图样式
  // ════════════════════════════════════════════════════════════════════════════
  const desktopLayout = (
    <div className="hidden md:block min-h-screen bg-[#F3F4F6] pt-20 pb-16">
      <div className="max-w-5xl mx-auto w-full px-6 flex gap-7 items-start">

        {/* ── 左侧 Sidebar ── */}
        <aside className="w-64 flex-shrink-0 sticky top-24 space-y-4">
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600" />
            <div className="px-5 pb-5">
              <div className="flex items-end justify-between -mt-8 mb-3">
                <div className="ring-3 ring-white rounded-full">
                  <AvatarWithFallback
                    src={user.avatar} name={user.name} size={64}
                    className="w-16 h-16"
                    bgClass="bg-blue-600"
                    textClass="text-white text-xl"
                  />
                </div>
                {followBtn}
              </div>

              <h1 className="text-base font-black text-gray-900 leading-tight">{user.name}</h1>
              <p className="text-xs text-gray-400 mt-0.5">@{user.name.toLowerCase().replace(/\s+/g, '_')}</p>

              {user.bio && (
                <p className="text-xs text-gray-600 mt-3 leading-relaxed whitespace-pre-wrap">
                  {user.bio}
                </p>
              )}

              <div className="mt-4 space-y-1.5">
                {user.location && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" /><span>{user.location}</span>
                  </div>
                )}
                {user.website && (
                  <a
                    href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-500 hover:underline"
                  >
                    <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{user.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
                {user.createdAt && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{new Date(user.createdAt).getFullYear()} 年加入</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50">
                <button onClick={() => openFollowTab('following')} className="flex flex-col hover:opacity-70 transition-opacity">
                  <span className="text-sm font-black text-gray-900">{follow.following}</span>
                  <span className="text-[10px] text-gray-400">关注</span>
                </button>
                <button onClick={() => openFollowTab('followers')} className="flex flex-col hover:opacity-70 transition-opacity">
                  <span className="text-sm font-black text-gray-900">{follow.followers}</span>
                  <span className="text-[10px] text-gray-400">粉丝</span>
                </button>
                <div className="flex flex-col ml-auto">
                  <span className="text-sm font-black text-gray-900">{posts.length}</span>
                  <span className="text-[10px] text-gray-400">文章</span>
                </div>
              </div>
            </div>
          </div>

          {/* 关注列表折叠 */}
          {showList && (
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="flex border-b border-gray-100">
                {(['followers', 'following'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => followTab === t ? setShowList(false) : openFollowTab(t)}
                    className={`flex-1 py-3 text-xs font-black transition-colors ${
                      followTab === t
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    {t === 'followers' ? `粉丝 ${follow.followers}` : `关注 ${follow.following}`}
                  </button>
                ))}
              </div>
              <div className="p-2 max-h-72 overflow-y-auto">
                {loadingList ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 text-gray-300 animate-spin" /></div>
                ) : list.length === 0 ? (
                  <p className="text-center text-gray-300 text-xs py-6">
                    {followTab === 'followers' ? '还没有粉丝' : '还没有关注任何人'}
                  </p>
                ) : list.map(u => <UserRow key={u.id} user={u} />)}
              </div>
            </div>
          )}
        </aside>

        {/* ── 右侧主内容区 ── */}
        <main className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-gray-100 px-2">
              {([
                { key: 'posts',     label: '文章',  icon: FileText  },
                { key: 'likes',     label: '点赞',  icon: Heart     },
                ...(isMe ? [{ key: 'bookmarks', label: '收藏夹', icon: Bookmark }] : []),
              ] as { key: ProfileTab; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 px-4 py-4 text-sm font-bold border-b-2 transition-colors ${
                    activeTab === key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab 内容 */}
            <div className="min-h-[300px]">
              {activeTab === 'posts' && (
                loadingPosts
                  ? <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
                  : posts.length === 0
                  ? <EmptyState icon={FileText} text="还没有发布任何文章" />
                  : posts.map(p => <PostCardDesktop key={p.id} post={p} />)
              )}
              {activeTab === 'likes' && (
                <EmptyState icon={Heart} text="点赞功能暂未开放公开展示" />
              )}
              {activeTab === 'bookmarks' && isMe && (
                loadingBookmarks
                  ? <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
                  : bookmarks.length === 0
                  ? <EmptyState icon={Bookmark} text="还没有收藏任何文章" />
                  : bookmarks.map(p => <PostCardDesktop key={p.id} post={p} />)
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )

  // ════════════════════════════════════════════════════════════════════════════
  // 手机端布局（< 768px）：原版单栏设计，保持不变
  // ════════════════════════════════════════════════════════════════════════════
  const mobileLayout = (
    <div className="md:hidden min-h-screen bg-[#FAFAF8] pt-24 pb-20 px-4">
      <div className="max-w-lg mx-auto space-y-4">

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-black tracking-widest text-gray-400 hover:text-gray-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />返回首页
        </Link>

        {/* 主卡片 */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="h-24 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600" />
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className="ring-4 ring-white rounded-full">
                <AvatarWithFallback
                  src={user.avatar} name={user.name} size={80}
                  className="w-20 h-20"
                  bgClass="bg-blue-600"
                  textClass="text-white text-2xl"
                />
              </div>
              {followBtn}
            </div>

            <h1 className="text-xl font-black text-gray-900">{user.name}</h1>

            {user.bio ? (
              <p className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-wrap">{user.bio}</p>
            ) : (
              <p className="text-sm text-gray-300 mt-2 italic">
                {isMe ? '还没有填写简介，去编辑资料添加吧' : '该用户还没有填写简介'}
              </p>
            )}

            <div className="mt-3 space-y-1.5">
              {user.location && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <MapPin className="w-3.5 h-3.5" /><span>{user.location}</span>
                </div>
              )}
              {user.website && (
                <a
                  href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-500 hover:underline"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span className="truncate">{user.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
            </div>

            <div className="flex items-center gap-5 mt-5 pt-5 border-t border-gray-50">
              <button
                onClick={() => openFollowTab('followers')}
                className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
              >
                <Users className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-sm font-black text-gray-900">{follow.followers}</span>
                <span className="text-xs text-gray-400">粉丝</span>
              </button>
              <span className="w-px h-4 bg-gray-100" />
              <button
                onClick={() => openFollowTab('following')}
                className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
              >
                <span className="text-sm font-black text-gray-900">{follow.following}</span>
                <span className="text-xs text-gray-400">关注</span>
              </button>
            </div>
          </div>
        </div>

        {/* 关注/粉丝列表折叠 */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="flex border-b border-gray-100">
            {(['followers', 'following'] as const).map(t => (
              <button
                key={t}
                onClick={() => {
                  if (followTab === t && showList) setShowList(false)
                  else openFollowTab(t)
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-black transition-colors ${
                  followTab === t && showList
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
              {loadingList
                ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
                : list.length === 0
                ? <p className="text-center text-gray-300 text-sm py-8">
                    {followTab === 'followers' ? '还没有粉丝' : '还没有关注任何人'}
                  </p>
                : list.map(u => <UserRow key={u.id} user={u} />)
              }
            </div>
          )}
        </div>

        {/* 文章 Tab（手机端） */}
        <div className="space-y-3">
          <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1">
            {([
              { key: 'posts', label: '文章' },
              { key: 'likes', label: '点赞' },
              ...(isMe ? [{ key: 'bookmarks', label: '收藏夹' }] : []),
            ] as { key: ProfileTab; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-colors ${
                  activeTab === key ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'posts' && (
            loadingPosts
              ? <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
              : posts.length === 0
              ? <div className="flex flex-col items-center gap-2 py-10 text-gray-300">
                  <FileText className="w-6 h-6" /><p className="text-sm">还没有发布任何文章</p>
                </div>
              : posts.map(p => <PostCardMobile key={p.id} post={p} />)
          )}

          {activeTab === 'likes' && (
            <div className="flex flex-col items-center gap-2 py-10 text-gray-300">
              <Heart className="w-6 h-6" /><p className="text-sm">点赞功能暂未开放公开展示</p>
            </div>
          )}

          {activeTab === 'bookmarks' && isMe && (
            loadingBookmarks
              ? <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
              : bookmarks.length === 0
              ? <div className="flex flex-col items-center gap-2 py-10 text-gray-300">
                  <Bookmark className="w-6 h-6" /><p className="text-sm">还没有收藏任何文章</p>
                </div>
              : bookmarks.map(p => <PostCardMobile key={p.id} post={p} />)
          )}
        </div>

      </div>
    </div>
  )

  return (
    <>
      {desktopLayout}
      {mobileLayout}
    </>
  )
}

export default function UserProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <UserProfileContent />
    </Suspense>
  )
}