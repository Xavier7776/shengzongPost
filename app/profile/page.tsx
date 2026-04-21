'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Camera, Loader2, Check, ArrowLeft, User, Mail, Phone, FileText } from 'lucide-react'

interface ProfileData {
  name: string
  email: string
  phone: string
  bio: string
  avatar: string
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<ProfileData>({ name: '', email: '', phone: '', bio: '', avatar: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // 未登录跳转
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login?callbackUrl=/profile')
  }, [status, router])

  // 加载用户数据
  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/user/profile')
      .then(r => r.json())
      .then(data => {
        setForm({
          name: data.name ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          bio: data.bio ?? '',
          avatar: data.avatar ?? session?.user?.image ?? '',
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [status, session])

  function set(field: keyof ProfileData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
    setSaved(false)
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('图片不能超过 5MB'); return }

    setUploadingAvatar(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/user/avatar', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '上传失败'); return }
      set('avatar', data.url)
    } catch {
      setError('网络错误，请重试')
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('昵称不能为空'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, phone: form.phone, bio: form.bio, avatar: form.avatar }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '保存失败'); return }
      // 更新 session 里的 name & image
      await update({ name: form.name, image: form.avatar })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('网络错误，请重试')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    )
  }

  const initial = form.name.charAt(0).toUpperCase() || '?'

  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-24 pb-16 px-4">
      <div className="max-w-lg mx-auto">

        {/* 返回 */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-black tracking-widest text-gray-400 hover:text-gray-900 transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          返回首页
        </Link>

        <h1 className="text-2xl font-black tracking-tighter text-gray-900 mb-8">
          个人资料
        </h1>

        {/* 头像区域 */}
        <div className="flex items-center gap-6 mb-8 bg-white border border-gray-100 rounded-2xl p-6">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-gray-100">
              {form.avatar ? (
                <Image
                  src={form.avatar}
                  alt={form.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-2xl font-black">{initial}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors shadow-md disabled:opacity-60"
            >
              {uploadingAvatar
                ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                : <Camera className="w-3.5 h-3.5 text-white" />
              }
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p className="font-black text-gray-900">{form.name || '未设置昵称'}</p>
            <p className="text-sm text-gray-400 mt-0.5">{form.email}</p>
            <p className="text-xs text-gray-300 mt-2">支持 JPG / PNG / WebP，最大 5MB</p>
          </div>
        </div>

        {/* 表单 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">

          {/* 昵称 */}
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
              <User className="w-3 h-3" />
              昵称 <span className="text-red-400">*</span>
            </label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              maxLength={30}
              placeholder="你的显示名称"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          {/* 邮箱（只读） */}
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
              <Mail className="w-3 h-3" />
              邮箱
            </label>
            <input
              value={form.email}
              readOnly
              className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-300 mt-1.5">邮箱不可修改</p>
          </div>

          {/* 手机 */}
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
              <Phone className="w-3 h-3" />
              手机号
            </label>
            <input
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              maxLength={20}
              placeholder="选填"
              type="tel"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          {/* 个人简介 */}
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
              <FileText className="w-3 h-3" />
              个人简介
            </label>
            <textarea
              value={form.bio}
              onChange={e => set('bio', e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="介绍一下自己（选填）"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-blue-400 transition-colors resize-none"
            />
            <p className="text-xs text-gray-300 mt-1 text-right">{form.bio.length}/200</p>
          </div>

          {/* 错误提示 */}
          {error && (
            <p className="text-red-500 text-xs font-medium bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          {/* 保存按钮 */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm py-3.5 rounded-xl transition-colors disabled:opacity-60"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" />保存中…</>
              : saved
              ? <><Check className="w-4 h-4" />已保存</>
              : '保存修改'
            }
          </button>
        </div>

      </div>
    </div>
  )
}
