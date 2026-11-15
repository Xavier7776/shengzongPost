'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useReadingHistory } from '@/components/sections/ReadingHistory'
import { useJsonResource } from '@/shared/use-json-resource'
import type { UserInfo, FollowInfo, FollowUser, Post, ProfileTab } from './types'

const EMPTY_FOLLOW: FollowInfo = { isFollowing: false, isMutual: false, following: 0, followers: 0 }

export function useUserProfile() {
  const { userId } = useParams<{ userId: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const myId = session ? Number((session.user as { id?: string } | undefined)?.id) : null
  const targetId = Number(userId)
  const isMe = myId === targetId
  const scope = String(myId ?? '')
  const [loadingFollow, setLoadingFollow] = useState(false)
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts')
  const [showAllPosts, setShowAllPosts] = useState(false)
  const [showAllLikes, setShowAllLikes] = useState(false)
  const [showAllBookmarks, setShowAllBookmarks] = useState(false)
  const INITIAL_POST_COUNT = 5
  const initialFollowTab = searchParams.get('tab') === 'following' ? 'following' : 'followers'
  const [showList, setShowList] = useState(Boolean(searchParams.get('tab')))
  const [followTab, setFollowTab] = useState<'followers' | 'following'>(initialFollowTab)

  const { data: user, loading: loadingUser } = useJsonResource<(UserInfo & { equipped_frame_css_key?: string | null }) | null>(`/api/user/profile?id=${targetId}`, null, scope)
  const { data: follow, setData: setFollow } = useJsonResource(`/api/follows?targetId=${targetId}`, EMPTY_FOLLOW, scope)
  const { data: pointData, reload: refreshPoints } = useJsonResource<{ points?: number }>(`/api/points?userId=${targetId}`, {})
  const { data: postData, loading: loadingPosts } = useJsonResource<Post[]>(`/api/user/posts?userId=${targetId}`, [])
  const { data: bookmarkData, loading: loadingBookmarks } = useJsonResource<Post[]>(isMe && activeTab === 'bookmarks' ? '/api/bookmarks' : null, [], scope)
  const { data: likedData, loading: loadingLikedPosts } = useJsonResource<Post[]>(activeTab === 'likes' ? `/api/user/liked-posts?userId=${targetId}` : null, [])
  const { data: listData, loading: loadingList } = useJsonResource<FollowUser[]>(showList ? `/api/follows?userId=${targetId}&list=${followTab}` : null, [])
  const posts = Array.isArray(postData) ? postData : []
  const bookmarks = Array.isArray(bookmarkData) ? bookmarkData : []
  const likedPosts = Array.isArray(likedData) ? likedData : []
  const list = Array.isArray(listData) ? listData : []
  const history = useReadingHistory(isMe)
  const historyItems = isMe ? history : []
  const points = pointData.points ?? 0
  const frameCssKey = user?.equipped_frame_css_key ?? null

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') refreshPoints() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refreshPoints])

  async function handleFollow() {
    if (!session) { router.push('/login'); return }
    setLoadingFollow(true)
    try {
      const res = await fetch('/api/follows', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetId }),
      })
      if (res.ok) setFollow(await res.json())
    } finally { setLoadingFollow(false) }
  }

  function openFollowTab(tab: 'followers' | 'following') {
    setFollowTab(tab)
    setShowList(true)
  }
  return {
    loadingUser, user, isMe, handleFollow, loadingFollow, follow, frameCssKey, openFollowTab, posts,
    points, showList, followTab, setShowList, loadingList, list, setActiveTab, activeTab,
    loadingPosts, showAllPosts, INITIAL_POST_COUNT, setShowAllPosts, loadingLikedPosts, likedPosts,
    showAllLikes, setShowAllLikes, loadingBookmarks, bookmarks, showAllBookmarks,
    setShowAllBookmarks, historyItems,
  }
}

export type UserProfileState = ReturnType<typeof useUserProfile>
