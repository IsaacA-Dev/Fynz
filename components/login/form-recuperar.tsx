'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, Eye, EyeOff, Lock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { cambiarContrasena } from '@/lib/acciones-servidor'

export function FormRecuperar({ errorInicial }: { errorInicial: string | null }) {
  const [contrasena, setContrasena] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()
  const router = useRouter()

  const valido = contrasena.length >= 8 && contrasena === confirmacion

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valido || loading) return
    setLoading(true)
    const resultado = await cambiarContrasena(contrasena)
    setLoading(false)
    if (!resultado.ok) {
      addToast(resultado.error, 'error')
      return
    }
    addToast('Contraseña actualizada. Ya puedes iniciar sesión.', 'success')
    router.push('/login')
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="bg-[var(--color-surface)] p-6 rounded-2xl shadow-sm border border-[var(--color-border)] space-y-4"
    >
      <div className="text-center">
        <h1 className="text-lg font-semibold text-[var(--color-text)]">Nueva contraseña</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Elige una contraseña de al menos 8 caracteres.
        </p>
      </div>

      {errorInicial && (
        <span
          role="alert"
          className="flex items-center gap-1.5 text-[var(--color-error)] text-sm"
        >
          <AlertCircle size={14} className="shrink-0" />
          {errorInicial}
        </span>
      )}

      <Input
        label="Nueva contraseña"
        type={showPassword ? 'text' : 'password'}
        icon={<Lock size={16} />}
        endIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
        value={contrasena}
        onChange={(e) => setContrasena(e.target.value)}
        placeholder="••••••••"
        minLength={8}
        required
      />

      <Input
        label="Confirmar contraseña"
        type={showPassword ? 'text' : 'password'}
        icon={<Lock size={16} />}
        value={confirmacion}
        onChange={(e) => setConfirmacion(e.target.value)}
        placeholder="••••••••"
        minLength={8}
        required
      />

      {contrasena !== '' && confirmacion !== '' && !valido && (
        <p className="text-xs text-[var(--color-error)]">
          {contrasena.length > 0 && contrasena.length < 8
            ? 'La contraseña debe tener al menos 8 caracteres.'
            : 'Las contraseñas no coinciden.'}
        </p>
      )}

      <Button type="submit" loading={loading} disabled={!valido}>
        Guardar contraseña
      </Button>

      <p className="text-center text-xs">
        <Link href="/login" className="text-[var(--color-primary)] font-medium hover:opacity-80">
          Volver al inicio de sesión
        </Link>
      </p>
    </form>
  )
}
