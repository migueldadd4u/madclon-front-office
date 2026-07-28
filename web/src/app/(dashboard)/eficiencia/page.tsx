'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

// Third-party Imports
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// Component Imports
import DataGate from '@/components/dashboard/DataGate'

// Hook Imports
import { useLang } from '@/lib/i18n'

// Data Imports
import { fmt } from '@/lib/data'

const colorVariacion = (estado: string): 'success' | 'error' | 'warning' | 'default' =>
  estado.includes('🟢') ? 'success' : estado.includes('🔴') ? 'error' : estado.includes('🟡') ? 'warning' : 'default'

const EficienciaPage = () => {
  const { t } = useLang()
  const GRUPOS = [
    { clave: 'eficiencia' as const, titulo: t('ef_g1'), sub: t('ef_g1_sub') },
    { clave: 'eficacia' as const, titulo: t('ef_g2'), sub: t('ef_g2_sub') },
    { clave: 'honestidad' as const, titulo: t('ef_g3'), sub: t('ef_g3_sub') }
  ]

  return (
  <DataGate>
    {({ tokens, serie }) => {
      const puntos = serie.serie.map(p => ({
        fecha: p.fecha.slice(5),
        indice: p.kpis?.tokens_motor_por_tarea ?? null
      }))

      return (
        <Grid container spacing={6}>
          <Grid size={12}>
            <Typography variant='h4' className='mbe-1'>{t('ef_titulo')}</Typography>
            <Typography color='text.secondary' className='max-is-3xl'>
              {t('ef_intro_1')} {tokens.linea_base_fecha ?? '—'} {t('ef_intro_2')}
            </Typography>
            {tokens.soporte && (
              <Typography variant='caption' color='text.disabled' className='font-mono'>
                {t('ef_soporte')}: {tokens.soporte}
              </Typography>
            )}
          </Grid>

          {GRUPOS.map(g => (
            <Grid key={g.clave} size={12}>
              <Typography variant='h5' className='mbe-1'>
                {g.titulo} <Typography component='span' variant='body2' color='text.secondary'>· {g.sub}</Typography>
              </Typography>
              <Grid container spacing={4} className='mbs-2'>
                {tokens.kpis[g.clave].map(k => (
                  <Grid key={k.nombre} size={{ xs: 12, sm: 6, lg: 3 }}>
                    <Card className='bs-full' title={k.significado}>
                      <CardContent className='flex flex-col gap-1'>
                        <div className='flex items-start justify-between gap-2'>
                          <Typography variant='body2' fontWeight={600}>{k.nombre}</Typography>
                          <Chip
                            size='small'
                            color={colorVariacion(k.estado)}
                            variant='tonal'
                            label={k.variacion}
                            className='font-mono'
                          />
                        </div>
                        <Typography variant='h4' className='font-mono'>{k.ahora}</Typography>
                        <Typography variant='caption' color='text.disabled' className='font-mono'>{t('ef_base')}: {k.base}</Typography>
                        <Typography variant='caption' color='text.secondary' className='line-clamp-3'>{k.significado}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          ))}

          {/* Serie + intervenciones */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card className='bs-full'>
              <CardHeader
                title={t('ef_indice')}
                subheader={t('ef_indice_sub')}
              />
              <CardContent>
                {puntos.length >= 2 ? (
                  <div className='bs-56'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <AreaChart data={puntos} margin={{ left: 0, right: 8 }}>
                        <XAxis
                          dataKey='fecha'
                          tick={{ fill: 'var(--mui-palette-text-secondary)', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis hide domain={['dataMin', 'dataMax']} />
                        <Tooltip
                          contentStyle={{
                            background: 'var(--mui-palette-background-paper)',
                            border: '1px solid var(--mui-palette-divider)',
                            borderRadius: 8
                          }}
                          formatter={(v: number) => [fmt(v), 'tokens/tarea']}
                        />
                        <Area
                          type='monotone'
                          dataKey='indice'
                          stroke='var(--mui-palette-primary-main)'
                          fill='var(--mui-palette-primary-lightOpacity)'
                          strokeWidth={2}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <Card variant='outlined' className='bs-56 grid place-items-center text-center p-6'>
                    <Typography variant='body2' color='text.secondary'>
                      {t('ef_serie_nace_1')} ({puntos.length}).<br />
                      {t('ef_serie_nace_2')}
                    </Typography>
                  </Card>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <Card className='bs-full'>
              <CardHeader
                title={t('ef_intervenciones')}
                subheader={t('ef_intervenciones_sub')}
              />
              <CardContent className='flex flex-col gap-4'>
                {tokens.intervenciones.length === 0 && (
                  <Typography variant='body2' color='text.secondary'>{t('ef_sin_intervenciones')}</Typography>
                )}
                {tokens.intervenciones.map((i, idx) => (
                  <div key={idx} className='flex gap-3'>
                    <Typography component='span'>{i.estado}</Typography>
                    <div>
                      <Typography variant='caption' color='text.disabled' className='font-mono'>{i.fecha}</Typography>
                      <Typography variant='body2'>{i.cambio}</Typography>
                      <Typography variant='caption' color='text.secondary'>{i.efecto}</Typography>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )
    }}
  </DataGate>
  )
}

export default EficienciaPage
