'use client'

// React Imports
import { useCallback, useEffect, useRef, useState } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'

// Component Imports
import MadClonLogoAnimado from '@/components/dashboard/MadClonLogoAnimado'

// Hook Imports
import { useLang } from '@/lib/i18n'

// Data Imports
import { fmt, fmtCorto } from '@/lib/data'
import type { PanelData } from '@/lib/data'

type Props = { data: PanelData; diasVida: number }

/**
 * Easter egg «consola» — 5 clics (o Entrar ×5) sobre el logo de la portada
 * abren una vista tipo terminal con el pulso del sistema en directo.
 * Solo cifras ya públicas; efecto máquina de escribir desactivado
 * con prefers-reduced-motion.
 */
const ConsolaClon = ({ data, diasVida }: Props) => {
  const { lang, t } = useLang()
  const [clics, setClics] = useState(0)
  const [abierta, setAbierta] = useState(false)
  const [lineasVisibles, setLineasVisibles] = useState(0)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { overview, tokens } = data
  const cronsOk = overview.crons.length - overview.crons_en_error

  const lineas: string[] = [
    '$ madclon --pulso',
    `${t('consola_dias')}: ${fmt(diasVida)}`,
    `${t('consola_trabajo')}: ${fmtCorto(tokens.contador.ventana_30d)} · ${fmt(tokens.contador.medido_llamadas)} ${t('tokens_llamadas')}`,
    `${t('consola_rutinas')}: ${cronsOk}/${overview.crons.length} ${t('consola_verde')}`,
    `${t('consola_gateways')}: ${overview.gateways?.length ?? '—'}`,
    `${t('consola_cobertura')}: ${tokens.contador.cobertura_pct ?? '—'} %`,
    `${t('consola_propuestas')}: ${fmt(overview.gtd.propuestas)}`,
    `${t('consola_salud')}: ${overview.salud_global?.replace(/[🟢🟡🔴]/g, '').trim() || '—'}`,
    `${t('consola_cierra')}`
  ]

  const registrarClic = useCallback(() => {
    if (temporizador.current) clearTimeout(temporizador.current)
    setClics(n => {
      const siguiente = n + 1

      if (siguiente >= 5) {
        setAbierta(true)

        return 0
      }
      temporizador.current = setTimeout(() => setClics(0), 1600)

      return siguiente
    })
  }, [])

  // Efecto máquina de escribir al abrir
  useEffect(() => {
    if (!abierta) {
      setLineasVisibles(0)

      return
    }
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (quieto) {
      setLineasVisibles(lineas.length)

      return
    }
    setLineasVisibles(1)
    let i = 1
    const id = setInterval(() => {
      i += 1
      setLineasVisibles(i)
      if (i >= lineas.length) clearInterval(id)
    }, 240)

    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierta])

  return (
    <>
      <Box
        component='button'
        type='button'
        onClick={registrarClic}
        aria-label={t('consola_logo_alt')}
        sx={{
          p: 0,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          borderRadius: '14px',
          lineHeight: 0,
          transition: 'transform .15s ease',
          '&:active': { transform: 'scale(.92)' },
          '&:focus-visible': { outline: '2px solid var(--mui-palette-primary-main)', outlineOffset: 3 }
        }}
      >
        <MadClonLogoAnimado size={52} />
      </Box>
      <Dialog
        open={abierta}
        onClose={() => setAbierta(false)}
        maxWidth='sm'
        fullWidth
        aria-label={t('consola_titulo')}
        PaperProps={{
          sx: {
            bgcolor: '#0d1117',
            border: '1px solid rgba(122, 127, 255, .35)',
            borderRadius: '12px',
            overflow: 'hidden'
          }
        }}
      >
        {/* barra de ventana */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.25, bgcolor: 'rgba(255,255,255,.04)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <Box sx={{ width: 11, height: 11, borderRadius: '50%', bgcolor: '#ff5f57' }} aria-hidden />
          <Box sx={{ width: 11, height: 11, borderRadius: '50%', bgcolor: '#febc2e' }} aria-hidden />
          <Box sx={{ width: 11, height: 11, borderRadius: '50%', bgcolor: '#28c840' }} aria-hidden />
          <Box component='span' sx={{ ml: 1.5, color: 'rgba(255,255,255,.55)', fontSize: 12, fontFamily: 'monospace' }}>
            {t('consola_titulo')}
          </Box>
        </Box>
        <Box
          component='pre'
          sx={{
            m: 0,
            p: 3,
            minHeight: 280,
            color: '#7ee787',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: { xs: 12.5, sm: 14 },
            lineHeight: 2,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {lineas.slice(0, lineasVisibles).map((l, i) => (
            <div key={i} style={i === 0 ? { background: 'linear-gradient(90deg,#7A7FFF,#06C9A8)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', fontWeight: 700 } : undefined}>
              {l}
            </div>
          ))}
          {lineasVisibles >= lineas.length && (
            <span aria-hidden style={{ display: 'inline-block', width: 9, height: 18, background: '#7ee787', verticalAlign: 'text-bottom', animation: 'consola-cursor 1.1s steps(1) infinite' }} />
          )}
        </Box>
        <style>{`
          @keyframes consola-cursor { 50% { opacity: 0; } }
          @media (prefers-reduced-motion: reduce) { [style*="consola-cursor"] { animation: none !important; } }
        `}</style>
      </Dialog>
    </>
  )
}

export default ConsolaClon
