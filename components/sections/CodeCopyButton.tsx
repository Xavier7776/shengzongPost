'use client'

import { useEffect } from 'react'

export default function CodeCopyButton() {
  useEffect(() => {
    const pres = document.querySelectorAll('.post-content pre')
    if (pres.length === 0) return

    pres.forEach(pre => {
      const el = pre as HTMLElement
      // Avoid duplicate injection
      if (el.dataset.copyBtn) return
      el.dataset.copyBtn = '1'
      el.style.position = 'relative'

      const btn = document.createElement('button')
      btn.textContent = '复制'
      btn.style.cssText = `
        position: absolute; top: 8px; right: 8px; z-index: 10;
        padding: 4px 10px; border-radius: 6px;
        background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1);
        color: #8b949e; font-size: 12px; font-family: 'DM Sans', sans-serif;
        cursor: pointer; transition: all 0.2s ease;
        backdrop-filter: blur(4px);
      `
      btn.onmouseenter = () => {
        btn.style.background = 'rgba(255,255,255,0.15)'
        btn.style.color = '#e6edf3'
      }
      btn.onmouseleave = () => {
        btn.style.background = 'rgba(255,255,255,0.08)'
        btn.style.color = '#8b949e'
      }

      btn.onclick = async () => {
        const code = el.querySelector('code')?.textContent || ''
        try {
          await navigator.clipboard.writeText(code)
          btn.textContent = '已复制'
          btn.style.color = '#3fb950'
          btn.style.borderColor = 'rgba(63,185,80,0.3)'
          setTimeout(() => {
            btn.textContent = '复制'
            btn.style.color = '#8b949e'
            btn.style.borderColor = 'rgba(255,255,255,0.1)'
          }, 2000)
        } catch {
          btn.textContent = '失败'
          setTimeout(() => { btn.textContent = '复制' }, 2000)
        }
      }

      el.appendChild(btn)
    })
  }, [])

  return null
}
