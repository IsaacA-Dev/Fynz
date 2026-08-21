'use client'

import { motion } from 'framer-motion'

export function AuthContainer({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-6 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[var(--color-primary)]/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[var(--color-primary)]/10 blur-3xl" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-full max-w-sm"
      >
        {children}
      </motion.div>
    </main>
  )
}
