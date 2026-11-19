'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export function LogoutButton() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createBrowserSupabase()
  const { addToast } = useToast()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    addToast('Sesión cerrada correctamente', 'success')
    router.push('/login')
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        className="text-fg-muted hover:bg-surface-muted hover:text-fg"
      >
        <LogOut className="size-4" aria-hidden />
      </Button>

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
