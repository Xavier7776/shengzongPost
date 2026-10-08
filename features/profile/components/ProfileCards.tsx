'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, MessageCircle, Clock } from 'lucide-react'
import type { FollowUser, Post } from '../types'

export function AvatarWithFallback({
  src, name, size, userId, className,
  bgClass = 'bg-blue-100', textClass = 'text-blue-600 text-sm',
}: {
  src: string | null; name: string; size: number; userId?: number
  className?: string; bgClass?: string; textClass?: string
}) {
  const [imgSrc, setImgSrc] = useState(src)
  const [failed, setFailed] = useState(false)
  const localFallback = userId ? `/avatars/user_${userId}.jpg` : null

  return (
    <div className={`rounded-full overflow-hidden flex-shrink-0 ${className ?? ''}`}>
      {imgSrc && !failed
        ? <Image src={imgSrc} alt={name} width={size} height={size}
            className="w-full h-full object-cover" unoptimized
            onError={() => {
              if (localFallback && imgSrc !== localFallback) setImgSrc(localFallback)
              else setFailed(true)
            }} />
        : <div className={`w-full h-full flex items-center justify-center ${bgClass}`}>
            <span className={`font-black ${textClass}`}>{name.charAt(0).toUpperCase()}</span>
          </div>
      }
    </div>
  )
}

export function UserRow({ user }: { user: FollowUser }) {
  return (
    <Link
      href={`/profile/${user.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors rounded-xl"
    >
      <AvatarWithFallback src={user.avatar} name={user.name} size={36} userId={user.id} className="w-9 h-9" />
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

export function PostCardDesktop({ post }: { post: Post }) {
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

export function PostCardMobile({ post }: { post: Post }) {
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

export function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-gray-300">
      <Icon className="w-8 h-8" />
      <p className="text-sm">{text}</p>
    </div>
  )
}
