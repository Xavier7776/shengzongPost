import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import StudyWorkspace from '@/features/study-plan/StudyWorkspace'
import { defaultPlan } from '@/features/study-plan/model'

it('keeps unfinished fields with their task and date until explicitly cancelled', () => {
  const today = '2026-11-23'
  render(<StudyWorkspace today={today} initialPlan={{ snapshot: defaultPlan(today), revision: 0 }}
    initialRecords={[]} loadFailed={false} aiAvailable={false} embeddedGuide={null} nightlyReview={null} />)
  const tasks = () => screen.getAllByRole('button', { name: /^记录 / })
  const editor = () => within(screen.getByRole('form', { name: '新增记录' }))
  fireEvent.click(tasks()[0])
  fireEvent.change(editor().getByLabelText('笔记（选填）'), { target: { value: '保留思路' } })
  fireEvent.change(editor().getByLabelText('学习结果'), { target: { value: 'hinted' } })
  fireEvent.change(editor().getByLabelText('用时（分钟）'), { target: { value: '' } })
  fireEvent.change(editor().getByLabelText('日期'), { target: { value: '2026-11-22' } })
  fireEvent.click(screen.getByRole('button', { name: '下一周' }))
  fireEvent.click(screen.getByRole('button', { name: '今天' }))
  fireEvent.click(tasks()[1])
  expect(editor().getByLabelText('笔记（选填）')).toHaveValue('')
  fireEvent.click(tasks()[0])
  expect(editor().getByLabelText('日期')).toHaveValue('2026-11-22')
  expect(editor().getByLabelText('笔记（选填）')).toHaveValue('保留思路')
  expect(editor().getByLabelText('学习结果')).toHaveValue('hinted')
  expect(editor().getByLabelText('用时（分钟）')).toHaveValue(null)
  fireEvent.click(editor().getByRole('button', { name: '取消' }))
  fireEvent.click(tasks()[0])
  expect(editor().getByLabelText('笔记（选填）')).toHaveValue('')
  expect(editor().getByLabelText('日期')).toHaveValue(today)
})
