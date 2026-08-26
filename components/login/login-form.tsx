'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/ui/mode-toggle'
import { useToast } from '@/components/ui/toast'
import { useAnime } from '@/components/hooks/use-anime'
import { Entrada } from '@/components/ui/motion'
import { FynzLogoAnimado } from '@/components/ui/fynz-logo'
import { esEmailValido, normalizarEmail } from '@/lib/utils/email'
import { traducirErrorAuth } from '@/lib/utils/errores-auth'

export function LoginForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement | null>(null)
  const { animar, reducirMovimiento } = useAnime()

  const supabase = createBrowserSupabase()
  const router = useRouter()
  const { addToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const emailNormalizado = normalizarEmail(email)

    if (!esEmailValido(emailNormalizado)) {
      setEmailError('Escribe un correo válido, ej. nombre@dominio.com')
      setLoading(false)
      return
    }
    setEmailError('')

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailNormalizado,
        password,
      })
      if (error) {
        addToast(traducirErrorAuth(error), 'error')
      } else {
        addToast('Bienvenido de nuevo', 'success')
        router.push('/')
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email: emailNormalizado,
        password,
      })
      if (error) {
        addToast(traducirErrorAuth(error), 'error')
      } else {
        addToast('Revisa tu correo para confirmar tu cuenta', 'success')
      }
    }

    setLoading(false)
  }

  useLayoutEffect(() => {
    const form = formRef.current
    if (!form || reducirMovimiento) return
    form.style.opacity = '0'
    animar(form, {
      duracion: 'normal',
      opacity: [0, 1],
      translateX: [isLogin ? -20 : 20, 0],
    })
  }, [animar, reducirMovimiento, isLogin])

  return (
    <div className="space-y-6">
      <Entrada duracion="destacada" className="text-center">
        <div className="flex flex-col items-center gap-3">
          <FynzLogoAnimado height={56} />
        </div>
        <p className="text-[var(--color-text-muted)] mt-2">
          {isLogin ? 'Inicia sesión para continuar' : 'Crea tu cuenta en segundos'}
        </p>
      </Entrada>

      <ModeToggle
        isLogin={isLogin}
        onToggle={(mode) => {
          setIsLogin(mode === 'login')
          setEmailError('')
        }}
      />

      <form
        ref={formRef}
        noValidate
        onSubmit={handleSubmit}
        className="bg-[var(--color-surface)] p-6 rounded-2xl shadow-sm border border-[var(--color-border)] space-y-4"
      >
        <Input
          label="Correo electrónico"
          type="email"
          icon={<Mail size={16} />}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (emailError) setEmailError('')
          }}
          placeholder="tu@email.com"
          required
        />

        {emailError && (
          <Entrada duracion="rapida" desdeY={-6}>
            <span
              role="alert"
              className="flex items-center gap-1.5 text-[var(--color-error)] text-sm"
            >
              <AlertCircle size={14} className="shrink-0" />
              {emailError}
            </span>
          </Entrada>
        )}

        <Input
          label="Contraseña"
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          minLength={6}
          required
        />

        <Button type="submit" loading={loading}>
          {loading ? 'Procesando...' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </Button>
      </form>

      <div className="text-center">
        <button
          onClick={() => {
            setIsLogin(!isLogin)
            setEmailError('')
          }}
          className="text-[var(--color-primary)] text-sm font-medium hover:opacity-80 transition-opacity"
        >
          {isLogin ? (
            <>¿No tienes cuenta? <span className="underline">Regístrate aquí</span></>
          ) : (
            <>¿Ya tienes cuenta? <span className="underline">Inicia sesión</span></>
          )}
        </button>
      </div>
    </div>
  )
}
