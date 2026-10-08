'use client'

import FrameSelector from '@/components/shop/FrameSelector'
import CursorSelector from '@/components/shop/CursorSelector'
import type { ProfileSettingsState } from '../useProfileSettings'

type Props = Pick<ProfileSettingsState,
  | 'form'
>

export default function ProfileDisplay({
  form,
}: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-black text-slate-800 mb-1">头像框</h3>
        <FrameSelector currentAvatarUrl={form.avatar} />
      </div>
      <div>
        <h3 className="text-sm font-black text-slate-800 mb-4">鼠标效果</h3>
        <CursorSelector />
      </div>
    </div>
  )
}
