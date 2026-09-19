'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'

import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import Button from '@mui/material/Button'

import { useLang } from '@/lib/i18n'
import { HARDWARE_INVENTORY, isPublicHardware } from '@/lib/hardware-public.mjs'

function Gauge({ label, value, missing }: {label: string; value: number | null; missing: string}) {
  return <Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 1 }}>
      <Typography component='span' variant='body2'>{label}</Typography>
      <Typography component='span' variant='body2' fontWeight={600}>{value === null ? missing : `${Math.round(value)} %`}</Typography>
    </Box>
    {value !== null ? <LinearProgress variant='determinate' value={value} aria-label={label} sx={{ height: 7, borderRadius: 1 }} /> : <Box aria-hidden sx={{ height: 7, bgcolor: 'action.disabledBackground', borderRadius: 1 }} />}
  </Box>
}

export default function HardwareOverview({ hardware }: {hardware: unknown}) {
  const { lang } = useLang()
  const [now, setNow] = useState<number | null>(null)
  const es = (spanish: string, english: string) => lang === 'es' ? spanish : english
  const snapshot = isPublicHardware(hardware) ? hardware : null
  const missing = es('Sin dato', 'No data')

  useEffect(() => {
    setNow(Date.now())
    const interval = setInterval(() => setNow(Date.now()), 60000)

    return () => clearInterval(interval)
  }, [])

  return <Box component='section' aria-labelledby='hardware-home-title'>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
      <Typography id='hardware-home-title' component='h2' variant='h5'>{es('El hardware del clon', 'The clone’s hardware')}</Typography>
      <Button component={Link} href='/hardware' endIcon={<i className='ri-arrow-right-line' />} sx={{ minHeight: 44, color: 'text.primary', textDecoration: 'underline' }}>{es('Ver hardware completo', 'View full hardware')}</Button>
    </Box>
    <Typography variant='body2' color='text.secondary' className='mbe-4'>{es('Capacidad instalada y última muestra de uso. Se actualiza con la exportación del portal; no es una lectura en directo.', 'Installed capacity and latest usage sample. Updated with the portal export; not a live reading.')}</Typography>
    <Grid container spacing={4}>
      {HARDWARE_INVENTORY.map(machine => {
        const host = snapshot?.hosts.find(h => h.id === machine.id)
        const time = host?.sampled_at ? Date.parse(host.sampled_at) : null
        const future = time !== null && now !== null && time > now + 300000
        const sample = future ? undefined : host
        const stale = time !== null && now !== null && now - time > 36 * 60 * 60 * 1000
        const ram = sample?.ram_total_bytes != null && sample.ram_total_bytes > 0 && sample.ram_available_bytes != null ? 100 * (1 - sample.ram_available_bytes / sample.ram_total_bytes) : null
        const stamp = sample?.sampled_at ? new Date(sample.sampled_at).toLocaleString(lang === 'es' ? 'es-ES' : 'en-GB', { timeZone: 'UTC' }) + ' UTC' : missing

        return <Grid key={machine.id} size={{ xs: 12, sm: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardActionArea component={Link} href='/hardware' sx={{ height: '100%', '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: -3 } }}>
              <CardContent>
                <Typography component='h3' variant='h6'>{machine.name}</Typography>
                <Typography variant='body2' color='text.secondary' className='mbe-4'>{machine.cpuCores} CPU · {machine.memory} {machine.memoryUnit} {es('de memoria unificada', 'unified memory')}</Typography>
                <Box sx={{ display: 'grid', gap: 3 }}>
                  <Gauge label={es('CPU usada', 'CPU used')} value={sample?.cpu_percent ?? null} missing={missing} />
                  <Gauge label={es('GPU usada', 'GPU used')} value={sample?.gpu_percent ?? null} missing={missing} />
                  <Gauge label={es('RAM usada estimada', 'Estimated RAM used')} value={ram} missing={missing} />
                </Box>
                <Typography variant='caption' component='p' color='text.secondary' className='mbs-4 mbe-0'>
                  {stale ? es('Muestra antigua', 'Old sample') : es('Última muestra', 'Latest sample')}: {stamp}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      })}
    </Grid>
  </Box>
}
