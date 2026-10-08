'use client'

import { Bookmark, Heart } from 'lucide-react'
import type { ProfileSettingsState } from '../useProfileSettings'

type Props = Pick<ProfileSettingsState,
  | 'showBookmarks'
  | 'toggleBookmarks'
  | 'showLikes'
  | 'toggleLikes'
>

export default function ProfilePreferences({
  showBookmarks, toggleBookmarks, showLikes, toggleLikes,
}: Props) {
  return (
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
}
