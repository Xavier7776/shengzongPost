'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, UserCheck, UserPlus, Users, Bookmark, Loader2, RefreshCw } from 'lucide-react'

interface UserInfo { id: number; name: string; avatar: string | null; bio: string | null }
interface FollowUser { id: number; name: string; avatar: string | null; bio: string | null; isMutual: boolean }
interface FollowInfo { isFollowing: boolean; isMutual: boolean; following: number; followers: number }

function UserCard({ user, currentUserId }: { user: FollowUser; currentUserId?: number }) {
  return (
    <Link href={`/profile/${user.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
        {user.avatar
          ? <Image src={user.avatar} alt={user.name} width={40} height={40} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-blue-100 flex items-center justify-center"><span className="text-blue-600 text-sm font-black">{user.name.charAt(0).toUpperCase()}</span></div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-gray-900 truncate">{user.name}</span>
          {user.isMutual && (
            <span className="flex-shrink-0 text-[9px] font-black bg-green-100 text-green-600 px-1.5 py-0.5 rounded-md">互相关注</span>
          )}
        </div>
        {user.bio && <p className="text-xs text-gray-400 truncate mt-0.5">{user.bio}</p>}
      </div>
    </Link>
  )
}

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const { data: session } = useSession()
  const myId = session ? Number((session.user as { id?: string }).id) : null
  const targetId = Number(userId)
  const isMe = myId === targetId

  const [user, setUser] = useState<UserInfo | null>(null)
  const [follow, setFollow] = useState<FollowInfo>({ isFollowing: false, isMutual: false, following: 0, followers: 0 })
  const [tab, setTab] = useState<'following' | 'followers'>('followers')
  const [list, setList] = useState<FollowUser[]>([])
  const [loadingUser, setLoadingUser] = useState(true)
  const [loadingFollow, setLoadingFollow] = useState(false)
  const [loadingList, setLoadingList] = useState(true)

  useEffect(() => {
    fetch(`/api/user/profile?id=${targetId}`)
      .then(r => r.json())
      .then(d => { setUser(d); setLoadingUser(false) })
      .catch(() => setLoadingUser(false))

    fetch(`/api/follows?targetId=${targetId}`)
      .then(r => r.json())
      .then(d => setFollow(d))
  }, [targetId, myId])

  useEffect(() => {
    setLoadingList(true)
    fetch(`/api/follows?userId=${targetId}&list=${tab}`)
      .then(r => r.json())
      .then(d => { setList(Array.isArray(d) ? d : []); setLoadingList(false) })
      .catch(() => setLoadingList(false))
  }, [targetId, tab])

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
    <div className="min-h-screen bg-[#FAFAF8] pt-24 pb-16 px-4">
      <div className="max-w-lg mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-black tracking-widest text-gray-400 hover:text-gray-900 transition-colors mb-8">
          <ArrowLeft className="w-3.5 h-3.5" />返回首页
        </Link>

        {/* 用户卡片 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
              {user.avatar
                ? <Image src={user.avatar} alt={user.name} width={64} height={64} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-blue-600 flex items-center justify-center"><span className="text-white text-xl font-black">{user.name.charAt(0).toUpperCase()}</span></div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-gray-900">{user.name}</h1>
              {user.bio && <p className="text-sm text-gray-500 mt-1 leading-relaxed">{user.bio}</p>}

              {/* 关注数据 */}
              <div className="flex items-center gap-4 mt-3">
                <button onClick={() => setTab('followers')} className="text-center hover:opacity-70 transition-opacity">
                  <p className="text-lg font-black text-gray-900">{follow.followers}</p>
                  <p className="text-xs text-gray-400">粉丝</p>
                </button>
                <button onClick={() => setTab('following')} className="text-center hover:opacity-70 transition-opacity">
                  <p className="text-lg font-black text-gray-900">{follow.following}</p>
                  <p className="text-xs text-gray-400">关注</p>
                </button>
              </div>
            </div>

            {/* 关注/编辑按钮 */}
            {isMe ? (
              <Link href="/profile" className="flex-shrink-0 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold rounded-xl transition-colors">
                编辑资料
              </Link>
            ) : (
              <button
                onClick={handleFollow}
                disabled={loadingFollow}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 disabled:opacity-60 ${
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
        </div>

        {/* 关注列表 */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="flex border-b border-gray-100">
            {(['followers', 'following'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-black transition-colors ${
                  tab === t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                <Users className="w-4 h-4" />
                {t === 'followers' ? `粉丝 ${follow.followers}` : `关注 ${follow.following}`}
              </button>
            ))}
          </div>

          <div className="p-2 min-h-[120px]">
            {loadingList ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
            ) : list.length === 0 ? (
              <p className="text-center text-gray-300 text-sm py-8">
                {tab === 'followers' ? '还没有粉丝' : '还没有关注任何人'}
              </p>
            ) : (
              list.map(u => <UserCard key={u.id} user={u} currentUserId={myId ?? undefined} />)
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
