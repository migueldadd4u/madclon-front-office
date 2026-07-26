'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import CustomAvatar from '@core/components/mui/Avatar'

// Component Imports
import DataGate from '@/components/dashboard/DataGate'
import StatCard from '@/components/dashboard/StatCard'

// Data Imports
import { fmt } from '@/lib/data'

const ActividadPage = () => (
  <DataGate>
    {({ overview }) => {
      const { gtd, automejora, personas } = overview
      const colaTotal = Math.max(
        automejora.hechas + automejora.bloqueadas + automejora.aparcadas + automejora.pendientes,
        1
      )

      return (
        <Grid container spacing={6}>
          <Grid size={12}>
            <Typography variant='h4' className='mbe-1'>¿Qué espera de Miguel ahora mismo?</Typography>
            <Typography color='text.secondary' className='max-is-2xl'>
              El clon prepara; el humano decide. Esto es lo que hay encima de la mesa — solo cantidades,
              el contenido vive a salvo en el vault privado.
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              icon='ri-vote-line'
              valor={fmt(gtd.propuestas)}
              label='propuestas esperando el sí o el no'
              color='warning'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard icon='ri-inbox-line' valor={fmt(gtd.bandeja)} label='capturas sin clasificar' color='info' />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              icon='ri-hourglass-line'
              valor={fmt(gtd.esperas_vencidas)}
              label='respuestas de terceros vencidas'
              color={(gtd.esperas_vencidas ?? 0) > 0 ? 'error' : 'success'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              icon='ri-list-check-3'
              valor={fmt(gtd.decisiones)}
              label='decisiones abiertas del sistema'
              color='secondary'
            />
          </Grid>

          {/* Automejora */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card className='bs-full'>
              <CardHeader
                title='El motor que se mejora solo · 7 días'
                subheader={`cada noche se autoaudita y propone mejoras · coste en factura variable: ${automejora.metered} tokens`}
                avatar={
                  <CustomAvatar color='primary' skin='light' variant='rounded'>
                    <i className='ri-settings-5-line' />
                  </CustomAvatar>
                }
              />
              <CardContent className='flex flex-col gap-3'>
                {[
                  { label: 'mejoras completadas', valor: automejora.hechas, color: 'success' as const },
                  { label: 'pendientes', valor: automejora.pendientes, color: 'info' as const },
                  { label: 'aparcadas', valor: automejora.aparcadas, color: 'secondary' as const },
                  { label: 'bloqueadas', valor: automejora.bloqueadas, color: 'error' as const }
                ].map(f => (
                  <div key={f.label}>
                    <div className='flex justify-between mbe-1'>
                      <Typography variant='body2' color='text.secondary'>{f.label}</Typography>
                      <Typography variant='body2' className='font-mono'>{f.valor}</Typography>
                    </div>
                    <LinearProgress variant='determinate' value={(f.valor / colaTotal) * 100} color={f.color} />
                  </div>
                ))}
                <Typography variant='caption' color='text.secondary'>
                  {fmt(automejora.llamadas)} llamadas al consejo de modelos · reparto: {automejora.top}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Personas */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card className='bs-full'>
              <CardHeader
                title='La memoria de las personas'
                subheader='fichas curadas de la red de contactos — quien es quién, de qué se habló, qué se debe'
                avatar={
                  <CustomAvatar color='success' skin='light' variant='rounded'>
                    <i className='ri-team-line' />
                  </CustomAvatar>
                }
              />
              <CardContent className='flex flex-col gap-4'>
                <div className='flex items-end gap-8'>
                  <div>
                    <Typography variant='h2' className='font-mono'>{fmt(personas.fichas_curadas)}</Typography>
                    <Typography variant='body2' color='text.secondary'>fichas curadas</Typography>
                  </div>
                  <div>
                    <Typography variant='h3' className='font-mono' color='warning.main'>{fmt(personas.staged)}</Typography>
                    <Typography variant='body2' color='text.secondary'>esperando revisión humana</Typography>
                  </div>
                </div>
                <Typography variant='body2' color='text.secondary'>
                  Cada ficha pasa por un control de calidad: la IA propone, pero fusionar o dar por buena una
                  identidad exige evidencia. Nadie entra en la memoria por la puerta de atrás.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )
    }}
  </DataGate>
)

export default ActividadPage
