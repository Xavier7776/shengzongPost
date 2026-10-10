import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import SpriteCSS from '@/components/ui/SpriteCSS'
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
it.each([['https://res.cloudinary.com/test/image/upload/pet.png', 'anonymous'], ['/cursor-effects/old.webp', undefined]])('sets the correct image request mode for %s before loading', (url, expected) => {
  const requests: { url: string; crossOrigin?: string }[] = []
  vi.stubGlobal('Image', class {
    crossOrigin?: string
    onload: (() => void) | null = null
    set src(url: string) { requests.push({ url, crossOrigin: this.crossOrigin }) }
  })
  render(<SpriteCSS sprite={{ url, cols: 8, rows: 9, fps: 10 }} frameWidth={192} frameHeight={208} width={96} height={104} />)
  expect(requests).toEqual([{ url, crossOrigin: expected }])
})
