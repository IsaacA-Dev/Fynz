'use client'

import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon?: React.ReactNode
  endIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, icon, endIcon, className, ...props },
  ref
) {
  return (
    <div className="group">
      <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={`w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl pl-10 ${endIcon ? 'pr-10' : 'pr-4'} py-3 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all ${className ?? ''}`}
          {...props}
        />
        {endIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {endIcon}
          </span>
        )}
      </div>
    </div>
  )
})
