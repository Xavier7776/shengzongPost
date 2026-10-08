'use client'

import AvatarImage from '@/components/ui/AvatarImage'
import Link from 'next/link'
import { Loader2, X } from 'lucide-react'
import type { ProfileSettingsState } from '../useProfileSettings'

type Props = Pick<ProfileSettingsState,
  | 'followModal'
  | 'setFollowModal'
  | 'followCounts'
  | 'followListLoading'
  | 'followList'
>

export default function ProfileFollowModal({
  followModal, setFollowModal, followCounts, followListLoading, followList,
}: Props) {
  return (
    <>{followModal && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
        onClick={() => setFollowModal(null)}
      >
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-base">
              {followModal === 'followers' ? '粉丝' : '关注'}
              <span className="ml-2 text-slate-400 font-normal text-sm">
                {followModal === 'followers' ? followCounts.followers : followCounts.following}
              </span>
            </h3>
            <button onClick={() => setFollowModal(null)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* list */}
          <div className="max-h-[360px] overflow-y-auto py-2">
            {followListLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              </div>
            ) : followList.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-10">暂无{followModal === 'followers' ? '粉丝' : '关注'}</p>
            ) : (
              followList.map(u => (
                <Link
                  key={u.id}
                  href={`/profile/${u.id}`}
                  onClick={() => setFollowModal(null)}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-2xl overflow-hidden bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <AvatarImage src={u.avatar} alt={u.name} size={40} userId={u.id} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{u.name}</p>
                    {u.bio && <p className="text-xs text-slate-400 truncate mt-0.5">{u.bio}</p>}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    )}</>
  )
}
