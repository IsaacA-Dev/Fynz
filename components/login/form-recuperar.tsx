'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { FormField } from '@/components/ui/form-field'
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
  const errorConfirmacion =
    contrasena !== '' && confirmacion !== '' && !valido
      ? contrasena.length < 8
        ? 'La contraseña debe tener al menos 8 caracteres.'
        : 'Las contraseñas no coinciden.'
      : undefined

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
        <Alert variant="danger" title="No pudimos restablecer la contraseña">
          {errorInicial}
        </Alert>
      )}

      <FormField label="Nueva contraseña" required>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            leadingIcon={<Lock className="size-4" />}
            className="pr-11"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            placeholder="••••••••"
            minLength={8}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-fg-subtle transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/80"
            aria-label={
              showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
            }
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </FormField>

      <FormField
        label="Confirmar contraseña"
        error={errorConfirmacion}
        required
      >
        <Input
          type={showPassword ? 'text' : 'password'}
          leadingIcon={<Lock className="size-4" />}
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
          placeholder="••••••••"
          minLength={8}
          invalid={Boolean(errorConfirmacion)}
          required
        />
      </FormField>

      <Button type="submit" loading={loading} disabled={!valido} className="w-full">
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
