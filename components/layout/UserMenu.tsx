'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { LogOut, Settings, ChevronDown, PenLine } from 'lucide-react'
import RoleBadge from '@/components/ui/RoleBadge'

interface UserMenuProps {
  dark?: boolean
}

export default function UserMenu({ dark = false }: UserMenuProps) {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (status === 'loading') {
    return <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className={`text-xs font-black tracking-widest transition-colors duration-300 px-4 py-2 rounded-xl border ${
          dark
            ? 'border-white/20 text-white/60 hover:text-white hover:border-white/40'
            : 'border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-400'
        }`}
      >
        登录
      </Link>
    )
  }

  const name   = session.user?.name ?? '用户'
  const avatar = session.user?.image
  const role   = (session.user as { role?: string })?.role ?? 'user'
  const initial = name.charAt(0).toUpperCase()

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 group"
      >
        {/* 头像 */}
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-transparent group-hover:ring-blue-500 transition-all duration-200">
          {avatar ? (
            <Image src={avatar} alt={name} width={32} height={32} unoptimized className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-black">{initial}</span>
            </div>
          )}
        </div>

        {/* 名字 + 角色徽章 + 箭头 */}
        <span className={`hidden md:flex items-center gap-1.5 transition-colors duration-200 ${
          dark ? 'text-white/70 group-hover:text-white' : 'text-gray-500 group-hover:text-gray-900'
        }`}>
          <span className="text-xs font-bold">{name}</span>
          {/* ✅ 角色徽章：只有特殊 role 才显示，普通 user 不显示 */}
          <RoleBadge role={role} size="md" />
        </span>

        <ChevronDown className={`w-3 h-3 transition-all duration-200 ${open ? 'rotate-180' : ''} ${
          dark ? 'text-white/40' : 'text-gray-300'
        }`} />
      </button>

      {/* 下拉菜单 */}
      {open && (
        <div className="absolute right-0 top-full mt-3 w-52 bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/60 overflow-hidden z-50">
          {/* 用户信息头 */}
          <div className="px-4 py-3 border-b border-gray-50">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-black text-gray-900 truncate">{name}</p>
              <RoleBadge role={role} size="sm" />
            </div>
            <p className="text-xs text-gray-400 truncate mt-0.5">{session.user?.email}</p>
          </div>

          {/* 菜单项 */}
          <div className="py-1.5">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <Settings className="w-4 h-4 text-gray-400" />
              个人资料
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <PenLine className="w-4 h-4 text-gray-400" />
              编辑中心
            </Link>
            <button
              onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }) }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              退出登录
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
