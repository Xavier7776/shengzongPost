// components/admin/shop/types.ts
// 管理端共享类型（与 lib/db.ts 的接口对齐，但独立导出避免客户端组件直接引 db）

export interface AdminCursorEffect {
  id: number
  key: string
  name: string
  description: string | null
  price: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  sprite_url: string | null
  cols: number
  rows: number
  fps: number
  frame_width: number
  frame_height: number
  scale: number
  follow_easing: number
  state_map: string
  emoji: string
  render_type: 'sprite_sheet' | 'gif'
  poster_url: string | null
  enabled: boolean
  created_at: string
}

export interface AdminAvatarFrame {
  id: number
  key: string
  name: string
  description: string | null
  price: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  css_key: string
  enabled: boolean
  created_at: string
}

export const RARITY_OPTIONS = [
  { value: 'common',    label: '普通',    color: 'bg-slate-100 text-slate-600' },
  { value: 'rare',      label: '稀有',    color: 'bg-blue-100 text-blue-600' },
  { value: 'epic',      label: '史诗',    color: 'bg-purple-100 text-purple-600' },
  { value: 'legendary', label: '传说',    color: 'bg-amber-100 text-amber-600' },
] as const

export const RENDER_TYPE_OPTIONS = [
  { value: 'sprite_sheet', label: 'Sprite-Sheet（多状态）' },
  { value: 'gif',          label: 'GIF（自播放）' },
] as const
