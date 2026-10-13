import React, { act } from 'react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import GalleryClient from '@/app/gallery/GalleryClient'
import { blurPlaceholder, type GalleryItem } from '@/app/gallery/types'

vi.mock('next/image', () => ({ default: ({ fill: _fill, priority: _priority, ...props }: React.ComponentProps<'img'> & { fill?: boolean; priority?: boolean }) => React.createElement('img', props) }))
// Keep the real lightbox; peripheral layouts are not part of the portal regression.
vi.mock('@/components/sections/FilmStrip', () => ({ default: () => null }))
vi.mock('@/app/gallery/MasonryGrid', () => ({ default: () => null }))

const images: GalleryItem[] = [1, 2, 3].map(id => ({ id, title: `Photo ${id}`,
  url: `https://example.test/${id}.jpg`, category: 'Test', description: null,
  tags: [], width: 800, height: 600, likes: 0 }))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
  localStorage.clear()
})

it('renders a deep link on the server, hydrates consistently, navigates and closes the real lightbox', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  // Simulate an already cached image: no later load event is required.
  vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
  vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(800)
  const errors: unknown[] = []
  vi.spyOn(console, 'error').mockImplementation((...args) => errors.push(args))
  const props = { images, tags: [], initialImageId: 2 }
  const host = document.createElement('div')
  // Previously this attempted to render a portal during SSR and threw.
  host.innerHTML = renderToString(<GalleryClient {...props} />)
  expect(host.querySelector('[aria-label="关闭"]')).toBeNull()
  document.body.append(host)
  window.history.replaceState(null, '', '/gallery?image=2')
  let root: ReturnType<typeof hydrateRoot> | undefined
  try {
    await act(async () => { root = hydrateRoot(host, <GalleryClient {...props} />, { onRecoverableError: e => errors.push(e) }) })
    expect(screen.getByRole('button', { name: /^关闭$/ })).toBeInTheDocument()
    expect(document.querySelector('img[alt="Photo 2"].opacity-100')).not.toBeNull()
    await act(async () => { fireEvent.keyDown(window, { key: 'ArrowRight' }) })
    expect(new URL(window.location.href).searchParams.get('image')).toBe('3')
    expect(document.querySelector('img[alt="Photo 3"].opacity-100')).not.toBeNull()
    await act(async () => { fireEvent.keyDown(window, { key: 'ArrowLeft' }) })
    expect(new URL(window.location.href).searchParams.get('image')).toBe('2')
    await act(async () => { fireEvent.keyDown(window, { key: 'Escape' }) })
    expect(screen.queryByRole('button', { name: /^关闭$/ })).toBeNull()
    expect(new URL(window.location.href).searchParams.has('image')).toBe(false)
    expect(errors).toEqual([])
  } finally { await act(async () => root?.unmount()) }
})

it.each(['image', 'video'])('uses a supported Cloudinary quality for %s placeholders', kind => {
  expect(blurPlaceholder(`https://res.cloudinary.com/demo/${kind}/upload/v123/photo.jpg`))
    .toBe(`https://res.cloudinary.com/demo/${kind}/upload/w_32,e_blur:800,q_auto:low/v123/photo.jpg`)
})

it('preserves non-Cloudinary image URLs', () => {
  expect(blurPlaceholder('/local.jpg')).toBe('/local.jpg')
})
