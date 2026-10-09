'use client'

import { Loader2, Check, Eye, EyeOff, Send } from 'lucide-react'
import type { ProfileSettingsState } from '../useProfileSettings'

type Props = Pick<ProfileSettingsState,
  | 'pwStep'
  | 'handleSendCode'
  | 'pwMasked'
  | 'pwCode'
  | 'setPwCode'
  | 'setPwError'
  | 'pwNew'
  | 'setPwNew'
  | 'showPw'
  | 'setShowPw'
  | 'pwConfirm'
  | 'setPwConfirm'
  | 'pwError'
  | 'setPwStep'
  | 'handleChangePassword'
>

export default function ProfileSecurity({
  pwStep, handleSendCode, pwMasked, pwCode, setPwCode, setPwError, pwNew, setPwNew, showPw,
  setShowPw, pwConfirm, setPwConfirm, pwError, setPwStep, handleChangePassword,
}: Props) {
  return (
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
                minLength={12}
                placeholder="至少 12 位"
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
}
