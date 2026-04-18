'use client'

import { useScrollReveal } from '@/lib/hooks'

interface SectionHeadingProps {
  children: React.ReactNode
  light?: boolean
}

export default function SectionHeading({ children, light = false }: SectionHeadingProps) {
  const [ref, isVisible] = useScrollReveal()

  return (
    <div
      ref={ref}
      className={`mb-16 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <h2
        className={`text-3xl md:text-4xl font-black tracking-tight ${
          light ? 'text-white' : 'text-gray-900'
        }`}
      >
        {children}
      </h2>
      <div className="w-12 h-1 bg-blue-600 mt-4 rounded-full" />
    </div>
  )
}
