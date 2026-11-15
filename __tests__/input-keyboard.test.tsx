import { createRef, type ComponentProps } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EditorToolbar } from '@/features/editor/EditorToolbar'
import ProfileForm from '@/features/profile/components/ProfileForm'

afterEach(cleanup)

function editorDialogs() {
  return {
    link: { open: true, url: '', text: '', setUrl: vi.fn(), setText: vi.fn(), setOpen: vi.fn(), openPopup: vi.fn(), apply: vi.fn() },
    imgUrl: { open: true, url: '', alt: '', setUrl: vi.fn(), setAlt: vi.fn(), setOpen: vi.fn(), apply: vi.fn() },
    table: { open: true, rows: 2, cols: 2, withHeader: true, setRows: vi.fn(), setCols: vi.fn(), setWithHeader: vi.fn(), setOpen: vi.fn(), apply: vi.fn() },
    insertVideo: vi.fn(),
  } satisfies ComponentProps<typeof EditorToolbar>['dialogs']
}

describe('editor keyboard input', () => {
  it.each([
    ['link', '显示文字（留空则包裹选区）'],
    ['imgUrl', 'Alt 描述（可选）'],
  ] as const)('does not apply %s while confirming IME text, including Safari ordering', (key, placeholder) => {
    const dialogs = editorDialogs()
    render(<EditorToolbar editor={null} dialogs={dialogs} />)
    const input = screen.getByPlaceholderText(placeholder)
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
    fireEvent.keyDown(input, { key: 'Enter', isComposing: false, keyCode: 229 })
    expect(dialogs[key].apply).not.toHaveBeenCalled()
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    fireEvent(input, event)
    expect(event.defaultPrevented).toBe(true)
    expect(dialogs[key].apply).toHaveBeenCalledTimes(1)
  })

  it('leaves Enter on popup buttons to native click activation without double applying', () => {
    const dialogs = editorDialogs()
    render(<EditorToolbar editor={null} dialogs={dialogs} />)
    const confirm = screen.getByRole('button', { name: '确认' })
    fireEvent.keyDown(confirm, { key: 'Enter' })
    expect(dialogs.link.apply).not.toHaveBeenCalled()
    fireEvent.click(confirm)
    expect(dialogs.link.apply).toHaveBeenCalledTimes(1)
    expect(confirm).toHaveAttribute('type', 'button')
  })

  it('activates toolbar actions through click, including native keyboard activation', () => {
    const dialogs = editorDialogs()
    render(<EditorToolbar editor={null} dialogs={dialogs} />)
    const button = screen.getByRole('button', { name: '插入链接' })
    fireEvent.mouseDown(button)
    expect(dialogs.link.openPopup).not.toHaveBeenCalled()
    fireEvent.click(button)
    expect(dialogs.link.openPopup).toHaveBeenCalledTimes(1)
  })

  it('allows Escape to dismiss a popup after composition has finished', () => {
    const dialogs = editorDialogs()
    render(<EditorToolbar editor={null} dialogs={dialogs} />)
    const input = screen.getByPlaceholderText('https://example.com')
    fireEvent.keyDown(input, { key: 'Escape', isComposing: true })
    expect(dialogs.link.setOpen).not.toHaveBeenCalled()
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(dialogs.link.setOpen).toHaveBeenCalledWith(false)
  })
})

it('adds profile tags only after IME confirmation and a separate Enter', () => {
  const addTechSkill = vi.fn()
  const props: ComponentProps<typeof ProfileForm> = {
    frameCssKey: null, showAvatar: false, userId: 1, initial: 'T', fileRef: createRef<HTMLInputElement>(),
    uploadingAvatar: false, handleAvatarChange: vi.fn(), openFollowModal: vi.fn(),
    followCounts: { following: 0, followers: 0 }, points: 0, setField: vi.fn(), techInput: '中文',
    setTechInput: vi.fn(), setError: vi.fn(), addTechSkill, removeTechSkill: vi.fn(), error: '',
    form: { id: 1, name: 'Test', email: '', phone: '', bio: '', avatar: '', title: '', motto: '', location: '', website: '', github_url: '', twitter_url: '', tech_stack: [] },
  }
  render(<ProfileForm {...props} />)
  const input = screen.getByPlaceholderText('输入技术标签，按回车添加')
  fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
  fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 })
  expect(addTechSkill).not.toHaveBeenCalled()
  fireEvent.keyDown(input, { key: 'Enter' })
  expect(addTechSkill).toHaveBeenCalledTimes(1)
})
