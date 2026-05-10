import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Only Us',
  description: '我们的小世界',
  icons: {
    icon: '/onlyus-favicon.ico',
  },
}

export default function OnlyUsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#F8F6F3',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {children}
    </div>
  )
}
