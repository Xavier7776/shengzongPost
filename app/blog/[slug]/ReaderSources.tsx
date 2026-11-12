'use client'

import { useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'

type Source = { url: string; title: string; label: string }

export default function ReaderSources() {
  const [sources, setSources] = useState<Source[]>([])
  useEffect(() => {
    const root = document.getElementById('blog-reader-root')
    if (!root) return
    const scan = () => {
      const found = new Map<string, Source>()
      root.querySelectorAll<HTMLAnchorElement>('.reader-content a[href]').forEach(link => {
        const text = link.textContent?.trim() || ''
        if (!/^\[s?\d+\]\s+\S/i.test(text) || !link.href.startsWith('https://')) return
        const title = text.replace(/^\[s?\d+\]\s*/i, '')
        found.set(link.href, { url: link.href, title, label: title.split(/[:：]/)[0] })
      })
      const next = [...found.values()].slice(0, 5)
      setSources(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next)
    }
    scan()
    const observer = new MutationObserver(scan)
    observer.observe(root, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])
  if (!sources.length) return null
  return <aside className="reader-sources" aria-label="阅读参考">
    <div className="reader-sources-inner">
      <p className="reader-sources-caption">原始资料</p>
      {sources.map((source, index) => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" title={source.title}>
        <span className="reader-source-number">[{index + 1}]</span>
        <span>{source.label}<small>查看原文 <ArrowUpRight size={11} aria-hidden="true" /></small></span>
      </a>)}
    </div>
  </aside>
}
