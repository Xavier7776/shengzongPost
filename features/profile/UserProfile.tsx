'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { UserCheck, UserPlus, Loader2, RefreshCw } from 'lucide-react'
import { useUserProfile } from './useUserProfile'
import UserProfileDesktop from './components/UserProfileDesktop'
import UserProfileMobile from './components/UserProfileMobile'

function UserProfileContent() {
  const profile = useUserProfile()
  const { loadingUser, user, isMe, handleFollow, loadingFollow, follow } = profile
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
  return (
    <>
      <UserProfileDesktop {...profile} user={user} followBtn={followBtn} />
      <UserProfileMobile {...profile} user={user} followBtn={followBtn} />
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
