import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { calcularDisponibleReal } from '@/lib/acciones'
import { LogoutButton } from '@/components/LogoutButton'

export default async function Dashboard() {
  const supabase = await createServerSupabase()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { dineroLiquido, pagosProximos, disponibleReal } = await calcularDisponibleReal(user.id)

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto space-y-6">
        
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">fynz</h1>
          <LogoutButton />
        </header>

        <section className="bg-blue-600 rounded-3xl p-6 text-white shadow-lg">
          <p className="text-blue-100 text-sm font-medium mb-1">Disponible Real</p>
          <h2 className="text-5xl font-bold tracking-tight">
            ${disponibleReal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </h2>
        </section>

        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs font-medium mb-1">Dinero Líquido</p>
            <p className="text-xl font-semibold text-gray-900">
              ${dineroLiquido.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs font-medium mb-1">Pagos Próximos</p>
            <p className="text-xl font-semibold text-red-600">
              -${pagosProximos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </section>

      </div>
    </main>
  )
}
