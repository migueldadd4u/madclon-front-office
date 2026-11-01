'use client'

// React Imports
import { useEffect, useState } from 'react'

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
import CountUp from '@/components/dashboard/CountUp'

// Hook Imports
import { useLang } from '@/lib/i18n'

// Data Imports
import { fmt, fmtFecha } from '@/lib/data'

const ActividadPage = () => {
  const { t } = useLang()

  // Las barras arrancan en 0 y crecen al entrar (sin animación con reduced-motion)
  const [barras, setBarras] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setBarras(true)

      return
    }

    const id = setTimeout(() => setBarras(true), 60)

    return () => clearTimeout(id)
  }, [])

  return (
  <DataGate necesita={['overview', 'manifest']}>
    {({ overview, manifest }) => {
      const { gtd, automejora, personas } = overview

      // «Lo reciente manda» (orden de MAD, 01/11/2026): «ahora mismo» es lo que se
      // ha movido en las dos últimas semanas; lo parado se cuenta debajo, no se calla.
      const reciente = gtd.lo_reciente

      const delDia = (r: { del_dia: number } | undefined, total: number | null) => (r ? r.del_dia : total)

      const parados = (r: { parados: number } | undefined) =>
        r && r.parados > 0 && reciente ? t('act_parados').replace('{n}', fmt(r.parados)).replace('{d}', String(reciente.umbral_dias)) : undefined

      const colaTotal = Math.max(
        automejora.hechas + automejora.bloqueadas + automejora.aparcadas + automejora.pendientes,
        1
      )

      return (
        <Grid container spacing={6}>
          <Grid size={12}>
            <Typography component='h1' variant='h4' className='mbe-1'>{t('act_titulo')}</Typography>
            <Typography color='text.secondary' className='max-is-2xl'>
              {t('act_intro')}
            </Typography>
            <Typography variant='caption' color='text.secondary' className='mbs-2 block'>
              {t('act_medido').replace('{fecha}', fmtFecha(manifest.generado))}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              icon='ri-vote-line'
              valor={fmt(gtd.propuestas)}
              countTo={gtd.propuestas}
              label={t('act_propuestas')}
              color='warning'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard icon='ri-inbox-line' valor={fmt(delDia(reciente?.bandeja, gtd.bandeja))} countTo={delDia(reciente?.bandeja, gtd.bandeja)} label={t('act_bandeja')} detalle={parados(reciente?.bandeja)} color='info' />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              icon='ri-hourglass-line'
              valor={fmt(delDia(reciente?.esperas_vencidas, gtd.esperas_vencidas))}
              countTo={delDia(reciente?.esperas_vencidas, gtd.esperas_vencidas)}
              label={t('act_esperas')}
              detalle={parados(reciente?.esperas_vencidas)}
              color={(delDia(reciente?.esperas_vencidas, gtd.esperas_vencidas) ?? 0) > 0 ? 'error' : 'success'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              icon='ri-list-check-3'
              valor={fmt(delDia(reciente?.decisiones, gtd.decisiones))}
              countTo={delDia(reciente?.decisiones, gtd.decisiones)}
              label={t('act_decisiones')}
              detalle={parados(reciente?.decisiones)}
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
                    <LinearProgress
                      variant='determinate'
                      value={barras ? (f.valor / colaTotal) * 100 : 0}
                      color={f.color}
                      aria-label={`${f.label}: ${f.valor}`}
                      sx={{ '& .MuiLinearProgress-bar': { transition: 'transform 1s cubic-bezier(.4,0,.2,1)' } }}
                    />
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
                    <Typography variant='h2' className='font-mono'><CountUp to={personas.fichas_curadas} /></Typography>
                    <Typography variant='body2' color='text.secondary'>{t('act_fichas')}</Typography>
                  </div>
                  <div>
                    <Typography variant='h3' className='font-mono' color='customColors.textoAviso'><CountUp to={personas.staged} /></Typography>
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
