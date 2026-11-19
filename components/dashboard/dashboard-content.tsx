'use client'

import { useState } from 'react'
import { Sheet } from '@/components/ui/sheet'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast'
import { FormMovimiento } from '@/components/movimiento/form-movimiento'
import { FormTransferencia } from '@/components/movimiento/form-transferencia'
import { FormLiquidar } from '@/components/movimiento/form-liquidar'
import { FormMontoTarjeta } from '@/components/movimiento/form-monto-tarjeta'
import { FormCuenta } from '@/components/cuenta/form-cuenta'
import { FormPuestaAlDia } from '@/components/cuenta/form-puesta-al-dia'
import { FormPago } from '@/components/pago/form-pago'
import { useIsMobile } from '@/components/hooks/use-is-mobile'
import { DashboardMovil } from '@/components/dashboard/dashboard-movil'
import { DashboardEscritorio } from '@/components/dashboard/dashboard-escritorio'
import { HorizonteControl } from '@/components/dashboard/horizonte-control'
import {
  adelantarPeriodo,
  eliminarCuenta,
  eliminarProximoPago,
  guardarHorizonte,
  guardarProximoIngreso,
  obtenerDatosDashboard,
} from '@/lib/acciones-servidor'
import { hoyLocal } from '@/lib/fechas'
import type {
  Cuenta,
  DatosDashboard,
  ProximoPago,
  TipoMovimiento,
  Vista,
} from '@/lib/acciones'

interface DashboardContentProps {
  datos: DatosDashboard
}

type SheetState =
  | { tipo: 'movimiento'; tipoMov: TipoMovimiento }
  | { tipo: 'transferencia' }
  | { tipo: 'liquidar'; pago: ProximoPago }
  | { tipo: 'montoTarjeta'; pago: ProximoPago }
  | { tipo: 'cuenta' }
  | { tipo: 'editarCuenta'; cuenta: Cuenta }
  | { tipo: 'pago' }
  | { tipo: 'editarPago'; pago: ProximoPago }
  | { tipo: 'puestaAlDia' }

