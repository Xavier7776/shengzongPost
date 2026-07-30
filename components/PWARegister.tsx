'use client'

import { useEffect } from 'react'

/**
 * PWA Service Worker 注册组件
 * 仅在生产环境注册,避免开发环境缓存干扰热更新
 */
export default function PWARegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.warn('[PWA] SW registration failed:', err))
    }

    // 页面加载完成后注册,避免抢占首屏资源
    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register, { once: true })
      return () => window.removeEventListener('load', register)
    }
  }, [])

  return null
}
