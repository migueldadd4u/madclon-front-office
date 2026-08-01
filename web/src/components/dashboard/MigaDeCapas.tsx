'use client'

// MigaDeCapas — la cabecera fija de cualquier capa que se abra sobre otra.
//
// Regla de la casa (REGLAS-COPY.md §4): *ninguna capa puede ser una trampa*.
// Toda capa tiene que decir, sin que haya que buscarlo:
//   1. dónde estoy      → migas de pan, con la capa superior PULSABLE de verdad
//   2. de quién es esto → distintivo de dueño (color + icono), pegado arriba al hacer scroll
//   3. cómo subo        → botón «volver», que hace lo mismo que Esc y que el gesto de atrás
//   4. cómo me muevo    → «← anterior / siguiente →» entre hermanos, con flechas de teclado
//
// Es reutilizable a propósito: si algún día hay una capa 3, se monta con esto.

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

import CustomAvatar from '@core/components/mui/Avatar'

import { useLang } from '@/lib/i18n'

type Color = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary'

type Props = {

  /** Nombre de la capa superior, la que sigue viva detrás (p. ej. «Flota»). */
  superior: string

  /** Nombre de lo que se está mirando en esta capa (p. ej. «Patrimonio»). */
  actual: string

  /** Icono y color de marca del dueño de esta capa. */
  icono: string
  color: Color

  /** Subir a la capa superior. Lo mismo que Esc y que el gesto de atrás. */
  alSubir: () => void

  /** Movimiento lateral entre hermanos de la misma capa. */
  alAnterior?: () => void
  alSiguiente?: () => void
  posicion?: { i: number; total: number }
}

const MigaDeCapas = ({ superior, actual, icono, color, alSubir, alAnterior, alSiguiente, posicion }: Props) => {
  const { t } = useLang()
  const pos = posicion ? t('capa_posicion').replace('{i}', String(posicion.i)).replace('{total}', String(posicion.total)) : ''

  return (
    <Box
      data-distintivo-capa
      sx={{
        position: 'sticky',
        insetBlockStart: 0,
        zIndex: 2,
        backgroundColor: 'var(--mui-palette-background-paper)',
        borderBlockEnd: '1px solid var(--mui-palette-divider)',
        paddingBlock: 2,
        paddingInline: { xs: 4, sm: 6 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}
    >
      {/* 1 · dónde estoy — la capa superior es un botón de verdad, no una «✕» */}
      <nav data-migas aria-label={t('capa_migas_aria')}>
        <ol className='flex items-center gap-2 flex-wrap' style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          <li>
            <Button
              size='small'
              variant='text'
              onClick={alSubir}
              startIcon={<i className='ri-arrow-left-line' />}
              sx={{ minBlockSize: 44, paddingInline: 2, color: 'text.primary', '& i': { color: 'primary.light' } }}
            >
              {superior} <span className='mis-1 font-normal'>· {t('capa_1')}</span>
            </Button>
          </li>
          <li aria-hidden>
            <i className='ri-arrow-right-s-line' />
          </li>
          <li>
            <Typography variant='body2' component='span' aria-current='page' className='font-medium'>
              {actual} <span className='font-normal'>· {t('capa_2')}</span>
            </Typography>
          </li>
        </ol>
      </nav>

      {/* 2 · de quién es esto — viaja con el scroll, siempre a la vista */}
      <div className='flex items-center gap-3 flex-wrap'>
        <CustomAvatar color={color} skin='light' size={38} variant='rounded'>
          <i className={`${icono} text-xl`} />
        </CustomAvatar>
        <div className='flex-auto min-is-0'>
          <Typography variant='h6' component='p' className='capitalize'>
            {actual}
          </Typography>
          {pos && (
            <Typography variant='caption' color='text.secondary'>
              {pos}
            </Typography>
          )}
        </div>
        <Chip size='small' variant='tonal' color={color} label={t('capa_2')} />
        <IconButton aria-label={t('anat_cerrar')} onClick={alSubir} sx={{ minInlineSize: 44, minBlockSize: 44 }}>
          <i className='ri-close-line text-xl' />
        </IconButton>
      </div>

      {/* 4 · cómo me muevo en horizontal — sin pasar por la capa 1 */}
      {alAnterior && alSiguiente && (
        <div data-capa-lateral className='flex flex-col gap-1'>
          <div className='flex items-center justify-between gap-2'>
            <Button
              size='small'
              variant='outlined'
              onClick={alAnterior}
              startIcon={<i className='ri-arrow-left-s-line' />}
              sx={{ minBlockSize: 44, color: 'text.primary', borderColor: 'primary.light', '& i': { color: 'primary.light' } }}
            >
              {t('capa_anterior')}
            </Button>
            <Button
              size='small'
              variant='outlined'
              onClick={alSiguiente}
              endIcon={<i className='ri-arrow-right-s-line' />}
              sx={{ minBlockSize: 44, color: 'text.primary', borderColor: 'primary.light', '& i': { color: 'primary.light' } }}
            >
              {t('capa_siguiente')}
            </Button>
          </div>
          <Typography variant='caption' color='text.secondary' align='center' className='fo-no-print'>
            {t('capa_lateral_pista')}
          </Typography>
        </div>
      )}
    </Box>
  )
}

export default MigaDeCapas
