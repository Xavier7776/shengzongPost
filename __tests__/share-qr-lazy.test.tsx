import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import ShareButtons from '@/components/sections/ShareButtons'

const qr = vi.hoisted(() => ({ loaded: vi.fn() }))
vi.mock('qrcode.react', () => {
  qr.loaded()
  return { QRCodeSVG: ({ value }: { value: string }) => <svg data-testid="share-qr" data-url={value} /> }
})

it('loads the QR generator only after requesting WeChat sharing', async () => {
  render(<ShareButtons title="Edition" slug="daily-learn-2026-10-09" />)
  expect(qr.loaded).not.toHaveBeenCalled()
  expect(screen.queryByTestId('share-qr')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '微信' }))
  const svg = await screen.findByTestId('share-qr')
  expect(qr.loaded).toHaveBeenCalledOnce()
  expect(svg).toHaveAttribute('data-url', window.location.origin + '/blog/daily-learn-2026-10-09')
  fireEvent.click(svg)
  expect(screen.getByRole('heading', { name: '微信分享' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('heading', { name: '微信分享' }).closest('.fixed')!)
  expect(screen.queryByTestId('share-qr')).not.toBeInTheDocument()
})
