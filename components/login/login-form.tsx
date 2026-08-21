'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/ui/mode-toggle'
import { useToast } from '@/components/ui/toast'
import { esEmailValido, normalizarEmail, traducirErrorAuth } from '@/lib/utils'

export function LoginForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [loading, setLoading] = useState(false)

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

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-center"
      >
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-4xl font-bold tracking-tight text-[var(--color-text)]"
        >
          fynz
        </motion.h1>
        <p className="text-[var(--color-text-muted)] mt-2">
          {isLogin ? 'Inicia sesión para continuar' : 'Crea tu cuenta en segundos'}
        </p>
      </motion.div>

      <ModeToggle
        isLogin={isLogin}
        onToggle={(mode) => {
          setIsLogin(mode === 'login')
          setEmailError('')
        }}
      />

      <AnimatePresence mode="wait">
        <motion.form
          key={isLogin ? 'login' : 'register'}
          noValidate
          initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
          transition={{ duration: 0.3 }}
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

          <AnimatePresence>
            {emailError && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-1.5 text-[var(--color-error)] text-sm"
                role="alert"
              >
                <AlertCircle size={14} className="shrink-0" />
                {emailError}
              </motion.p>
            )}
          </AnimatePresence>

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
        </motion.form>
      </AnimatePresence>

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
