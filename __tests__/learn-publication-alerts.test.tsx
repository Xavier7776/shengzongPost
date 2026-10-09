import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PublicationAlerts from '@/components/admin/PublicationAlerts'
const alerts=[{key:'2026-10-09:missing',text:'2026-10-09：尚未见刊'}]
beforeEach(()=>localStorage.clear())
describe('read-only publication observation reminders',()=>{
  it('shows one reminder then cools down the same observation on reload',()=>{
    const {unmount}=render(<PublicationAlerts alerts={alerts}/>)
    expect(screen.getByRole('alert')).toHaveTextContent('尚未见刊')
    unmount();render(<PublicationAlerts alerts={alerts}/>)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  it('allows the next reminder after 24 hours and clears recovered observations',()=>{
    localStorage.setItem('learn-alert-cooldown',JSON.stringify({[alerts[0].key]:Date.now()-86400001}))
    const {rerender}=render(<PublicationAlerts alerts={alerts}/>)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    rerender(<PublicationAlerts alerts={[]}/>)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  it('does not suppress reminders using malformed or future storage values',()=>{
    localStorage.setItem('learn-alert-cooldown',JSON.stringify({[alerts[0].key]:Date.now()+86400000}))
    render(<PublicationAlerts alerts={alerts}/>)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
  it('still shows the current observation if browser storage is unavailable',()=>{
    const read=vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw Error('disabled')})
    const write=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('disabled')})
    try {render(<PublicationAlerts alerts={alerts}/>);expect(screen.getByRole('alert')).toBeInTheDocument()}
    finally {read.mockRestore();write.mockRestore()}
  })
})
