'use client'

// React Imports
import { useEffect, useState } from 'react'

type Props = {

  /** Valor final al que llega el contador. null/undefined muestra '—' sin animar. */
  to: number | null | undefined

  /** Formateador del número en cada frame (por defecto, entero con separador es-ES). */
  format?: (n: number) => string

  /** Duración de la animación en ms. */
  duration?: number
}

const nf = new Intl.NumberFormat('es-ES')

/** easeOutCubic: arranque vivo y aterrizaje suave. */
const ease = (x: number): number => 1 - Math.pow(1 - x, 3)

/**
 * Contador animado: el número sube desde 0 hasta su valor real al aparecer.
 * Accesibilidad: si el usuario pide menos movimiento (prefers-reduced-motion),
 * muestra el valor final directamente, sin animación.
 */
const CountUp = ({ to, format, duration = 1400 }: Props) => {
  const fmt = format ?? ((n: number) => nf.format(Math.round(n)))
  const final = to === null || to === undefined || Number.isNaN(to) ? null : to
  const [valor, setValor] = useState<number | null>(null)

  useEffect(() => {
    if (final === null) return

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValor(final)

      return
    }

    let raf = 0
    const t0 = performance.now()

    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)

      setValor(final * ease(p))
      if (p < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(raf)
  }, [final, duration])

  const texto = final === null ? '—' : fmt(valor === null ? 0 : valor)

  return (
    <span aria-label={final === null ? undefined : fmt(final)}>
      {texto}
    </span>
  )
}

export default CountUp
