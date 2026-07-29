'use client'

// MUI Imports
import Box from '@mui/material/Box'

// Punto vivo — puntito verde pulsante (el latido mínimo del sistema).
// Decorativo (aria-hidden): el estado real siempre va también en texto.
// Quieto con prefers-reduced-motion.
const PuntoVivo = ({ size = 9 }: { size?: number }) => (
  <Box
    component='span'
    aria-hidden
    sx={{
      width: size,
      height: size,
      borderRadius: '50%',
      bgcolor: 'success.main',
      flexShrink: 0,
      boxShadow: '0 0 0 0 var(--mui-palette-success-main)',
      animation: 'latido-pulso 1.8s ease-out infinite',
      '@keyframes latido-pulso': {
        '0%': { boxShadow: '0 0 0 0 rgba(86, 202, 118, 0.55)' },
        '70%': { boxShadow: '0 0 0 9px rgba(86, 202, 118, 0)' },
        '100%': { boxShadow: '0 0 0 0 rgba(86, 202, 118, 0)' }
      },
      '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
    }}
  />
)

export default PuntoVivo
