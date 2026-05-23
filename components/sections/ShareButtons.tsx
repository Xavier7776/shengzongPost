'use client'

import { useState, useCallback } from 'react'
import { Link2, Check } from 'lucide-react'

interface ShareButtonsProps {
  title: string
  slug: string
}

export default function ShareButtons({ title, slug }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/blog/${slug}`
    : `https://arc-portfolio.com/blog/${slug}`

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }, [url])

  const shareToWeibo = () => {
    const u = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`
    window.open(u, '_blank', 'width=600,height=500')
  }

  const shareToTwitter = () => {
    const u = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
    window.open(u, '_blank', 'width=600,height=500')
  }

  const btnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }

  return (
    <div className="flex items-center gap-3 my-6 flex-wrap">
      {/* 复制链接 */}
      <button
        onClick={copyLink}
        style={{
          ...btnStyle,
          background: copied ? '#ecfdf5' : '#f3f4f6',
          color: copied ? '#059669' : '#6b7280',
        }}
        onMouseEnter={e => {
          if (!copied) { e.currentTarget.style.background = '#e5e7eb' }
        }}
        onMouseLeave={e => {
          if (!copied) { e.currentTarget.style.background = '#f3f4f6' }
        }}
      >
        {copied ? <Check size={14} /> : <Link2 size={14} />}
        {copied ? '已复制' : '复制链接'}
      </button>

      {/* 微博 */}
      <button
        onClick={shareToWeibo}
        style={{ ...btnStyle, background: '#fef2f2', color: '#dc2626' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10.098 20c-4.915 0-8.91-2.306-8.91-5.153 0-1.49 1.028-3.215 2.783-4.88 2.34-2.23 5.062-3.19 6.097-2.14.45.454.503 1.22.178 2.14-.2.578.47.27.47.27 1.965-.87 3.728-.96 4.377-.03.34.485.31 1.15-.04 1.96-.16.37.05.42.34.14.65-.63 1.51-.21 1.51.69 0 .51-.38 1.15-.94 1.74-.27.29-.1.4.34.24 1.38-.51 2.53-.06 2.53 1.03 0 1.73-2.56 3.85-6.18 4.73-.76.19-1.61.28-2.5.31-.25.01-.44-.07-.44-.07s-.24.88-1.49 1.53c-.79.41-1.86.6-2.99.63zm-1.23-6.58c-2.88.53-5.01 2.5-4.76 4.39.25 1.89 2.81 3.08 5.69 2.65 2.88-.48 5.01-2.45 4.76-4.34-.25-1.89-2.81-3.18-5.69-2.7zm.63 3.73c-.68.3-1.41.08-1.64-.49-.23-.57.17-1.19.85-1.39.71-.2 1.51.12 1.74.71.23.59-.23 1.21-.95 1.17zm1.53-.83c-.18.08-.38-.02-.44-.22-.06-.2.07-.42.25-.5.19-.07.4.04.46.24.05.2-.09.4-.27.48zM17.5 4.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5S16 6.83 16 6.5s.67-1.5 1.5-1.5z"/>
        </svg>
        微博
      </button>

      {/* Twitter/X */}
      <button
        onClick={shareToTwitter}
        style={{ ...btnStyle, background: '#f3f4f6', color: '#374151' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#e5e7eb' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#f3f4f6' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        Twitter
      </button>
    </div>
  )
}
