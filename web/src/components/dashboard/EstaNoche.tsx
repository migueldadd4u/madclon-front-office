'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

// Hook Imports
import { useLang } from '@/lib/i18n'

// Data Imports
import { fmt, fmtCorto } from '@/lib/data'
import type { PanelData } from '@/lib/data'

// «El clon te cuenta su noche» — franja en lenguaje llano con lo que hizo el
// sistema en la última noche medida (último punto de serie.json): cuánto pensó,
// cuántas tareas terminó y cómo amaneció. Solo cifras agregadas ya públicas.
// Sin animación: el wow es que la máquina te lo cuente en primera persona.

const reemplaza = (plantilla: string, valores: Record<string, string>) =>
  Object.entries(valores).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, v), plantilla)

const EstaNoche = ({ data }: { data: PanelData }) => {
  const { lang, t } = useLang()
  const ultimo = data.serie.serie.at(-1)

  if (!ultimo?.contexto) return null

  const tokens = fmtCorto(ultimo.contexto.tokens ?? 0)
  const llamadas = fmt(ultimo.contexto.llamadas ?? 0)
  const tareas = fmt(ultimo.contexto.tareas_hechas ?? 0)
  const saludRaw = data.overview.salud_global ?? ''

  const salud = saludRaw.includes('🟢')
    ? t('noche_salud_verde')
    : saludRaw.includes('🟡')
      ? t('noche_salud_ambar')
      : t('noche_salud_rojo')

  const fecha = new Date(ultimo.fecha).toLocaleDateString(lang === 'en' ? 'en-GB' : 'es-ES', {
    day: 'numeric',
    month: 'long'
  })

  return (
    <Card
      variant='outlined'
      sx={{
        borderColor: 'primary.main',
        background: theme =>
          `linear-gradient(120deg, ${theme.palette.primary.main}14 0%, #06C9A814 100%)`
      }}
    >
      <CardContent className='flex flex-col gap-3'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <i className='ri-moon-clear-line text-2xl text-primary' aria-hidden='true' />
            <Typography variant='h6'>{t('noche_titulo')}</Typography>
          </div>
          <Typography variant='caption' color='text.disabled'>
            {reemplaza(t('noche_caption'), { fecha })}
          </Typography>
        </div>
        <Typography fontWeight={500} className='max-is-3xl'>
          {reemplaza(t('noche_frase'), { tokens, llamadas, tareas, salud })}
        </Typography>
        <div className='flex flex-wrap gap-2'>
          <Chip
            size='small'
            variant='tonal'
            color='primary'
            icon={<i className='ri-brain-line' />}
            label={reemplaza(t('noche_chip_tokens'), { tokens })}
          />
          <Chip
            size='small'
            variant='tonal'
            color='success'
            icon={<i className='ri-task-line' />}
            label={reemplaza(t('noche_chip_tareas'), { tareas })}
          />
          <Chip
            size='small'
            variant='tonal'
            color='info'
            icon={<i className='ri-exchange-line' />}
            label={reemplaza(t('noche_chip_llamadas'), { llamadas })}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default EstaNoche
