'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

// Component Imports
import DataGate from '@/components/dashboard/DataGate'
import StatCard from '@/components/dashboard/StatCard'

// Data Imports
import { fmt, fmtCorto, fmtFecha } from '@/lib/data'
import type { PanelData } from '@/lib/data'

/** Resumen del estado en lenguaje llano, generado de los datos (sin IA en tiempo real). */
function fraseEstado(data: PanelData): string {
  const { overview } = data
  const partes: string[] = []
  const cronsOk = overview.crons.length - overview.crons_en_error
  const saludOk = (overview.salud_global ?? '').includes('🟢')

  if (saludOk && overview.crons_en_error === 0) {
    partes.push('Hoy el sistema respira tranquilo')
  } else if (saludOk) {
    partes.push('Hoy el sistema va bien, con un deber pendiente')
  } else {
    partes.push('Hoy el sistema pide atención')
  }

  partes.push(`${cronsOk} de ${overview.crons.length} rutinas al día`)
  if (overview.gateways?.length) partes.push(`${overview.gateways.length} puertas de entrada abiertas`)
  const problemas = overview.healthcheck?.problemas ?? 0
  if (problemas > 0) partes.push(`${problemas} aviso${problemas === 1 ? '' : 's'} menor${problemas === 1 ? '' : 'es'} en el motor`)
  const propuestas = overview.gtd.propuestas ?? 0
  if (propuestas > 0) {
    partes.push(`y ${propuestas} propuestas del clon esperan el sí o el no de Miguel`)
  }

  return partes.join(', ') + '.'
}

const PASOS = [
  {
    icon: 'ri-inbox-line',
    titulo: 'Captura',
    texto: 'Todo lo que llega — correos, WhatsApp, notas, citas — entra en una bandeja única. Nada se pierde: cada cosa queda clasificada o esperando su turno.'
  },
  {
    icon: 'ri-brain-line',
    titulo: 'Piensa',
    texto: 'Un consejo de varios modelos de IA (GPT, Grok, Kimi, GLM…) contrasta opiniones antes de proponer nada. Las decisiones importantes siempre las toma el humano.'
  },
  {
    icon: 'ri-hand-heart-line',
    titulo: 'Actúa',
    texto: 'Prepara borradores, persigue respuestas que se deben, monta dossieres y deja las propuestas listas para que Miguel solo tenga que decir sí o no.'
  },
  {
    icon: 'ri-line-chart-line',
    titulo: 'Se mide',
    texto: 'Cada noche se audita a sí mismo: cuánto gasta, cuánto falla, si hoy es mejor que ayer. Los números de este panel son esa autoauditoría, en directo.'
  }
]

const InicioPage = () => (
  <DataGate>
    {data => {
      const { overview, tokens, clones, manifest } = data
      const saludOk = (overview.salud_global ?? '').includes('🟢')

      return (
        <Grid container spacing={6}>
          {/* Bienvenida */}
          <Grid size={12}>
            <Card>
              <CardContent className='flex flex-col gap-3'>
                <div className='flex flex-wrap items-center gap-3'>
                  <Typography variant='h4'>La sala de control del Clon de MAD</Typography>
                  <Chip
                    size='small'
                    color={saludOk ? 'success' : 'warning'}
                    variant='tonal'
                    icon={<i className={saludOk ? 'ri-checkbox-circle-line' : 'ri-alert-line'} />}
                    label={overview.salud_global?.replace(/[🟢🟡🔴]/g, '').trim() || '—'}
                  />
                </div>
                <Typography color='text.secondary' className='max-is-3xl'>
                  Un equipo de inteligencia artificial que trabaja mientras Miguel vive su vida: lee el correo,
                  clasifica lo importante, prepara decisiones, vigila el patrimonio y se mejora a sí mismo cada noche.
                  Esta web es su cuadro de mandos — los mismos números que ve él, explicados para personas.
                </Typography>
                <Card variant='outlined' className='border-success'>
                  <CardContent className='flex items-start gap-3'>
                    <i className='ri-double-quotes-l text-2xl text-success' />
                    <Typography fontWeight={500}>{fraseEstado(data)}</Typography>
                  </CardContent>
                </Card>
                <Typography variant='caption' color='text.disabled' className='font-mono'>
                  datos generados el {fmtFecha(manifest.generado)} · solo cifras agregadas, sin información personal
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Cifras de cabecera */}
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              icon='ri-token-swap-line'
              valor={fmtCorto(tokens.contador.ventana_30d)}
              label='trabajo de IA en 30 días'
              detalle={`${fmt(tokens.contador.ventana_30d)} tokens`}
              color='primary'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              icon='ri-robot-2-line'
              valor={String(clones.clones.length)}
              label='clones con oficio propio'
              detalle='+ el motor de automejora'
              color='success'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              icon='ri-heart-pulse-line'
              valor={String(overview.gateways?.length ?? '—')}
              label='gateways vivos'
              detalle='canales de comunicación'
              color='info'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              icon='ri-calendar-check-line'
              valor={`${overview.crons.length - overview.crons_en_error}/${overview.crons.length}`}
              label='rutinas automáticas en verde'
              detalle={overview.crons_en_error > 0 ? `${overview.crons_en_error} en error` : 'todas al día'}
              color={overview.crons_en_error > 0 ? 'warning' : 'success'}
            />
          </Grid>

          {/* Qué es */}
          <Grid size={12}>
            <Typography variant='h5' className='mbe-1'>¿Qué es esto, en cuatro ideas?</Typography>
            <Typography color='text.secondary'>No hace falta saber lo que es un «second brain». Basta con esto:</Typography>
          </Grid>
          {PASOS.map((p, i) => (
            <Grid key={p.titulo} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card className='bs-full'>
                <CardContent className='flex flex-col gap-2'>
                  <div className='flex items-center justify-between'>
                    <i className={`${p.icon} text-3xl text-primary`} />
                    <Typography variant='caption' color='text.disabled' className='font-mono'>0{i + 1}</Typography>
                  </div>
                  <Typography variant='h6'>{p.titulo}</Typography>
                  <Typography variant='body2' color='text.secondary'>{p.texto}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )
    }}
  </DataGate>
)

export default InicioPage
