'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface KeyboardShortcutsProps {
  prevSlug?: string | null
  nextSlug?: string | null
}

export default function KeyboardShortcuts({ prevSlug, nextSlug }: KeyboardShortcutsProps) {
  const router = useRouter()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // 不在输入框中触发
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      // 不在 contenteditable 中触发
      if ((e.target as HTMLElement).isContentEditable) return

      if (e.key === 't' || e.key === 'T' || e.key === 'Home') {
        e.preventDefault()
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      if (e.key === 'ArrowLeft' && prevSlug) {
        e.preventDefault()
        router.push(`/blog/${prevSlug}`)
      }
      if (e.key === 'ArrowRight' && nextSlug) {
        e.preventDefault()
        router.push(`/blog/${nextSlug}`)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prevSlug, nextSlug, router])

  return null
}
