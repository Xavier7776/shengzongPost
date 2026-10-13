import { describe, expect, it } from 'vitest'
import imageLoader from '@/lib/cloudinary-loader'

describe('configured image delivery', () => {
  it.each([32, 48, 64, 96])('resizes the local logo to the requested %dpx using the allowed quality', width => {
    const url = new URL(imageLoader({ src: '/logo.png', width }), 'https://example.invalid')
    expect(url.pathname).toBe('/_next/image')
    expect(url.searchParams.get('url')).toBe('/logo.png')
    expect(url.searchParams.get('w')).toBe(String(width))
    expect(url.searchParams.get('q')).toBe('75')
  })
  it('preserves Cloudinary resizing and existing explicit transforms', () => {
    const original = 'https://res.cloudinary.com/example/image/upload/v1/cover.jpg'
    expect(imageLoader({ src: original, width: 640, quality: 80 })).toBe('https://res.cloudinary.com/example/image/upload/w_640,f_auto,q_80/v1/cover.jpg')
    const cropped = 'https://res.cloudinary.com/example/image/upload/c_fill,w_1200/v1/cover.jpg'
    expect(imageLoader({ src: cropped, width: 640 })).toBe(cropped)
  })
  it.each(['/cursor-effects/sprite.webp', 'https://avatars.githubusercontent.com/u/1'])('keeps other image sources unchanged: %s', src => {
    expect(imageLoader({ src, width: 64 })).toBe(src)
  })
})
