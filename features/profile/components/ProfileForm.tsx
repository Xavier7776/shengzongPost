'use client'

import AvatarImage from '@/components/ui/AvatarImage'
import Link from 'next/link'
import { Camera, Loader2, Globe, X, MapPin, Link2, Github, Twitter, Quote, Plus, Star } from 'lucide-react'
import AvatarFrame from '@/components/ui/AvatarFrame'
import type { ProfileSettingsState } from '../useProfileSettings'

type Props = Pick<ProfileSettingsState,
  | 'frameCssKey'
  | 'showAvatar'
  | 'form'
  | 'userId'
  | 'initial'
  | 'fileRef'
  | 'uploadingAvatar'
  | 'handleAvatarChange'
  | 'openFollowModal'
  | 'followCounts'
  | 'points'
  | 'setField'
  | 'techInput'
  | 'setTechInput'
  | 'setError'
  | 'addTechSkill'
  | 'removeTechSkill'
  | 'error'
>

export default function ProfileForm({
  frameCssKey, showAvatar, form, userId, initial, fileRef, uploadingAvatar, handleAvatarChange,
  openFollowModal, followCounts, points, setField, techInput, setTechInput, setError, addTechSkill,
  removeTechSkill, error,
}: Props) {
  return (
    <div className="space-y-10">

      {/* 头像区 */}
      <section className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-8 border-b border-slate-100">
        <div className="relative group flex-shrink-0">
          <AvatarFrame frameCssKey={frameCssKey} shape="rounded" size={96}>
            <div className="w-24 h-24 rounded-[28px] overflow-hidden bg-gradient-to-tr from-indigo-100 to-slate-100 flex items-center justify-center">
              {showAvatar ? (
                <AvatarImage
                  src={form.avatar} alt={form.name}
                  size={96} userId={userId}
                />
              ) : (
                <span className="text-indigo-400 text-3xl font-black">{initial}</span>
              )}
            </div>
          </AvatarFrame>
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
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 justify-center sm:justify-start">
              <button onClick={() => openFollowModal('followers')} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
                <span className="text-sm font-black text-slate-800">{followCounts.followers}</span>
                <span className="text-xs text-slate-400">粉丝</span>
              </button>
              <button onClick={() => openFollowModal('following')} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
                <span className="text-sm font-black text-slate-800">{followCounts.following}</span>
                <span className="text-xs text-slate-400">关注</span>
              </button>
              <Link
                href="/shop"
                className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
              >
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                <span className="text-sm font-black text-amber-700 whitespace-nowrap tabular-nums">{points.toLocaleString()}</span>
                <span className="text-xs text-slate-400">积分</span>
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

      {/* 职业信息 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">职位</label>
          <input
            value={form.title}
            onChange={e => setField('title', e.target.value)}
            maxLength={100}
            placeholder="如：全栈工程师"
            className="w-full px-5 py-3 bg-slate-50/60 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all outline-none text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">个性签名</label>
          <div className="relative">
            <Quote className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              value={form.motto}
              onChange={e => setField('motto', e.target.value)}
              maxLength={100}
              placeholder="写一句话介绍自己"
              className="w-full pl-10 pr-5 py-3 bg-slate-50/60 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all outline-none text-sm"
            />
          </div>
        </div>
      </section>

      {/* 社交信息 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">所在地</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              value={form.location}
              onChange={e => setField('location', e.target.value)}
              maxLength={100}
              placeholder="如：北京"
              className="w-full pl-10 pr-5 py-3 bg-slate-50/60 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all outline-none text-sm"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">个人网站</label>
          <div className="relative">
            <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              value={form.website}
              onChange={e => setField('website', e.target.value)}
              placeholder="https://your-site.com"
              className="w-full pl-10 pr-5 py-3 bg-slate-50/60 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all outline-none text-sm"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">GitHub</label>
          <div className="relative">
            <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              value={form.github_url}
              onChange={e => setField('github_url', e.target.value)}
              placeholder="https://github.com/username"
              className="w-full pl-10 pr-5 py-3 bg-slate-50/60 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all outline-none text-sm"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Twitter / X</label>
          <div className="relative">
            <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              value={form.twitter_url}
              onChange={e => setField('twitter_url', e.target.value)}
              placeholder="https://x.com/username"
              className="w-full pl-10 pr-5 py-3 bg-slate-50/60 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all outline-none text-sm"
            />
          </div>
        </div>
      </section>

      {/* 技术栈 */}
      <section className="space-y-3">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">技术栈</label>
        <div className="flex gap-2">
          <input
            value={techInput}
            onChange={e => { setTechInput(e.target.value); setError('') }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTechSkill() } }}
            maxLength={30}
            placeholder="输入技术标签，按回车添加"
            className="flex-1 px-5 py-3 bg-slate-50/60 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all outline-none text-sm"
          />
          <button
            onClick={addTechSkill}
            type="button"
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        {form.tech_stack.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.tech_stack.map(skill => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-semibold"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeTechSkill(skill)}
                  className="text-indigo-400 hover:text-indigo-700 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <p className="text-xs text-slate-300">{form.tech_stack.length}/30</p>
      </section>

      {error && (
        <p className="text-red-500 text-xs font-medium bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>
      )}
    </div>
  )
}
