'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sheet } from '@/components/ui/sheet'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast'
import { FormMovimiento } from '@/components/movimiento/form-movimiento'
import { FormTransferencia } from '@/components/movimiento/form-transferencia'
import { FormLiquidar } from '@/components/movimiento/form-liquidar'
import { FormCuenta } from '@/components/cuenta/form-cuenta'
import { FormPago } from '@/components/pago/form-pago'
import { useIsMobile } from '@/components/hooks/use-is-mobile'
import { DashboardMovil } from '@/components/dashboard/dashboard-movil'
import { DashboardEscritorio } from '@/components/dashboard/dashboard-escritorio'
import {
  eliminarCuenta,
  eliminarProximoPago,
  type Cuenta,
  type DatosDashboard,
  type ProximoPago,
  type TipoMovimiento,
  type Vista,
} from '@/lib/acciones'

interface DashboardContentProps {
  datos: DatosDashboard
}

type SheetState =
  | { tipo: 'movimiento'; tipoMov: TipoMovimiento }
  | { tipo: 'transferencia' }
  | { tipo: 'liquidar'; pago: ProximoPago }
  | { tipo: 'cuenta' }
  | { tipo: 'editarCuenta'; cuenta: Cuenta }
  | { tipo: 'pago' }
  | { tipo: 'editarPago'; pago: ProximoPago }

export function DashboardContent({ datos }: DashboardContentProps) {
  const [sheet, setSheet] = useState<SheetState | null>(null)
  const [eliminando, setEliminando] = useState<Cuenta | null>(null)
  const [eliminandoPago, setEliminandoPago] = useState<ProximoPago | null>(null)
  const [ahora] = useState(() => new Date().getTime())
  const isMovil = useIsMobile()
  const router = useRouter()
  const { addToast } = useToast()

  const cerrar = () => {
    setSheet(null)
    router.refresh()
  }

  const confirmarEliminar = async () => {
    if (!eliminando) return
    try {
      await eliminarCuenta(datos.userId, eliminando.cuenta_id)
      addToast('Cuenta eliminada', 'success')
      router.refresh()
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'No se pudo eliminar la cuenta',
        'error'
      )
    } finally {
      setEliminando(null)
    }
  }

  const confirmarEliminarPago = async () => {
    if (!eliminandoPago) return
    try {
      await eliminarProximoPago(datos.userId, eliminandoPago.proximo_pago_id)
      addToast('Pago eliminado', 'success')
      router.refresh()
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'No se pudo eliminar el pago',
        'error'
      )
    } finally {
      setEliminandoPago(null)
    }
  }

  const propsCabecera = {
    datos,
    ahora,
    modo: (isMovil ? 'movil' : 'escritorio') as Vista,
    onNuevoGasto: () => setSheet({ tipo: 'movimiento', tipoMov: 'egreso' }),
    onNuevoIngreso: () => setSheet({ tipo: 'movimiento', tipoMov: 'ingreso' }),
    onTransferir: () => setSheet({ tipo: 'transferencia' }),
    onNuevaCuenta: () => setSheet({ tipo: 'cuenta' }),
    onEditarCuenta: (cuenta: Cuenta) => setSheet({ tipo: 'editarCuenta', cuenta }),
    onEliminarCuenta: (cuenta: Cuenta) => setEliminando(cuenta),
    onNuevoPago: () => setSheet({ tipo: 'pago' }),
    onEditarPago: (pago: ProximoPago) => setSheet({ tipo: 'editarPago', pago }),
    onEliminarPago: (pago: ProximoPago) => setEliminandoPago(pago),
    onPagarPago: (pago: ProximoPago) => setSheet({ tipo: 'liquidar', pago }),
  }

  return (
    <>
      {isMovil ? (
        <DashboardMovil {...propsCabecera} />
      ) : (
        <DashboardEscritorio {...propsCabecera} />
      )}

      <Sheet
        open={sheet?.tipo === 'movimiento'}
        title={
          sheet?.tipo === 'movimiento'
            ? sheet.tipoMov === 'egreso'
              ? 'Nuevo Gasto'
              : 'Nuevo Ingreso'
            : ''
        }
        onClose={cerrar}
      >
        {sheet?.tipo === 'movimiento' && (
          <FormMovimiento
            userId={datos.userId}
            tipo={sheet.tipoMov}
            cuentas={datos.cuentas}
            onClose={cerrar}
          />
        )}
      </Sheet>

      <Sheet open={sheet?.tipo === 'transferencia'} title="Transferir" onClose={cerrar}>
        {sheet?.tipo === 'transferencia' && (
          <FormTransferencia
            userId={datos.userId}
            cuentas={datos.cuentas}
            onClose={cerrar}
          />
        )}
      </Sheet>

      <Sheet open={sheet?.tipo === 'liquidar'} title="Liquidar Pago" onClose={cerrar}>
        {sheet?.tipo === 'liquidar' && (
          <FormLiquidar
            userId={datos.userId}
            pago={sheet.pago}
            cuentas={datos.cuentas}
            onClose={cerrar}
          />
        )}
      </Sheet>

      <Sheet
        open={sheet?.tipo === 'cuenta' || sheet?.tipo === 'editarCuenta'}
        title={
          sheet?.tipo === 'editarCuenta'
            ? 'Editar Cuenta'
            : sheet?.tipo === 'cuenta'
              ? 'Nueva Cuenta'
              : ''
        }
        onClose={cerrar}
      >
        {(sheet?.tipo === 'cuenta' || sheet?.tipo === 'editarCuenta') && (
          <FormCuenta
            userId={datos.userId}
            cuenta={sheet.tipo === 'editarCuenta' ? sheet.cuenta : undefined}
            onClose={cerrar}
          />
        )}
      </Sheet>

      <Sheet
        open={sheet?.tipo === 'pago' || sheet?.tipo === 'editarPago'}
        title={
          sheet?.tipo === 'editarPago'
            ? 'Editar Pago'
            : sheet?.tipo === 'pago'
              ? 'Nuevo Pago'
              : ''
        }
        onClose={cerrar}
      >
        {(sheet?.tipo === 'pago' || sheet?.tipo === 'editarPago') && (
          <FormPago
            userId={datos.userId}
            cuentas={datos.cuentas}
            pago={sheet.tipo === 'editarPago' ? sheet.pago : undefined}
            onClose={cerrar}
          />
        )}
      </Sheet>

      <ConfirmDialog
        open={eliminando !== null}
        title="¿Eliminar cuenta?"
        message={`Se eliminará ${eliminando?.nombre ?? ''} y también todos sus movimientos. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        danger
        onConfirm={confirmarEliminar}
        onCancel={() => setEliminando(null)}
      />

      <ConfirmDialog
        open={eliminandoPago !== null}
        title="¿Eliminar pago?"
        message={`Se eliminará "${eliminandoPago?.descripcion ?? ''}" de tus próximos pagos. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        danger
        onConfirm={confirmarEliminarPago}
        onCancel={() => setEliminandoPago(null)}
      />
    </>
  )
}
