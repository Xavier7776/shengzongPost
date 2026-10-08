'use client'

import React from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Users, Loader2, MapPin, LinkIcon, FileText, Heart, Bookmark, ChevronDown, ChevronUp,
  Clock, History, Github, Twitter, Quote, Star,
} from 'lucide-react'
import AvatarFrame from '@/components/ui/AvatarFrame'
import type { UserProfileState } from '../useUserProfile'
import type { ProfileTab } from '../types'
import { AvatarWithFallback, UserRow, PostCardMobile } from './ProfileCards'

export default function UserProfileMobile({ frameCssKey, user, followBtn, isMe, openFollowTab, follow, points, followTab, showList, setShowList, loadingList, list, setActiveTab, activeTab, loadingPosts, posts, showAllPosts, INITIAL_POST_COUNT, setShowAllPosts, loadingLikedPosts, likedPosts, showAllLikes, setShowAllLikes, loadingBookmarks, bookmarks, showAllBookmarks, setShowAllBookmarks, historyItems }: Pick<UserProfileState, 'frameCssKey' | 'isMe' | 'openFollowTab' | 'follow' | 'points' | 'followTab' | 'showList' | 'setShowList' | 'loadingList' | 'list' | 'setActiveTab' | 'activeTab' | 'loadingPosts' | 'posts' | 'showAllPosts' | 'INITIAL_POST_COUNT' | 'setShowAllPosts' | 'loadingLikedPosts' | 'likedPosts' | 'showAllLikes' | 'setShowAllLikes' | 'loadingBookmarks' | 'bookmarks' | 'showAllBookmarks' | 'setShowAllBookmarks' | 'historyItems'> & { user: NonNullable<UserProfileState['user']>; followBtn: React.ReactNode }) {
  return (
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
              <AvatarFrame frameCssKey={frameCssKey} shape="circle" size={80}>
                <div className="ring-4 ring-white rounded-full">
                  <AvatarWithFallback
                    src={user.avatar} name={user.name} size={80} userId={user.id}
                    className="w-20 h-20"
                    bgClass="bg-blue-600"
                    textClass="text-white text-2xl"
                  />
                </div>
              </AvatarFrame>
              {followBtn}
            </div>

            <h1 className="text-xl font-black text-gray-900">{user.name}</h1>

            {user.title && (
              <p className="text-sm font-semibold text-blue-600 mt-1">{user.title}</p>
            )}
            {user.motto && (
              <p className="text-xs text-gray-500 mt-1 italic flex items-center gap-1">
                <Quote className="w-3 h-3 text-gray-300 flex-shrink-0" />
                {user.motto}
              </p>
            )}

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
              {user.github_url && (
                <a
                  href={user.github_url}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span className="truncate">{user.github_url.replace(/^https?:\/\/(www\.)?github\.com\//, '')}</span>
                </a>
              )}
              {user.twitter_url && (
                <a
                  href={user.twitter_url}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <Twitter className="w-3.5 h-3.5" />
                  <span className="truncate">{user.twitter_url.replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//, '@')}</span>
                </a>
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
              <span className="w-px h-4 bg-gray-100" />
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
                <span className="text-sm font-black text-amber-500 whitespace-nowrap tabular-nums">{points.toLocaleString()}</span>
                <span className="text-xs text-gray-400">积分</span>
              </div>
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
              ...(isMe ? [{ key: 'history', label: '浏览记录' }] : []),
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
              : <>
                  {(showAllPosts ? posts : posts.slice(0, INITIAL_POST_COUNT)).map(p => <PostCardMobile key={p.id} post={p} />)}
                  {posts.length > INITIAL_POST_COUNT && (
                    <button
                      onClick={() => setShowAllPosts(v => !v)}
                      className="w-full py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-blue-600 hover:bg-blue-50/60 transition-colors flex items-center justify-center gap-1.5"
                    >
                      {showAllPosts ? '收起' : `显示更多（${posts.length - INITIAL_POST_COUNT} 篇）`}
                      <ChevronDown className={`w-4 h-4 transition-transform ${showAllPosts ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </>
          )}

          {activeTab === 'likes' && (
            loadingLikedPosts
              ? <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
              : likedPosts.length === 0
              ? <div className="flex flex-col items-center gap-2 py-10 text-gray-300">
                  <Heart className="w-6 h-6" /><p className="text-sm">还没有点赞任何文章</p>
                </div>
              : <>
                  {(showAllLikes ? likedPosts : likedPosts.slice(0, INITIAL_POST_COUNT)).map(p => <PostCardMobile key={p.id} post={p} />)}
                  {likedPosts.length > INITIAL_POST_COUNT && (
                    <button
                      onClick={() => setShowAllLikes(v => !v)}
                      className="w-full py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-blue-600 hover:bg-blue-50/60 transition-colors flex items-center justify-center gap-1.5"
                    >
                      {showAllLikes ? '收起' : `显示更多（${likedPosts.length - INITIAL_POST_COUNT} 篇）`}
                      <ChevronDown className={`w-4 h-4 transition-transform ${showAllLikes ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </>
          )}

          {activeTab === 'bookmarks' && isMe && (
            loadingBookmarks
              ? <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-gray-300 animate-spin" /></div>
              : bookmarks.length === 0
              ? <div className="flex flex-col items-center gap-2 py-10 text-gray-300">
                  <Bookmark className="w-6 h-6" /><p className="text-sm">还没有收藏任何文章</p>
                </div>
              : <>
                  {(showAllBookmarks ? bookmarks : bookmarks.slice(0, INITIAL_POST_COUNT)).map(p => <PostCardMobile key={p.id} post={p} />)}
                  {bookmarks.length > INITIAL_POST_COUNT && (
                    <button
                      onClick={() => setShowAllBookmarks(v => !v)}
                      className="w-full py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-blue-600 hover:bg-blue-50/60 transition-colors flex items-center justify-center gap-1.5"
                    >
                      {showAllBookmarks ? '收起' : `显示更多（${bookmarks.length - INITIAL_POST_COUNT} 篇）`}
                      <ChevronDown className={`w-4 h-4 transition-transform ${showAllBookmarks ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </>
          )}

          {activeTab === 'history' && isMe && (
            historyItems.length === 0
              ? <div className="flex flex-col items-center gap-2 py-10 text-gray-300">
                  <History className="w-6 h-6" /><p className="text-sm">还没有浏览记录</p>
                </div>
              : <div className="space-y-3">
                  {historyItems.map(item => (
                    <Link
                      key={item.slug}
                      href={`/blog/${item.slug}`}
                      className="block bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow group"
                    >
                      <h3 className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(item.readAt).toLocaleString('zh-CN')}</span>
                      </div>
                    </Link>
                  ))}
                </div>
          )}
        </div>

      </div>
    </div>
  )
}
