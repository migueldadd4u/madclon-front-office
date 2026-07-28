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

// Hook Imports
import { useLang } from '@/lib/i18n'

// Data Imports
import { fmt } from '@/lib/data'

const ActividadPage = () => {
  const { t } = useLang()

  return (
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
            <Typography variant='h4' className='mbe-1'>{t('act_titulo')}</Typography>
            <Typography color='text.secondary' className='max-is-2xl'>
              {t('act_intro')}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              icon='ri-vote-line'
              valor={fmt(gtd.propuestas)}
              label={t('act_propuestas')}
              color='warning'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard icon='ri-inbox-line' valor={fmt(gtd.bandeja)} label={t('act_bandeja')} color='info' />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              icon='ri-hourglass-line'
              valor={fmt(gtd.esperas_vencidas)}
              label={t('act_esperas')}
              color={(gtd.esperas_vencidas ?? 0) > 0 ? 'error' : 'success'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              icon='ri-list-check-3'
              valor={fmt(gtd.decisiones)}
              label={t('act_decisiones')}
              color='secondary'
            />
          </Grid>

          {/* Automejora */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card className='bs-full'>
              <CardHeader
                title={t('act_motor')}
                subheader={`${t('act_motor_sub_1')} ${automejora.metered} tokens`}
                avatar={
                  <CustomAvatar color='primary' skin='light' variant='rounded'>
                    <i className='ri-settings-5-line' />
                  </CustomAvatar>
                }
              />
              <CardContent className='flex flex-col gap-3'>
                {[
                  { label: t('act_hechas'), valor: automejora.hechas, color: 'success' as const },
                  { label: t('act_pendientes'), valor: automejora.pendientes, color: 'info' as const },
                  { label: t('act_aparcadas'), valor: automejora.aparcadas, color: 'secondary' as const },
                  { label: t('act_bloqueadas'), valor: automejora.bloqueadas, color: 'error' as const }
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
                  {fmt(automejora.llamadas)} {t('act_llamadas_consejo')}: {automejora.top}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Personas */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card className='bs-full'>
              <CardHeader
                title={t('act_personas')}
                subheader={t('act_personas_sub')}
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
                    <Typography variant='body2' color='text.secondary'>{t('act_fichas')}</Typography>
                  </div>
                  <div>
                    <Typography variant='h3' className='font-mono' color='warning.main'>{fmt(personas.staged)}</Typography>
                    <Typography variant='body2' color='text.secondary'>{t('act_staged')}</Typography>
                  </div>
                </div>
                <Typography variant='body2' color='text.secondary'>
                  {t('act_personas_texto')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )
    }}
  </DataGate>
  )
}

export default ActividadPage
