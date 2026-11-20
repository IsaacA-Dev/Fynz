'use client'

import Link from 'next/link'
import { LogoutButton } from '@/components/dashboard/logout-button'
import { InstallPwaButton } from '@/components/pwa/install-pwa-button'
import { FynzLogo } from '@/components/ui/fynz-logo'
import { ThemeSwitcher } from '@/components/theme/theme-switcher'
import {
  BentoDashboard,
  type BentoDashboardProps,
} from '@/components/dashboard/bento-dashboard'

export function DashboardEscritorio(props: BentoDashboardProps) {
  return (
    <main className="min-h-dvh bg-surface-muted p-6 lg:p-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex select-none items-center justify-between gap-2">
          <Link href="/" aria-label="Ir a Inicio" className="inline-flex">
            <FynzLogo height={30} />
          </Link>
          <div className="flex items-center gap-2">
            <InstallPwaButton />
            <ThemeSwitcher />
            <LogoutButton />
          </div>
        </header>

        <div className="mt-6">
          <BentoDashboard {...props} />
        </div>
      </div>
    </main>
  )
}
