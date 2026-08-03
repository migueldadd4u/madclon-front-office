'use client'

// React Imports
import { useEffect, useRef, useState } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

// Hook Imports
import { usePublicLang } from '@/lib/public-i18n'
import type { StrKey } from '@/lib/public-i18n'

// Atajos de teclado — «g» seguida de una letra navega a cada sección; «?» abre
// la ayuda. Nunca actúa dentro de campos de texto ni con modificadores, para no
// estorbar a quien escribe. El modal es un Dialog MUI estándar (foco atrapado,
// Esc para cerrar). La ayuda se descubre con el botón de la cabecera.

const ATAJOS: { teclas: string; ruta: string; label: StrKey }[] = [
  { teclas: 'g h', ruta: '/', label: 'nav_panel' },
  { teclas: 'g f', ruta: '/flota', label: 'nav_flota' },
  { teclas: 'g s', ruta: '/salud', label: 'nav_salud' },
  { teclas: 'g t', ruta: '/tokens', label: 'nav_tokens' },
  { teclas: 'g e', ruta: '/eficiencia', label: 'nav_eficiencia' },
  { teclas: 'g a', ruta: '/actividad', label: 'nav_actividad' },
  { teclas: 'g r', ruta: '/historia', label: 'nav_historia' },
  { teclas: 'g p', ruta: '/preguntas', label: 'nav_preguntas' }
]

const esCampoTexto = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)

const AtajosTeclado = () => {
  const { t } = usePublicLang()
  const router = useRouter()
  const [ayuda, setAyuda] = useState(false)
  const armado = useRef(0)

  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || esCampoTexto(e.target)) return

      const ahora = Date.now()

      if (e.key === 'g') {
        armado.current = ahora

        return
      }

      if (e.key === '?') {
        e.preventDefault()
        setAyuda(a => !a)

        return
      }

      if (ahora - armado.current < 1000) {
        armado.current = 0

        const destino = ATAJOS.find(a => a.teclas === `g ${e.key.toLowerCase()}`)

        if (destino) {
          e.preventDefault()
          router.push(destino.ruta)
        }
      }
    }

    window.addEventListener('keydown', alPulsar)

    return () => window.removeEventListener('keydown', alPulsar)
  }, [router])

  return (
    <>
      <IconButton aria-label={t('atajos_boton')} onClick={() => setAyuda(true)} size='small' color='inherit'>
        <i className='ri-keyboard-line text-xl' />
      </IconButton>
      <Dialog open={ayuda} onClose={() => setAyuda(false)} aria-labelledby='atajos-titulo' maxWidth='xs' fullWidth>
        <DialogTitle id='atajos-titulo'>{t('atajos_titulo')}</DialogTitle>
        <DialogContent className='flex flex-col gap-4'>
          <Typography variant='body2' color='text.secondary'>
            {t('atajos_sub')}
          </Typography>
          <div className='flex flex-col gap-2'>
            {ATAJOS.map(a => (
              <div key={a.teclas} className='flex items-center justify-between gap-4'>
                <Typography variant='body2'>{t(a.label)}</Typography>
                <kbd
                  className='font-mono text-xs rounded-md'
                  style={{
                    border: '1px solid var(--mui-palette-divider)',
                    borderBottomWidth: 2,
                    padding: '2px 8px',
                    color: 'var(--mui-palette-text-secondary)'
                  }}
                >
                  {a.teclas}
                </kbd>
              </div>
            ))}
            <div className='flex items-center justify-between gap-4'>
              <Typography variant='body2'>{t('atajos_ayuda_fila')}</Typography>
              <kbd
                className='font-mono text-xs rounded-md'
                style={{
                  border: '1px solid var(--mui-palette-divider)',
                  borderBottomWidth: 2,
                  padding: '2px 8px',
                  color: 'var(--mui-palette-text-secondary)'
                }}
              >
                ?
              </kbd>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default AtajosTeclado
