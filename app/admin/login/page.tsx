// app/admin/login/page.tsx
'use client'

import { signIn } from 'next-auth/react'
import { Github, Zap } from 'lucide-react'

const isDev = process.env.NODE_ENV === 'development'

export default function LoginPage() {
  async function handleDevBypass() {
    await fetch('/api/auth/dev-bypass', { method: 'POST' })
    window.location.href = '/admin'
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
      <div className="w-full max-w-sm px-8 py-12 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/80">
        <h1 className="text-2xl font-black tracking-tighter text-gray-900 mb-2">
          ARC<span className="text-blue-600">.</span> 管理后台
        </h1>
        <p className="text-gray-400 text-sm mb-10">使用 GitHub 账号登录</p>
        <button
          onClick={() => signIn('github', { callbackUrl: '/admin' })}
          className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-blue-600 text-white font-bold py-3.5 rounded-2xl transition-all duration-300 active:scale-95"
        >
          <Github className="w-5 h-5" />
          GitHub 登录
        </button>

        {isDev && (
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">本地开发</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <button
              onClick={handleDevBypass}
              className="w-full flex items-center justify-center gap-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-bold py-3.5 rounded-2xl transition-all duration-300 active:scale-95 text-sm"
            >
              <Zap className="w-4 h-4" />
              跳过登录（仅开发环境）
            </button>
            <p className="text-[10px] text-gray-300 text-center mt-3">
              上线后此按钮自动消失
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
