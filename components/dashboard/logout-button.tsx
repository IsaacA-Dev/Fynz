'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface LogoutButtonProps {
  variant?: 'icon' | 'menu'
  onBeforeOpen?: () => void
}

export function LogoutButton({
  variant = 'icon',
  onBeforeOpen,
}: LogoutButtonProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { addToast } = useToast()

  const handleLogout = async () => {
    const supabase = createBrowserSupabase()
    await supabase.auth.signOut()
    addToast('Sesión cerrada correctamente', 'success')
    router.push('/login')
  }

  const abrir = () => {
    onBeforeOpen?.()
    if (onBeforeOpen) {
      window.setTimeout(() => setOpen(true), 320)
    } else {
      setOpen(true)
    }
  }

  return (
    <>
      {variant === 'menu' ? (
        <Button
          type="button"
          variant="ghost"
          onClick={abrir}
          className="w-full justify-start text-fg-muted hover:bg-surface-muted hover:text-fg"
        >
          <LogOut className="size-4" aria-hidden />
          Cerrar sesión
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={abrir}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="text-fg-muted hover:bg-surface-muted hover:text-fg"
        >
          <LogOut className="size-4" aria-hidden />
        </Button>
      )}

      <ConfirmDialog
        open={open}
        title="¿Cerrar sesión?"
        message="La sesión se cerrará en este dispositivo."
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        onConfirm={handleLogout}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