export function DashboardContent({ datos: datosInicial }: DashboardContentProps) {
  const [datos, setDatos] = useState(datosInicial)
  const [sheet, setSheet] = useState<SheetState | null>(null)
  const [eliminando, setEliminando] = useState<Cuenta | null>(null)
  const [eliminandoPago, setEliminandoPago] = useState<ProximoPago | null>(null)
  const [adelantandoPago, setAdelantandoPago] = useState<ProximoPago | null>(null)
  const [hoy] = useState(() => hoyLocal())
  const [guardandoHorizonte, setGuardandoHorizonte] = useState(false)
  const isMovil = useIsMobile()
  const { addToast } = useToast()

  // Fuente de verdad local: cada mutación re-consulta el dashboard.
  const actualizarDatos = async () => {
    const nuevos = await obtenerDatosDashboard()
    if (nuevos) setDatos(nuevos)
  }

  const persistirHorizonte = async (preferido: number | null, fecha: string | null) => {
    setGuardandoHorizonte(true)
    const resultado = await guardarHorizonte({ preferido, fecha })
    if (!resultado.ok) addToast(resultado.error, 'error')
    setGuardandoHorizonte(false)
    if (resultado.ok) await actualizarDatos()
  }

  const persistirIngreso = async (fecha: string | null) => {
    setGuardandoHorizonte(true)
    const resultado = await guardarProximoIngreso(fecha)
    if (!resultado.ok) addToast(resultado.error, 'error')
    setGuardandoHorizonte(false)
    if (resultado.ok) await actualizarDatos()
  }

  const cerrar = () => {
    setSheet(null)
    void actualizarDatos()
  }

  const confirmarEliminar = async () => {
    if (!eliminando) return
    const resultado = await eliminarCuenta(eliminando.cuenta_id)
    if (resultado.ok) {
      addToast('Cuenta retirada del panel', 'success')
      await actualizarDatos()
    } else {
      addToast(resultado.error, 'error')
    }
    setEliminando(null)
  }

  const confirmarEliminarPago = async () => {
    if (!eliminandoPago) return
    const resultado = await eliminarProximoPago(eliminandoPago.proximo_pago_id)
    if (resultado.ok) {
      addToast('Pago retirado', 'success')
      await actualizarDatos()
    } else {
      addToast(resultado.error, 'error')
    }
    setEliminandoPago(null)
  }

  const confirmarAdelantar = async () => {
    if (!adelantandoPago) return
    const resultado = await adelantarPeriodo(adelantandoPago.proximo_pago_id)
    if (resultado.ok) {
      addToast('Siguiente periodo adelantado', 'success')
      await actualizarDatos()
    } else {
      addToast(resultado.error, 'error')
    }
    setAdelantandoPago(null)
  }

  const abrirEdicionPago = (pago: ProximoPago) => {
    if (pago.es_tarjeta) {
      setSheet({ tipo: 'montoTarjeta', pago })
    } else {
      setSheet({ tipo: 'editarPago', pago })
    }
  }

  const horizonteControl = (
    <HorizonteControl
      horizonte={datos.horizonte}
      proximoIngreso={datos.proximoIngreso}
      guardando={guardandoHorizonte}
      onPersistirPreferido={persistirHorizonte}
      onPersistirIngreso={persistirIngreso}
    />
  )

  const propsCabecera = {
    datos,
    hoy,
    horizonteControl,
    modo: (isMovil ? 'movil' : 'escritorio') as Vista,
    onNuevoGasto: () => setSheet({ tipo: 'movimiento', tipoMov: 'egreso' }),
    onNuevoIngreso: () => setSheet({ tipo: 'movimiento', tipoMov: 'ingreso' }),
    onTransferir: () => setSheet({ tipo: 'transferencia' }),
    onNuevaCuenta: () => setSheet({ tipo: 'cuenta' }),
    onPonerAlDia: () => setSheet({ tipo: 'puestaAlDia' }),
    onEditarCuenta: (cuenta: Cuenta) => setSheet({ tipo: 'editarCuenta', cuenta }),
    onEliminarCuenta: (cuenta: Cuenta) => setEliminando(cuenta),
    onNuevoPago: () => setSheet({ tipo: 'pago' }),
    onEditarPago: abrirEdicionPago,
    onEliminarPago: (pago: ProximoPago) => setEliminandoPago(pago),
    onPagarPago: (pago: ProximoPago) => setSheet({ tipo: 'liquidar', pago }),
    onAdelantarPago: (pago: ProximoPago) => setAdelantandoPago(pago),
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
            tipo={sheet.tipoMov}
            cuentas={datos.cuentas}
            pagos={datos.pagos}
            horizonte={datos.horizonte}
            disponibleReal={datos.disponibleReal}
            hoy={hoy}
            onClose={cerrar}
          />
        )}
      </Sheet>

      <Sheet open={sheet?.tipo === 'transferencia'} title="Transferir" onClose={cerrar}>
        {sheet?.tipo === 'transferencia' && (
          <FormTransferencia cuentas={datos.cuentas} onClose={cerrar} />
        )}
      </Sheet>

      <Sheet open={sheet?.tipo === 'liquidar'} title="Liquidar Pago" onClose={cerrar}>
        {sheet?.tipo === 'liquidar' && (
          <FormLiquidar pago={sheet.pago} cuentas={datos.cuentas} onClose={cerrar} />
        )}
      </Sheet>

      <Sheet open={sheet?.tipo === 'montoTarjeta'} title="Monto del ciclo" onClose={cerrar}>
        {sheet?.tipo === 'montoTarjeta' && (
          <FormMontoTarjeta pago={sheet.pago} onClose={cerrar} />
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
            cuenta={sheet.tipo === 'editarCuenta' ? sheet.cuenta : undefined}
            onClose={cerrar}
          />
        )}
      </Sheet>

      <Sheet
        open={sheet?.tipo === 'puestaAlDia'}
        title="Poner al día"
        onClose={cerrar}
      >
        {sheet?.tipo === 'puestaAlDia' && (
          <FormPuestaAlDia
            cuentas={datos.cuentas}
            pagos={datos.pagos}
            hoy={hoy}
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
            cuentas={datos.cuentas}
            pago={sheet.tipo === 'editarPago' ? sheet.pago : undefined}
            onClose={cerrar}
          />
        )}
      </Sheet>

      <ConfirmDialog
        open={eliminando !== null}
        title="¿Retirar cuenta?"
        message={`Se retirará ${eliminando?.nombre ?? ''} de tu panel. Su historial se conserva.`}
        confirmLabel="Retirar"
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

      <ConfirmDialog
        open={adelantandoPago !== null}
        title="¿Adelantar siguiente periodo?"
        message={`Se generará el siguiente periodo de "${adelantandoPago?.descripcion ?? ''}" sin pagar el actual. Este pago seguirá pendiente.`}
        confirmLabel="Adelantar"
        cancelLabel="Cancelar"
        onConfirm={confirmarAdelantar}
        onCancel={() => setAdelantandoPago(null)}
      />
    </>
  )
}
