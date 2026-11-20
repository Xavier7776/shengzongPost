'use client'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Suspense, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

const StudyJournal = dynamic(() => import('@/features/study-records/StudyJournal'), {
  loading: () => <p role="status" className="text-sm text-slate-600">正在读取学习记录…</p>,
})

const tabs = [
  { id: 'overview', label: '概览' },
  { id: 'study', label: '学习' },
] as const
type TabId = typeof tabs[number]['id']

export default function HomeViews({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const user = session?.user as { id?: string; role?: string } | undefined
  if (status !== 'authenticated' || user?.role !== 'admin' || !user.id) return children

  return <Suspense fallback={children}>
    <AdminHomeViews key={user.id}>{children}</AdminHomeViews>
  </Suspense>
}

function AdminHomeViews({ children }: { children: ReactNode }) {
  const params = useSearchParams()
  const active: TabId = params.get('view') === 'study' ? 'study' : 'overview'
  const prefix = useId()
  const buttons = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({})
  const [focused, setFocused] = useState<TabId | null>(null)

  function select(id: TabId) {
    if (active === id) return
    const url = new URL(window.location.href)
    if (id === 'study') url.searchParams.set('view', 'study')
    else url.searchParams.delete('view')
    url.hash = ''
    window.history.pushState(null, '', url)
  }

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, id: TabId) {
    let target: TabId
    switch (event.key) {
      case 'Home': target = 'overview'; break
      case 'End': target = 'study'; break
      case 'ArrowLeft':
      case 'ArrowRight': target = id === 'overview' ? 'study' : 'overview'; break
      default: return
    }
    event.preventDefault()
    buttons.current[target]?.focus()
  }

  return (
    <div className="bg-[#FAFAF8] pt-[4.5rem]">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div role="tablist" aria-label="首页内容" className="flex gap-6 border-b border-slate-200"
          onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(null) }}>
          {tabs.map(tab => (
            <button key={tab.id} ref={node => { buttons.current[tab.id] = node }}
              id={prefix + '-' + tab.id} type="button" role="tab" aria-selected={active === tab.id}
              tabIndex={(focused ?? active) === tab.id ? 0 : -1}
              onFocus={() => setFocused(tab.id)}
              onKeyDown={event => moveFocus(event, tab.id)}
              onClick={() => select(tab.id)}
              className="relative min-h-12 px-3 text-sm font-bold text-slate-600 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 aria-selected:text-blue-700 aria-selected:after:absolute aria-selected:after:inset-x-0 aria-selected:after:bottom-0 aria-selected:after:border-b-2 aria-selected:after:border-current aria-selected:after:content-['']">
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <section role="tabpanel" aria-labelledby={prefix + '-overview'} hidden={active !== 'overview'}>
        {active === 'overview' && <div className="[--home-intro-top:2.25rem]">{children}</div>}
      </section>
      <section role="tabpanel" aria-labelledby={prefix + '-study'} hidden={active !== 'study'}
        tabIndex={active === 'study' ? 0 : undefined}>
        {active === 'study' && <div className="mx-auto max-w-6xl px-5 pb-16 pt-7 text-[#252a34] sm:px-6 sm:pb-24 sm:pt-9">
          <StudyJournal />
        </div>}
      </section>
    </div>
  )
}
