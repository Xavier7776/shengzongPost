'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useSearchParams } from 'next/navigation'
import { getReadingHistory } from '@/components/sections/ReadingHistory'
import type { UserInfo, FollowInfo, FollowUser, Post, ProfileTab, HistoryItem } from './types'

export function useUserProfile() {
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
  const [points, setPoints] = useState(0)
  const [frameCssKey, setFrameCssKey] = useState<string | null>(null)

  // Tab 状态
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts')
  const [posts, setPosts]         = useState<Post[]>([])
  const [bookmarks, setBookmarks] = useState<Post[]>([])
  const [likedPosts, setLikedPosts] = useState<Post[]>([])
  const [loadingPosts,     setLoadingPosts]     = useState(false)
  const [loadingBookmarks, setLoadingBookmarks] = useState(false)
  const [loadingLikedPosts, setLoadingLikedPosts] = useState(false)
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])

  // 显示更多状态（默认只展示5篇）
  const [showAllPosts, setShowAllPosts] = useState(false)
  const [showAllLikes, setShowAllLikes] = useState(false)
  const [showAllBookmarks, setShowAllBookmarks] = useState(false)
  const INITIAL_POST_COUNT = 5

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
      .then(d => { setUser(d); setFrameCssKey(d.equipped_frame_css_key ?? null); setLoadingUser(false) })
      .catch(() => setLoadingUser(false))

    fetch(`/api/follows?targetId=${targetId}`)
      .then(r => r.json())
      .then(d => setFollow(d))

    fetch(`/api/points?userId=${targetId}`)
      .then(r => r.json())
      .then(d => setPoints(d.points ?? 0))
      .catch(() => {})
  }, [targetId, myId])

  // 页面重新可见时刷新积分
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        fetch(`/api/points?userId=${targetId}`)
          .then(r => r.json())
          .then(d => setPoints(d.points ?? 0))
          .catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [targetId])

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

  // 加载点赞
  useEffect(() => {
    if (activeTab !== 'likes') return
    setLoadingLikedPosts(true)
    fetch(`/api/user/liked-posts?userId=${targetId}`)
      .then(r => r.json())
      .then(d => { setLikedPosts(Array.isArray(d) ? d : []); setLoadingLikedPosts(false) })
      .catch(() => setLoadingLikedPosts(false))
  }, [targetId, activeTab])

  // 加载浏览记录（仅自己可见）
  useEffect(() => {
    if (isMe) {
      setHistoryItems(getReadingHistory())
    }
  }, [isMe])

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
  return {
    loadingUser, user, isMe, handleFollow, loadingFollow, follow, frameCssKey, openFollowTab, posts,
    points, showList, followTab, setShowList, loadingList, list, setActiveTab, activeTab,
    loadingPosts, showAllPosts, INITIAL_POST_COUNT, setShowAllPosts, loadingLikedPosts, likedPosts,
    showAllLikes, setShowAllLikes, loadingBookmarks, bookmarks, showAllBookmarks,
    setShowAllBookmarks, historyItems,
  }
}

export type UserProfileState = ReturnType<typeof useUserProfile>
