import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import ResearchPage from '@/app/skills/research/page'

const { session } = vi.hoisted(() => ({ session: { user: { id: '7', name: '测试用户' } } }))
vi.mock('next-auth/react', () => ({ useSession: () => ({ data: session }) }))
vi.mock('@/components/layout/UserMenu', () => ({ default: () => null }))

class TestWebSocket {
  static OPEN = 1
  static instances: TestWebSocket[] = []
  readyState = TestWebSocket.OPEN
  onmessage: ((event: { data: string }) => void) | null = null
  send = vi.fn()
  close = vi.fn()
  constructor(public url: string) { TestWebSocket.instances.push(this) }
  receive(data: object) { this.onmessage?.({ data: JSON.stringify(data) }) }
}

const fetchMock = vi.fn()
const response = (data: object, status = 200) => ({ ok: status < 400, status, json: async () => data })

beforeEach(() => {
  TestWebSocket.instances = []
  fetchMock.mockReset().mockImplementation(async (url, options) => {
    if (url === '/api/research/ws-url') return response({ url: 'wss://research.test' })
    if (url === '/api/research/points') return response(options?.method === 'POST' ? { remaining: 3000 } : { points: 5000 })
    return response({})
  })
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('WebSocket', TestWebSocket)
})
afterEach(() => vi.unstubAllGlobals())

describe('Research 路由拆分回归', () => {
  it('扣费后发送任务，区分研究草稿与最终报告，并在完成时保存正文', async () => {
    const { unmount } = render(<ResearchPage />)
    const start = await screen.findByRole('button', { name: /开始生成研报/ })
    fireEvent.change(screen.getByPlaceholderText('请输入研究主题...'), { target: { value: '测试研究主题' } })
    fireEvent.click(start)
    await waitFor(() => expect(TestWebSocket.instances[0]?.send).toHaveBeenCalledOnce())
    const socket = TestWebSocket.instances[0]
    expect(socket.url).toBe('wss://research.test/ws')
    const task = JSON.parse(socket.send.mock.calls[0][0].slice('start '.length))
    expect(task).toMatchObject({ task: '测试研究主题', headers: { model: 'mimo-v2.5-pro', language: 'chinese' } })
    expect(fetchMock).toHaveBeenCalledWith('/api/research/points', { method: 'POST', cache: 'no-store' })

    act(() => {
      socket.receive({ type: 'report', output: '研究草稿' })
      socket.receive({ type: 'logs', content: 'writer_start', output: '开始撰写' })
      socket.receive({ type: 'report', output: '报告片段' })
      socket.receive({ type: 'logs', content: 'research_report', output: '最终完整报告' })
      socket.receive({ type: 'path', output: { markdown: 'report.md' } })
    })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/research/reports', expect.objectContaining({
      method: 'POST', body: expect.stringContaining('最终完整报告'),
    })))
    const saved = JSON.parse(fetchMock.mock.calls.find(([url, options]) => url === '/api/research/reports' && options?.method === 'POST')![1].body)
    expect(saved).toMatchObject({ topic: '测试研究主题', report_content: '最终完整报告', status: 'finished' })
    fireEvent.click(screen.getByRole('button', { name: '查看研报' }))
    expect(screen.getByText('最终完整报告')).toBeInTheDocument()
    unmount()
    expect(socket.close).toHaveBeenCalledOnce()
  })

  it('扣费接口返回积分不足时显示弹窗并停止连接', async () => {
    fetchMock.mockImplementation(async (_url, options) => response(options?.method === 'POST' ? { current: 50 } : { points: 5000 }, options?.method === 'POST' ? 402 : 200))
    render(<ResearchPage />)
    fireEvent.click(await screen.findByRole('button', { name: /开始生成研报/ }))
    expect(await screen.findByRole('heading', { name: '积分不足' })).toBeInTheDocument()
    expect(TestWebSocket.instances).toHaveLength(0)
    expect(fetchMock).not.toHaveBeenCalledWith('/api/research/ws-url', expect.anything())
  })
})
