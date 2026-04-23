// components/sections/Hero.tsx
// 服务端组件：从数据库读取 hero_slides；
// 若数据库无数据（建表前/无启用项），自动降级到 lib/data.ts 的 HERO_SLIDES 静态配置。

import { getEnabledHeroSlides } from '@/lib/db'
import { HERO_SLIDES as STATIC_SLIDES } from '@/lib/data'
import HeroClient from './HeroClient'

export default async function Hero() {
  let slides: { img: string; title: string; subtitle: string }[] = []

  try {
    const dbSlides = await getEnabledHeroSlides()
    slides = dbSlides.length > 0
      ? dbSlides.map(s => ({ img: s.img, title: s.title, subtitle: s.subtitle }))
      : STATIC_SLIDES // 降级：数据库为空时用静态数据
  } catch {
    // 数据库表不存在或连接失败 → 静默降级，不影响页面渲染
    slides = STATIC_SLIDES
  }

  return <HeroClient slides={slides} />
}
