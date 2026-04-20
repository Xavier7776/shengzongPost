// app/admin/login/page.tsx
'use client'

import { signIn } from 'next-auth/react'
import { Github } from 'lucide-react'

export default function LoginPage() {
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
      </div>
    </div>
  )
}
