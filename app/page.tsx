import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { obtenerDatosDashboard } from '@/lib/acciones'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export default async function Dashboard() {
  const supabase = await createServerSupabase()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const datos = await obtenerDatosDashboard(user.id)

  return <DashboardContent datos={datos} />
}
