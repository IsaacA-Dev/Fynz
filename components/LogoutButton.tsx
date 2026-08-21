'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
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
      <button
        onClick={() => setOpen(true)}
        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-200"
      >
        Cerrar Sesión
      </button>

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
