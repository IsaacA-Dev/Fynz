import { redirect } from 'next/navigation'
import { obtenerDatosDashboard } from '@/lib/acciones-servidor'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export default async function Dashboard() {
  const datos = await obtenerDatosDashboard()

  if (!datos) {
    redirect('/login')
  }

  return <DashboardContent datos={datos} />
}
