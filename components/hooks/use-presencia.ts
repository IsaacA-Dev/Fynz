'use client'

import { useEffect, useState } from 'react'

export function usePresencia(abierta: boolean, salidaMs = 250): boolean {
  const [desmontado, setDesmontado] = useState(!abierta)
  const presente = abierta || !desmontado

  useEffect(() => {
    const tiempo = setTimeout(
      () => setDesmontado(!abierta),
      abierta ? 0 : salidaMs
    )
    return () => clearTimeout(tiempo)
  }, [abierta, salidaMs])

  return presente
}
