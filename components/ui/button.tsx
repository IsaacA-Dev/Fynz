'use client'

import { useRef } from 'react'
import { usePrensa } from '@/components/hooks/use-prensa'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
}

export function Button({ children, loading, className, disabled, ...props }: ButtonProps) {
  const ref = useRef<HTMLButtonElement | null>(null)
  usePrensa(ref)

  return (
    <button
      ref={ref}
      disabled={loading || disabled}
      className={`w-full bg-[var(--color-primary)] text-white py-3 rounded-xl font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 ${className ?? ''}`}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}
