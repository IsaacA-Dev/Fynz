'use client'

import { useEffect, useRef, useState } from 'react'
import { useAnime } from '@/components/hooks/use-anime'
import { formatearDinero } from '@/lib/utils/format'
import type { DuracionToken } from '@/lib/motion'

interface NumeroAnimadoProps {
  valor: number
  formato?: (valor: number) => string
  duracion?: DuracionToken | number
  delay?: number
  className?: string
}

interface ProxyValor {
  valor: number
}

export function NumeroAnimado({
  valor,
  formato = formatearDinero,
  duracion,
  delay = 0,
  className,
}: NumeroAnimadoProps) {
  const { animar, reducirMovimiento } = useAnime()
  const [mostrado, setMostrado] = useState(valor)
  const previoRef = useRef(valor)

  useEffect(() => {
    const previo = previoRef.current
    previoRef.current = valor

    if (reducirMovimiento || previo === valor) {
      setMostrado(valor)
      return
    }

    const proxy: ProxyValor = { valor: previo }
    animar(proxy, {
      duracion,
      delay,
      valor,
      onUpdate: () => setMostrado(proxy.valor),
    })
  }, [valor, duracion, delay, animar, reducirMovimiento])

  return <span className={className}>{formato(mostrado)}</span>
}
