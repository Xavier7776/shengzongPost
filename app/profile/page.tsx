'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Camera, Loader2, Check, User, Mail, Phone, FileText,
  Lock, Eye, EyeOff, ShieldCheck, Bookmark, Heart,
  Settings, Save, Send, LogOut, Palette, Bell, Globe, Menu
} from 'lucide-react'

interface ProfileData {
  id: number
  name: string
  email: string
  phone: string
  bio: string
  avatar: string
}

interface FollowCounts {
  following: number
  followers: number
}

const MENU_ITEMS = [
  { id: 'profile',     label: '个人资料', icon: User },
  { id: 'security',    label: '账户安全', icon: ShieldCheck },
  { id: 'preferences', label: '功能偏好', icon: Settings },
  { id: 'display',     label: '外观显示', icon: Palette },
]

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router   = useRouter()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState('profile')

  const [form, setForm]                   = useState<ProfileData>({ id: 0, name: '', email: '', phone: '', bio: '', avatar: '' })
  const [loading, setLoading]             = useState(true)
  const [saving, setSaving]               = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saved, setSaved]                 = useState(false)
  const [error, setError]                 = useState('')
  const [avatarError, setAvatarError]     = useState(false)
  const [followCounts, setFollowCounts]   = useState<FollowCounts>({ following: 0, followers: 0 })

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

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/user/profile')
      .then(r => r.json())
      .then(data => {
        setForm({
          id: data.id ?? 0,
          name: data.name ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          bio: data.bio ?? '',
          avatar: data.avatar ?? session?.user?.image ?? '',
        })
        setAvatarError(false)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [status, session])

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
    if (pwNew.length < 8)    { setPwError('新密码至少 8 位'); return }
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

  async function handleSave() {
    if (!form.name.trim()) { setError('昵称不能为空'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, phone: form.phone, bio: form.bio, avatar: form.avatar }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '保存失败'); return }
      await update({ name: form.name, image: form.avatar })
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch { setError('网络错误，请重试') }
    finally  { setSaving(false) }
  }

  // ── Loading ──
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    )
  }

  const initial    = form.name.charAt(0).toUpperCase() || '?'
  const userId     = form.id
  const showAvatar = form.avatar && !avatarError

  // ── 各 Tab 内容 ──
  const renderContent = () => {
    switch (activeTab) {

      // ── 个人资料 ──
      case 'profile': return (
        <div className="space-y-10">

          {/* 头像区 */}
          <section className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-8 border-b border-slate-100">
            <div className="relative group flex-shrink-0">
              <div className="w-24 h-24 rounded-[28px] overflow-hidden bg-gradient-to-tr from-indigo-100 to-slate-100 border-4 border-white shadow-xl flex items-center justify-center">
                {showAvatar ? (
                  <Image
                    src={form.avatar} alt={form.name}
                    width={96} height={96}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <span className="text-indigo-400 text-3xl font-black">{initial}</span>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-slate-100 text-slate-500 hover:text-indigo-600 transition-colors disabled:opacity-60"
              >
                {uploadingAvatar
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Camera className="w-4 h-4" />}
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div className="text-center sm:text-left">
              <p className="font-bold text-slate-800">{form.name || '未设置昵称'}</p>
              <p className="text-sm text-slate-400 mt-0.5">{form.email}</p>
              <p className="text-xs text-slate-300 mt-2">支持 JPG / PNG / WebP，最大 5MB</p>
              {userId > 0 && (
                <div className="flex items-center gap-4 mt-3 justify-center sm:justify-start">
                  <Link href={`/profile/${userId}?tab=followers`} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
                    <span className="text-sm font-black text-slate-800">{followCounts.followers}</span>
                    <span className="text-xs text-slate-400">粉丝</span>
                  </Link>
                  <span className="w-px h-4 bg-slate-100" />
                  <Link href={`/profile/${userId}?tab=following`} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
                    <span className="text-sm font-black text-slate-800">{followCounts.following}</span>
                    <span className="text-xs text-slate-400">关注</span>
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* 表单字段 */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">昵称 <span className="text-red-400">*</span></label>
              <input
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                maxLength={30}
                placeholder="你的显示名称"
                className="w-full px-5 py-3 bg-slate-50/60 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all outline-none text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1">邮箱（不可修改）</label>
              <div className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center cursor-not-allowed">
                <span className="text-sm text-slate-400 truncate">{form.email}</span>
                <Globe className="ml-auto flex-shrink-0 w-4 h-4 text-slate-200" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">手机号</label>
              <input
                value={form.phone}
                onChange={e => setField('phone', e.target.value)}
                maxLength={20}
                placeholder="选填"
                type="tel"
                className="w-full px-5 py-3 bg-slate-50/60 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all outline-none text-sm"
              />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">个人简介</label>
              <textarea
                value={form.bio}
                onChange={e => setField('bio', e.target.value)}
                maxLength={200}
                rows={4}
                placeholder="介绍一下自己（选填）"
                className="w-full px-5 py-4 bg-slate-50/60 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all outline-none resize-none text-sm leading-relaxed"
              />
              <p className="text-xs text-slate-300 text-right">{form.bio.length}/200</p>
            </div>
          </section>

          {error && (
            <p className="text-red-500 text-xs font-medium bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>
          )}
        </div>
      )

      // ── 账户安全 ──
      case 'security': return (
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[24px] p-7 text-white flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
            <div>
              <h4 className="text-lg font-bold">需要重置密码？</h4>
              <p className="text-slate-400 text-sm mt-1">验证码将发送至你的注册邮箱，10 分钟内有效。</p>
            </div>
            {pwStep === 'idle' && (
              <button
                onClick={handleSendCode}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg shadow-black/20 flex-shrink-0"
              >
                <Send className="w-4 h-4" />立即发送
              </button>
            )}
            {pwStep === 'sending' && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />正在发送…
              </div>
            )}
            {pwStep === 'done' && (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <Check className="w-5 h-5" />密码已修改
              </div>
            )}
          </div>

          {(pwStep === 'code' || pwStep === 'changing') && (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4">
              <p className="text-sm text-slate-500">
                验证码已发送至 <span className="font-bold text-slate-700">{pwMasked}</span>
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">验证码</label>
                <input
                  value={pwCode}
                  onChange={e => { setPwCode(e.target.value); setPwError('') }}
                  maxLength={6}
                  placeholder="6 位数字"
                  className="w-full px-5 py-3 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none text-sm tracking-[.3em] font-mono transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">新密码</label>
                <div className="relative">
                  <input
                    value={pwNew}
                    onChange={e => { setPwNew(e.target.value); setPwError('') }}
                    type={showPw ? 'text' : 'password'}
                    minLength={8}
                    placeholder="至少 8 位"
                    className="w-full px-5 py-3 pr-11 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none text-sm transition-all"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">确认新密码</label>
                <input
                  value={pwConfirm}
                  onChange={e => { setPwConfirm(e.target.value); setPwError('') }}
                  type={showPw ? 'text' : 'password'}
                  placeholder="再输入一次"
                  className="w-full px-5 py-3 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none text-sm transition-all"
                />
              </div>

              {pwError && <p className="text-red-500 text-xs font-medium bg-red-50 px-4 py-2.5 rounded-xl">{pwError}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setPwStep('idle'); setPwCode(''); setPwNew(''); setPwConfirm(''); setPwError('') }}
                  className="flex-1 border border-slate-200 text-slate-500 font-bold text-sm py-3 rounded-xl hover:border-slate-300 transition-colors"
                >取消</button>
                <button
                  onClick={handleChangePassword}
                  disabled={pwStep === 'changing'}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-3 rounded-xl transition-colors disabled:opacity-60"
                >
                  {pwStep === 'changing' ? <><Loader2 className="w-4 h-4 animate-spin" />修改中…</> : '确认修改'}
                </button>
              </div>
              <button onClick={handleSendCode} disabled={pwStep === 'changing'} className="w-full text-xs text-slate-400 hover:text-indigo-600 transition-colors py-1">
                没收到？重新发送
              </button>
            </div>
          )}
        </div>
      )

      // ── 功能偏好 ──
      case 'preferences': return (
        <div className="space-y-4">
          {[
            { id: 'bookmarks', label: '显示收藏夹', sub: '在文章页面显示收藏按钮', icon: Bookmark, val: showBookmarks, toggle: toggleBookmarks },
            { id: 'likes',     label: '动态点赞',   sub: '在文章页面显示点赞按钮', icon: Heart,    val: showLikes,     toggle: toggleLikes },
          ].map(pref => {
            const Icon = pref.icon
            return (
              <div key={pref.id} className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-700">{pref.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{pref.sub}</p>
                  </div>
                </div>
                <button
                  onClick={pref.toggle}
                  className={`w-11 h-6 rounded-full flex-shrink-0 relative transition-all duration-300 ${pref.val ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${pref.val ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            )
          })}
        </div>
      )

      // ── 外观显示 ──
      case 'display': return (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-300">
          <Palette className="w-10 h-10" />
          <p className="text-sm font-bold">外观设置即将推出</p>
        </div>
      )

      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-0 md:px-8 font-sans antialiased text-slate-900">
      <div className="w-full max-w-5xl mx-auto bg-white md:rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border-0 md:border border-white flex flex-col md:flex-row overflow-hidden md:min-h-[700px]">

        {/* 移动端顶栏 */}
        <div className="md:hidden flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100">
              <Settings className="text-white w-4 h-4" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-800">设置</span>
          </div>
          <button className="p-2 text-slate-400"><Menu className="w-5 h-5" /></button>
        </div>

        {/* 桌面侧边栏 */}
        <aside className="hidden md:flex w-60 bg-slate-50/50 border-r border-slate-100 flex-col p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100">
              <Settings className="text-white w-4 h-4" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-800">控制台</span>
          </div>

          <nav className="flex-1 space-y-1.5">
            {MENU_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                  activeTab === id
                    ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-slate-200'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${activeTab === id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="font-semibold text-sm">{label}</span>
                {activeTab === id && <div className="ml-auto w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
              </button>
            ))}
          </nav>

          <div className="pt-6 mt-6 border-t border-slate-100">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-rose-500 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-semibold text-sm">退出登录</span>
            </button>
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 overflow-y-auto bg-white p-6 md:p-10 pb-28 md:pb-10">

          {/* 页头 */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
                {MENU_ITEMS.find(i => i.id === activeTab)?.label}
              </h2>
              <p className="text-slate-400 mt-1 text-sm">管理你的账户信息与使用偏好</p>
            </div>
            {(activeTab === 'profile') && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-60"
              >
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" />保存中…</>
                  : saved
                  ? <><Check className="w-4 h-4" />已保存</>
                  : <><Save className="w-4 h-4" />保存更改</>
                }
              </button>
            )}
          </header>

          {renderContent()}
        </main>

        {/* 移动端底部导航 */}
        <nav className="md:hidden flex bg-white border-t border-slate-100 px-2 py-3 fixed bottom-0 left-0 right-0 z-30 justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          {MENU_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors ${activeTab === id ? 'text-indigo-600' : 'text-slate-400'}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{label}</span>
            </button>
          ))}
        </nav>

      </div>
    </div>
  )
}