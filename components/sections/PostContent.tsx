'use client'

// components/sections/PostContent.tsx
// 用于博客文章正文渲染，处理 Tiptap 输出的 HTML 并将视频嵌入替换为真正的 iframe

import { useEffect, useRef } from 'react'

interface Props {
  html: string
}

function buildIframeSrc(src: string, provider: string): string {
  const raw = src ?? ''
  if (provider === 'bilibili') {
    const bvMatch = raw.match(/BV[\w]+/)
    return bvMatch
      ? `https://player.bilibili.com/player.html?bvid=${bvMatch[0]}&autoplay=0&high_quality=1`
      : raw
  } else {
    const ytMatch = raw.match(/(?:v=|youtu\.be\/)([\w-]{11})/)
    return ytMatch
      ? `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`
      : raw
  }
}

export default function PostContent({ html }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    // ── 第一步：解除 <a> 对视频容器的包裹 ────────────────────────────
    // Tiptap Link extension 会把 URL 字符串自动识别成 <a>，
    // 导致数据库里存了 <a href="..."><div data-video-embed ...></div></a>
    // 把 div 从 <a> 里提取到原位，删除 <a>
    const anchors = Array.from(ref.current.querySelectorAll<HTMLAnchorElement>('a'))
    anchors.forEach((anchor) => {
      const embed = anchor.querySelector<HTMLElement>('[data-video-embed], .video-embed-wrapper')
      if (embed) {
        anchor.parentNode?.insertBefore(embed, anchor)
        anchor.remove()
      }
    })

    // ── 第二步：为没有 iframe 的视频容器注入 iframe ──────────────────
    const wrappers = ref.current.querySelectorAll<HTMLElement>('[data-video-embed]')
    wrappers.forEach((wrapper) => {
      if (wrapper.querySelector('iframe')) return  // 已有 iframe，跳过

      const src = wrapper.getAttribute('data-src') ?? ''
      const provider = wrapper.getAttribute('data-provider') ?? 'youtube'
      const iframeSrc = buildIframeSrc(src, provider)
      if (!iframeSrc) return

      wrapper.innerHTML = ''
      wrapper.className = 'video-embed-wrapper'

      const iframe = document.createElement('iframe')
      iframe.src = iframeSrc
      iframe.allowFullscreen = true
      iframe.setAttribute('frameborder', '0')
      iframe.setAttribute(
        'allow',
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
      )
      if (provider === 'bilibili') {
        iframe.setAttribute(
          'sandbox',
          'allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups'
        )
      }
      wrapper.appendChild(iframe)
    })
  }, [html])

  return (
    <div
      ref={ref}
      className="post-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}