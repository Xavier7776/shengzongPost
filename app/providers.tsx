'use client'

import { SessionProvider } from 'next-auth/react'
import { PointsToastProvider } from '@/components/ui/PointsToast'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={true}>
      <PointsToastProvider>
        {children}
      </PointsToastProvider>
    </SessionProvider>
  )
}
