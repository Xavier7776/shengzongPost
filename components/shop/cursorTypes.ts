export interface CursorEffect {
  id: number
  key: string
  name: string
  description: string | null
  price: number
  rarity: string
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
}

export interface CursorShopData {
  effects: CursorEffect[]
  purchased: number[]
  equippedEffectId: number | null
  points: number
}
