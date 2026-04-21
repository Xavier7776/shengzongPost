'use client'

// app/verify/page.tsx
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { Suspense } from 'react'

const STATUS_CONFIG = {
  success: {
    icon: <CheckCircle className="w-12 h-12 text-green-500" />,
    title: '邮箱验证成功',
    desc: '你的账号已激活，现在可以登录了。',
    action: { href: '/login', label: '去登录' },
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  already: {
    icon: <CheckCircle className="w-12 h-12 text-blue-500" />,
    title: '已经验证过了',
    desc: '该邮箱已完成验证，直接登录即可。',
    action: { href: '/login', label: '去登录' },
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  expired: {
    icon: <RefreshCw className="w-12 h-12 text-yellow-500" />,
    title: '链接已过期',
    desc: '验证链接 24 小时内有效，此链接已失效。请重新注册或联系管理员。',
    action: { href: '/register', label: '重新注册' },
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
  },
  invalid: {
    icon: <XCircle className="w-12 h-12 text-red-500" />,
    title: '链接无效',
    desc: '验证链接格式有误，请检查邮件中的链接是否完整。',
    action: { href: '/register', label: '重新注册' },
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  error: {
    icon: <AlertCircle className="w-12 h-12 text-red-500" />,
    title: '验证出错',
    desc: '服务器出现错误，请稍后重试或联系管理员。',
    action: { href: '/', label: '返回首页' },
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
}

function VerifyContent() {
  const searchParams = useSearchParams()
  const status = (searchParams.get('status') ?? 'invalid') as keyof typeof STATUS_CONFIG
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.invalid

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tighter text-gray-900">
            ARC<span className="text-blue-600">.</span>
          </h1>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-10 shadow-sm">
          <div className="flex justify-center mb-6">
            {config.icon}
          </div>

          <h2 className="text-xl font-black text-gray-900 mb-3">{config.title}</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-8">{config.desc}</p>

          <Link
            href={config.action.href}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-black text-sm px-8 py-3 rounded-xl transition-colors"
          >
            {config.action.label}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  )
}
