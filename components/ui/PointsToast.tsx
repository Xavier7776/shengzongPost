'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { Star } from 'lucide-react'

interface Toast {
  id: number
  amount: number
  message: string
}

interface PointsToastContextType {
  showPointsToast: (amount: number, message?: string) => void
}

const PointsToastContext = createContext<PointsToastContextType>({ showPointsToast: () => {} })

export function usePointsToast() {
  return useContext(PointsToastContext)
}

export function PointsToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const showPointsToast = useCallback((amount: number, message?: string) => {
    const id = nextId.current++
    const text = message ?? (amount > 0 ? `+${amount} 积分` : `${amount} 积分`)
    setToasts(prev => [...prev, { id, amount, message: text }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 2500)
  }, [])

  return (
    <PointsToastContext.Provider value={{ showPointsToast }}>
      {children}
      {/* Toast 容器 */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="flex items-center gap-2 bg-white/95 backdrop-blur-sm border border-amber-200 shadow-lg shadow-amber-100/50 rounded-xl px-4 py-2.5 animate-points-toast-in"
          >
            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </div>
            <span className="text-sm font-black text-amber-700">{toast.message}</span>
          </div>
        ))}
      </div>
    </PointsToastContext.Provider>
  )
}
