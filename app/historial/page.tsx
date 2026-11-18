import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { HistorialExplorador } from '@/components/historial/historial-explorador'

export default async function Historial() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <HistorialExplorador />
}
