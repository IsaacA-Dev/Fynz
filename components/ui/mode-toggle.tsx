'use client'

import { motion } from 'framer-motion'

interface ModeToggleProps {
  isLogin: boolean
  onToggle: (mode: 'login' | 'register') => void
}

const tabs = [
  { key: 'login' as const, label: 'Login' },
  { key: 'register' as const, label: 'Registro' },
]

export function ModeToggle({ isLogin, onToggle }: ModeToggleProps) {
  const active = isLogin ? 'login' : 'register'

  return (
    <div className="relative grid grid-cols-2 bg-[var(--color-border)]/50 rounded-xl p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onToggle(tab.key)}
          className={`relative py-2.5 text-sm font-medium rounded-lg z-10 transition-colors ${
            active === tab.key
              ? 'text-[var(--color-text)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          {active === tab.key && (
            <motion.span
              layoutId="mode-indicator"
              className="absolute inset-0 bg-[var(--color-surface)] rounded-lg shadow-sm"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
