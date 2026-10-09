'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { ProfileData, FollowCounts, FollowUser } from './settings-types'

export function useProfileSettings() {
  const { data: session, status, update } = useSession()
  const router   = useRouter()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState('profile')

  const [form, setForm]                   = useState<ProfileData>({ id: 0, name: '', email: '', phone: '', bio: '', avatar: '', title: '', motto: '', location: '', website: '', github_url: '', twitter_url: '', tech_stack: [] })
  const [techInput, setTechInput]         = useState('')
  const [loading, setLoading]             = useState(true)
  const [saving, setSaving]               = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saved, setSaved]                 = useState(false)
  const [error, setError]                 = useState('')
  const [avatarError, setAvatarError]     = useState(false)
  const [followCounts, setFollowCounts]   = useState<FollowCounts>({ following: 0, followers: 0 })
  const [points, setPoints]               = useState(0)
  const [frameCssKey, setFrameCssKey]     = useState<string | null>(null)
  const [followModal, setFollowModal]     = useState<'followers'|'following'|null>(null)
  const [followList, setFollowList]       = useState<FollowUser[]>([])
  const [followListLoading, setFollowListLoading] = useState(false)

  // 密码
  const [pwStep, setPwStep]       = useState<'idle'|'sending'|'code'|'changing'|'done'>('idle')
  const [pwCode, setPwCode]       = useState('')
  const [pwNew, setPwNew]         = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwError, setPwError]     = useState('')
  const [pwMasked, setPwMasked]   = useState('')
  const [showPw, setShowPw]       = useState(false)

  // 偏好
  const [showBookmarks, setShowBookmarks] = useState(true)
  const [showLikes,     setShowLikes]     = useState(true)

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem('arc_prefs') ?? '{}')
      if (typeof p.showBookmarks === 'boolean') setShowBookmarks(p.showBookmarks)
      if (typeof p.showLikes     === 'boolean') setShowLikes(p.showLikes)
    } catch {}
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login?callbackUrl=/profile')
  }, [status, router])

  const fetchProfile = () => {
    if (status !== 'authenticated') return
    fetch('/api/user/profile', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        setForm({
          id: data.id ?? 0,
          name: data.name ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          bio: data.bio ?? '',
          avatar: data.avatar ?? session?.user?.image ?? '',
          title: data.title ?? '',
          motto: data.motto ?? '',
          location: data.location ?? '',
          website: data.website ?? '',
          github_url: data.github_url ?? '',
          twitter_url: data.twitter_url ?? '',
          tech_stack: Array.isArray(data.tech_stack) ? data.tech_stack : [],
        })
        setAvatarError(false)
        setFrameCssKey(data.equipped_frame_css_key ?? null)
        if (typeof data.points === 'number') setPoints(data.points)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  // 仅在登录状态变化时拉取 profile，避免 session 更新（如头像上传）触发不必要的重拉
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchProfile() }, [status])

  // 页面重新可见时刷新积分等数据
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchProfile()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  useEffect(() => {
    if (form.id > 0) {
      fetch(`/api/follows?targetId=${form.id}`)
        .then(r => r.json())
        .then(d => {
          if (d.following !== undefined)
            setFollowCounts({ following: d.following, followers: d.followers })
        })
        .catch(() => {})
    }
  }, [form.id])

  function setField(field: keyof ProfileData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
    setSaved(false)
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('图片不能超过 5MB'); return }
    setUploadingAvatar(true); setError(''); setAvatarError(false)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res  = await fetch('/api/user/avatar', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '上传失败'); return }
      setField('avatar', data.url)
      // 立即更新 session，让导航栏头像同步刷新
      await update({ image: data.url })
    } catch { setError('网络错误，请重试') }
    finally  { setUploadingAvatar(false) }
  }

  async function handleSendCode() {
    setPwError(''); setPwStep('sending')
    try {
      const res = await fetch('/api/user/password', { method: 'POST' })
      const d   = await res.json()
      if (!res.ok) { setPwError(d.error ?? '发送失败'); setPwStep('idle'); return }
      setPwMasked(d.email); setPwStep('code')
    } catch { setPwError('网络错误，请重试'); setPwStep('idle') }
  }

  async function handleChangePassword() {
    setPwError('')
    if (!pwCode.trim())      { setPwError('请输入验证码'); return }
    if (pwNew.length < 12)    { setPwError('新密码至少 12 位'); return }
    if (pwNew !== pwConfirm) { setPwError('两次密码不一致'); return }
    setPwStep('changing')
    try {
      const res = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: pwCode, newPassword: pwNew }),
      })
      const d = await res.json()
      if (!res.ok) { setPwError(d.error ?? '修改失败'); setPwStep('code'); return }
      setPwStep('done')
      setTimeout(() => { setPwStep('idle'); setPwCode(''); setPwNew(''); setPwConfirm('') }, 3000)
    } catch { setPwError('网络错误，请重试'); setPwStep('code') }
  }

  async function openFollowModal(type: 'followers' | 'following') {
    setFollowModal(type)
    setFollowList([])
    setFollowListLoading(true)
    try {
      const res = await fetch(`/api/follows?userId=${userId}&list=${type}`)
      const data = await res.json()
      setFollowList(Array.isArray(data) ? data : [])
    } catch {}
    setFollowListLoading(false)
  }

  function savePrefs(next: { showBookmarks: boolean; showLikes: boolean }) {
    localStorage.setItem('arc_prefs', JSON.stringify(next))
  }
  function toggleBookmarks() {
    const next = { showBookmarks: !showBookmarks, showLikes }
    setShowBookmarks(!showBookmarks); savePrefs(next)
  }
  function toggleLikes() {
    const next = { showBookmarks, showLikes: !showLikes }
    setShowLikes(!showLikes); savePrefs(next)
  }

  function addTechSkill() {
    const skill = techInput.trim()
    if (!skill) return
    if (skill.length > 30) { setError('技术标签不能超过 30 字'); return }
    if (form.tech_stack.length >= 30) { setError('技术栈最多 30 项'); return }
    if (form.tech_stack.includes(skill)) { setError('已存在该技术标签'); return }
    setForm(prev => ({ ...prev, tech_stack: [...prev.tech_stack, skill] }))
    setTechInput('')
    setError('')
  }

  function removeTechSkill(skill: string) {
    setForm(prev => ({ ...prev, tech_stack: prev.tech_stack.filter(s => s !== skill) }))
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('昵称不能为空'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, phone: form.phone, bio: form.bio, avatar: form.avatar,
          title: form.title, motto: form.motto, location: form.location,
          website: form.website, github_url: form.github_url, twitter_url: form.twitter_url,
          tech_stack: form.tech_stack,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '保存失败'); return }
      await update({ name: form.name, image: form.avatar })
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch { setError('网络错误，请重试') }
    finally  { setSaving(false) }
  }
  const initial    = form.name.charAt(0).toUpperCase() || '?'
  const userId     = form.id
  const showAvatar = form.avatar && !avatarError
  return {
    status, loading, initial, form, userId, showAvatar, avatarError, activeTab, frameCssKey, fileRef,
    uploadingAvatar, handleAvatarChange, openFollowModal, followCounts, points, setField, techInput,
    setTechInput, setError, addTechSkill, removeTechSkill, error, pwStep, handleSendCode, pwMasked,
    pwCode, setPwCode, setPwError, pwNew, setPwNew, showPw, setShowPw, pwConfirm, setPwConfirm,
    pwError, setPwStep, handleChangePassword, showBookmarks, toggleBookmarks, showLikes, toggleLikes,
    setActiveTab, handleSave, saving, saved, followModal, setFollowModal, followListLoading,
    followList,
  }
}

export type ProfileSettingsState = ReturnType<typeof useProfileSettings>
