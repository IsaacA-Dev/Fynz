'use client'

import { type SelectHTMLAttributes, forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, className, children, ...props },
  ref
) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">
        {label}
      </label>
      <div className="relative">
        <select
          ref={ref}
          className={`w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl pl-4 pr-10 py-3 text-[var(--color-text)] appearance-none focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all ${className ?? ''}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
      </div>
    </div>
  )
})
