// components/ui/RoleBadge.tsx
// 统一的角色徽章组件，在 UserMenu、CommentSection、AdminCommentsPage 中共用

import { Shield, Heart, Bot } from 'lucide-react'

interface RoleBadgeProps {
  role: string
  size?: 'sm' | 'md'   // sm = 评论区小徽章，md = navbar 旁稍大一点
}

export default function RoleBadge({ role, size = 'sm' }: RoleBadgeProps) {
  const base = size === 'md'
    ? 'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-lg'
    : 'inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md'

  if (role === 'ai') return (
    <span className={`${base} bg-gradient-to-r from-violet-500 to-indigo-500 text-white`}>
      <Bot className={size === 'md' ? 'w-3 h-3' : 'w-2.5 h-2.5'} />
      AI
    </span>
  )

  if (role === 'admin') return (
    <span className={`${base} bg-blue-600 text-white`}>
      <Shield className={size === 'md' ? 'w-3 h-3' : 'w-2.5 h-2.5'} />
      管理员
    </span>
  )

  if (role === 'author') return (
    <span className={`${base} bg-violet-500 text-white`}>
      作者
    </span>
  )

  if (role === 'wife') return (
    <span
      className={`${base} text-white relative overflow-hidden`}
      style={{
        background: 'linear-gradient(135deg, #f9a8d4 0%, #e879a0 40%, #c8a97e 100%)',
        boxShadow: '0 0 10px rgba(232,121,160,0.45)',
      }}
    >
      <Heart className={`${size === 'md' ? 'w-3 h-3' : 'w-2.5 h-2.5'} fill-current`} />
      王盈瑞(wife)
    </span>
  )

  return null
}
