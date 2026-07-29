'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import LinearProgress from '@mui/material/LinearProgress'

type Props = {
  /** Porcentaje final (0–100). */
  value: number
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary'
}

/**
 * Barra que crece desde 0 hasta su valor al entrar en pantalla.
 * Accesibilidad: con prefers-reduced-motion aparece directamente en su valor.
 */
const BarraEntra = ({ value, color = 'primary' }: Props) => {
  const [v, setV] = useState(0)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setV(value)

      return
    }

    const id = requestAnimationFrame(() => setV(value))

    return () => cancelAnimationFrame(id)
  }, [value])

  return <LinearProgress variant='determinate' value={v} color={color} />
}

export default BarraEntra
