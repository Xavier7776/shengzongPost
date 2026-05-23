'use client'

import { useEffect } from 'react'

export default function ImageLazyLoad() {
  useEffect(() => {
    const imgs = document.querySelectorAll('.post-content img, .space-y-5 img')
    imgs.forEach(img => {
      if (!(img as HTMLElement).dataset.lazyDone) {
        img.setAttribute('loading', 'lazy')
        img.setAttribute('decoding', 'async')
        ;(img as HTMLElement).dataset.lazyDone = '1'
      }
    })
  }, [])

  return null
}
