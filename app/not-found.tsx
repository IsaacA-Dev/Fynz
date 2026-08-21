'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Ghost } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-6 overflow-hidden relative">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[var(--color-primary)]/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[var(--color-primary)]/10 blur-3xl" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative text-center space-y-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center"
        >
          <Ghost size={72} className="text-[var(--color-primary)]" />
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tight text-[var(--color-text)]">404</h1>
          <p className="text-[var(--color-text-muted)] text-lg">Página no encontrada</p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          Volver al inicio
        </Link>
      </motion.div>
    </main>
  )
}
