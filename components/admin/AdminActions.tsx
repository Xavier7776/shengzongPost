// components/admin/AdminActions.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react'

interface Props {
  slug: string
  published: boolean
}

export default function AdminActions({ slug, published }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'delete' | 'toggle' | null>(null)

  async function handleTogglePublish() {
    setLoading('toggle')
    await fetch(`/api/posts/${slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !published }),
    })
    setLoading(null)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm(`确定删除「${slug}」？此操作不可撤销。`)) return
    setLoading('delete')
    await fetch(`/api/posts/${slug}`, { method: 'DELETE' })
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {/* 编辑 */}
      <Link
        href={`/admin/edit/${slug}`}
        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="编辑"
      >
        <Pencil className="w-4 h-4" />
      </Link>

      {/* 发布/取消发布 */}
      <button
        onClick={handleTogglePublish}
        disabled={loading !== null}
        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-40"
        title={published ? '取消发布' : '发布'}
      >
        {loading === 'toggle'
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />
        }
      </button>

      {/* 删除 */}
      <button
        onClick={handleDelete}
        disabled={loading !== null}
        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
        title="删除"
      >
        {loading === 'delete'
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Trash2 className="w-4 h-4" />
        }
      </button>
    </div>
  )
}
