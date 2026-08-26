'use client'

import Link from 'next/link'
import { Ghost } from 'lucide-react'
import { Entrada } from '@/components/ui/motion'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-6 overflow-hidden relative">
      <Entrada duracion="destacada" className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[var(--color-primary)]/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[var(--color-primary)]/10 blur-3xl" />
      </Entrada>

      <Entrada
        duracion="destacada"
        desdeY={30}
        desdeEscala={0.96}
        className="relative text-center space-y-6"
      >
        <Entrada duracion="destacada" delay={200} desdeY={0} desdeEscala={0.6} className="flex justify-center">
          <Ghost size={72} className="text-[var(--color-primary)]" />
        </Entrada>

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
      </Entrada>
    </main>
  )
}
