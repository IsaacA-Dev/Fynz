import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { FormRecuperar } from '@/components/login/form-recuperar'
import { FynzLogo } from '@/components/ui/fynz-logo'

export default async function Recuperar({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const { code } = await searchParams
  if (!code) {
    redirect('/login')
  }

  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-background)]">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <FynzLogo height={44} />
        </div>
        <FormRecuperar
          errorInicial={
            error ? 'El enlace expiró o no es válido. Solicita uno nuevo desde el inicio de sesión.' : null
          }
        />
      </div>
    </main>
  )
}
