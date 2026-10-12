import { act, render } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useScrollReveal } from '@/shared/hooks'

function Content() {
  const [ref, visible] = useScrollReveal()
  return <div ref={ref} style={{ opacity: visible ? 1 : 0 }}><h2>最近洞察</h2></div>
}

afterEach(() => vi.unstubAllGlobals())

describe('progressive scroll reveal', () => {
  it('renders meaningful content visibly without a browser or hydration', () => {
    expect(renderToString(<Content />)).toContain('style="opacity:1"')
  })

  it('enhances offscreen content while keeping visible content readable and cleaning up observation', () => {
    let notify!: IntersectionObserverCallback
    const observe = vi.fn(), unobserve = vi.fn()
    const observer = { observe, unobserve } as unknown as IntersectionObserver
    vi.stubGlobal('IntersectionObserver', vi.fn(function (callback: IntersectionObserverCallback) {
      notify = callback
      return observer
    }))
    const view = render(<Content />)
    const element = view.container.firstElementChild as HTMLDivElement
    const bounds = new DOMRect(0, 0, 100, 100)
    const entry = { target: element, boundingClientRect: bounds, rootBounds: bounds, time: 0 }
    expect(element).toHaveStyle({ opacity: 1 })
    expect(observe).toHaveBeenCalledWith(element)
    act(() => notify([{ ...entry, intersectionRect: new DOMRect(), intersectionRatio: 0, isIntersecting: false }], observer))
    expect(element).toHaveStyle({ opacity: 0 })
    act(() => notify([{ ...entry, intersectionRect: bounds, intersectionRatio: 1, isIntersecting: true }], observer))
    expect(element).toHaveStyle({ opacity: 1 })
    expect(unobserve).toHaveBeenCalledWith(element)
    view.unmount()
    expect(unobserve).toHaveBeenLastCalledWith(element)
  })
})
