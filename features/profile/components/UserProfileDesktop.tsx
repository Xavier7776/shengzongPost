'use client'

import React from 'react'
import Link from 'next/link'
import {
  Loader2, MapPin, Calendar, LinkIcon, FileText, Heart, Bookmark, ChevronDown, Clock, History,
  Github, Twitter, Quote, Star,
} from 'lucide-react'
import AvatarFrame from '@/components/ui/AvatarFrame'
import type { UserProfileState } from '../useUserProfile'
import type { ProfileTab } from '../types'
import { AvatarWithFallback, UserRow, PostCardDesktop, EmptyState } from './ProfileCards'

export default function UserProfileDesktop({ frameCssKey, user, followBtn, openFollowTab, follow, posts, points, showList, followTab, setShowList, loadingList, list, isMe, setActiveTab, activeTab, loadingPosts, showAllPosts, INITIAL_POST_COUNT, setShowAllPosts, loadingLikedPosts, likedPosts, showAllLikes, setShowAllLikes, loadingBookmarks, bookmarks, showAllBookmarks, setShowAllBookmarks, historyItems }: Pick<UserProfileState, 'frameCssKey' | 'openFollowTab' | 'follow' | 'posts' | 'points' | 'showList' | 'followTab' | 'setShowList' | 'loadingList' | 'list' | 'isMe' | 'setActiveTab' | 'activeTab' | 'loadingPosts' | 'showAllPosts' | 'INITIAL_POST_COUNT' | 'setShowAllPosts' | 'loadingLikedPosts' | 'likedPosts' | 'showAllLikes' | 'setShowAllLikes' | 'loadingBookmarks' | 'bookmarks' | 'showAllBookmarks' | 'setShowAllBookmarks' | 'historyItems'> & { user: NonNullable<UserProfileState['user']>; followBtn: React.ReactNode }) {
  return (
    <div className="hidden md:block min-h-screen bg-[#F3F4F6] pt-20 pb-16">
      <div className="max-w-5xl mx-auto w-full px-6 flex gap-7 items-start">

        {/* ── 左侧 Sidebar ── */}
        <aside className="w-64 flex-shrink-0 sticky top-24 space-y-4">
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600" />
            <div className="px-5 pb-5">
              <div className="flex items-end justify-between -mt-8 mb-3">
                <AvatarFrame frameCssKey={frameCssKey} shape="circle" size={64}>
                  <div className="ring-3 ring-white rounded-full">
                    <AvatarWithFallback
                      src={user.avatar} name={user.name} size={64} userId={user.id}
                      className="w-16 h-16"
                      bgClass="bg-blue-600"
                      textClass="text-white text-xl"
                    />
                  </div>
                </AvatarFrame>
                {followBtn}
              </div>

              <h1 className="text-base font-black text-gray-900 leading-tight">{user.name}</h1>
              <p className="text-xs text-gray-400 mt-0.5">@{user.name.toLowerCase().replace(/\s+/g, '_')}</p>

              {user.title && (
                <p className="text-xs font-semibold text-blue-600 mt-1">{user.title}</p>
              )}
              {user.motto && (
                <p className="text-xs text-gray-500 mt-1 italic flex items-center gap-1">
                  <Quote className="w-3 h-3 text-gray-300 flex-shrink-0" />
                  {user.motto}
                </p>
              )}

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
                {user.github_url && (
                  <a
                    href={user.github_url}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    <Github className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{user.github_url.replace(/^https?:\/\/(www\.)?github\.com\//, '')}</span>
                  </a>
                )}
                {user.twitter_url && (
                  <a
                    href={user.twitter_url}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    <Twitter className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{user.twitter_url.replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//, '@')}</span>
                  </a>
                )}
                {user.createdAt && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{new Date(user.createdAt).getFullYear()} 年加入</span>
                  </div>
                )}
              </div>

              {user.tech_stack && user.tech_stack.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {user.tech_stack.map(skill => (
                    <span key={skill} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-semibold">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-4 border-t border-gray-50">
                <button onClick={() => openFollowTab('following')} className="flex flex-col hover:opacity-70 transition-opacity">
                  <span className="text-sm font-black text-gray-900">{follow.following}</span>
                  <span className="text-[10px] text-gray-400">关注</span>
                </button>
                <button onClick={() => openFollowTab('followers')} className="flex flex-col hover:opacity-70 transition-opacity">
                  <span className="text-sm font-black text-gray-900">{follow.followers}</span>
                  <span className="text-[10px] text-gray-400">粉丝</span>
                </button>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-gray-900">{posts.length}</span>
                  <span className="text-[10px] text-gray-400">文章</span>
                </div>
                <div className="flex flex-col ml-auto">
                  <span className="flex items-center gap-1 text-sm font-black text-amber-500 whitespace-nowrap">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
                    <span className="tabular-nums">{points.toLocaleString()}</span>
                  </span>
                  <span className="text-[10px] text-gray-400">积分</span>
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
                ...(isMe ? [{ key: 'history', label: '浏览记录', icon: History }] : []),
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
                  : <>
                      {(showAllPosts ? posts : posts.slice(0, INITIAL_POST_COUNT)).map(p => <PostCardDesktop key={p.id} post={p} />)}
                      {posts.length > INITIAL_POST_COUNT && (
                        <button
                          onClick={() => setShowAllPosts(v => !v)}
                          className="w-full py-4 text-sm font-bold text-blue-600 hover:bg-blue-50/60 transition-colors flex items-center justify-center gap-1.5"
                        >
                          {showAllPosts ? '收起' : `显示更多（${posts.length - INITIAL_POST_COUNT} 篇）`}
                          <ChevronDown className={`w-4 h-4 transition-transform ${showAllPosts ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </>
              )}
              {activeTab === 'likes' && (
                loadingLikedPosts
                  ? <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
                  : likedPosts.length === 0
                  ? <EmptyState icon={Heart} text="还没有点赞任何文章" />
                  : <>
                      {(showAllLikes ? likedPosts : likedPosts.slice(0, INITIAL_POST_COUNT)).map(p => <PostCardDesktop key={p.id} post={p} />)}
                      {likedPosts.length > INITIAL_POST_COUNT && (
                        <button
                          onClick={() => setShowAllLikes(v => !v)}
                          className="w-full py-4 text-sm font-bold text-blue-600 hover:bg-blue-50/60 transition-colors flex items-center justify-center gap-1.5"
                        >
                          {showAllLikes ? '收起' : `显示更多（${likedPosts.length - INITIAL_POST_COUNT} 篇）`}
                          <ChevronDown className={`w-4 h-4 transition-transform ${showAllLikes ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </>
              )}
              {activeTab === 'bookmarks' && isMe && (
                loadingBookmarks
                  ? <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
                  : bookmarks.length === 0
                  ? <EmptyState icon={Bookmark} text="还没有收藏任何文章" />
                  : <>
                      {(showAllBookmarks ? bookmarks : bookmarks.slice(0, INITIAL_POST_COUNT)).map(p => <PostCardDesktop key={p.id} post={p} />)}
                      {bookmarks.length > INITIAL_POST_COUNT && (
                        <button
                          onClick={() => setShowAllBookmarks(v => !v)}
                          className="w-full py-4 text-sm font-bold text-blue-600 hover:bg-blue-50/60 transition-colors flex items-center justify-center gap-1.5"
                        >
                          {showAllBookmarks ? '收起' : `显示更多（${bookmarks.length - INITIAL_POST_COUNT} 篇）`}
                          <ChevronDown className={`w-4 h-4 transition-transform ${showAllBookmarks ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </>
              )}
              {activeTab === 'history' && isMe && (
                historyItems.length === 0
                  ? <EmptyState icon={History} text="还没有浏览记录" />
                  : historyItems.map(item => (
                    <Link
                      key={item.slug}
                      href={`/blog/${item.slug}`}
                      className="block px-6 py-5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60 transition-colors group"
                    >
                      <h3 className="text-[15px] font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(item.readAt).toLocaleString('zh-CN')}</span>
                      </div>
                    </Link>
                  ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
