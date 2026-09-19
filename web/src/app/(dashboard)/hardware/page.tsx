'use client'

import { useEffect, useState } from 'react'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'

import { useLang } from '@/lib/i18n'
import { usePanelData } from '@/lib/data'
import { HARDWARE_INVENTORY, HARDWARE_VERIFIED_AT, HARDWARE_BENCHMARK, FP4_PFLOPS, isPublicHardware } from '@/lib/hardware-public.mjs'

const GIB = 1024 ** 3
const STALE_MS = 36 * 60 * 60 * 1000

type Row = [string, string]

function Facts({ rows }: { rows: Row[] }) {
  return <Box component='dl' sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 2, m: 0 }}>
    {rows.map(([label, value]) => <Box key={label} sx={{ display: 'contents' }}>
      <Typography component='dt' variant='body2' color='text.secondary'>{label}</Typography>
      <Typography component='dd' variant='body2' sx={{ m: 0, textAlign: 'right', fontWeight: 600 }}>{value}</Typography>
    </Box>)}
  </Box>
}

export default function HardwarePage() {
  const { lang } = useLang()
  const { data, cargando, retenido } = usePanelData()
  const [now, setNow] = useState<number | null>(null)
  const es = (spanish: string, english: string) => lang === 'es' ? spanish : english
  const locale = lang === 'es' ? 'es-ES' : 'en-GB'
  const missing = es('No disponible', 'Unavailable')
  const format = (value: number | null | undefined, unit = '') => value == null ? missing : `${value.toLocaleString(locale, { maximumFractionDigits: 1 })}${unit ? ` ${unit}` : ''}`
  const gib = (value: number | null | undefined) => format(value == null ? null : value / GIB, 'GiB')
  const snapshot = !retenido && isPublicHardware(data.overview?.hardware) ? data.overview.hardware : null
  const bench = HARDWARE_BENCHMARK

  useEffect(() => {
    setNow(Date.now())
    const interval = setInterval(() => setNow(Date.now()), 60000)

    return () => clearInterval(interval)
  }, [])

  return <Grid container spacing={6}>
    <Grid size={12}>
      <Typography component='h1' variant='h4' className='mbe-2'>Hardware</Typography>
      <Typography color='text.secondary'>{es('Las máquinas del clon, su capacidad y la última muestra de uso. Consulta pública, sin cuenta ni acceso a la red privada.', 'The clone’s machines, their capacity and latest usage sample. Public access, with no account or private network required.')}</Typography>
    </Grid>
    <Grid size={12}>
      <Alert severity='info'>{es('Instantáneas de la exportación habitual del portal; no es una lectura en directo. La fecha de cada equipo indica cuándo se midió. La capacidad instalada permanece visible si una medición falla.', 'Snapshots from the portal’s regular export, not live readings. Each machine’s timestamp shows when it was measured. Installed capacity remains visible if a measurement fails.')}</Alert>
    </Grid>
    {HARDWARE_INVENTORY.map(machine => {
      const host = snapshot?.hosts.find(h => h.id === machine.id)
      const time = host?.sampled_at ? Date.parse(host.sampled_at) : null
      const future = time !== null && now !== null && time > now + 300000
      const stale = time !== null && now !== null && now - time > STALE_MS
      const sample = future ? undefined : host
      const valid = sample?.sampled_at != null
      const partial = sample && Object.values(sample).some(v => v === null)
      const status = cargando ? es('Cargando muestra', 'Loading sample') : !valid ? es('Sin muestra disponible', 'No sample available') : stale ? es('Muestra antigua', 'Old sample') : partial ? es('Muestra parcial', 'Partial sample') : es('Muestra publicada', 'Published sample')
      const ramUsed = sample?.ram_total_bytes != null && sample.ram_available_bytes != null ? sample.ram_total_bytes - sample.ram_available_bytes : null

      return <Grid key={machine.id} size={{ xs: 12, lg: 6 }}>
        <Card sx={{ height: '100%' }}><CardContent>
          <Typography component='h2' variant='h5'>{machine.name}</Typography>
          <Typography color='text.secondary' className='mbe-4'>{machine.chip}</Typography>
          <Facts rows={[
            [es('Núcleos CPU instalados', 'Installed CPU cores'), format(machine.cpuCores)],
            [es('Procesador gráfico', 'Graphics processor'), machine.gpu],
            [es('Núcleos GPU', 'GPU cores'), format(machine.gpuCores)],
            [es('Memoria unificada nominal', 'Nominal unified memory'), format(machine.memory, machine.memoryUnit)],
            [es('Ancho de banda nominal', 'Nominal bandwidth'), format(machine.bandwidthGBs, 'GB/s')]
          ]} />
          <Typography variant='body2' color='text.secondary' className='mbs-4'>{es('Fuente de capacidad', 'Capacity source')}: {machine.source} · {es('inventario verificado', 'inventory verified')} {HARDWARE_VERIFIED_AT}</Typography>
          <Typography component='h3' variant='h6' className='mbs-6 mbe-2'>{es('Última muestra de uso', 'Latest usage sample')}</Typography>
          <Chip size='small' variant='outlined' label={status} color={!valid || stale ? 'warning' : 'default'} className='mbe-2' />
          <Typography variant='body2' color='text.secondary' className='mbe-4'>
            {valid ? new Date(sample.sampled_at!).toLocaleString(locale, { timeZone: 'UTC' }) + ' UTC' : missing}
          </Typography>
          <Facts rows={[
            [es('CPU utilizada', 'CPU usage'), format(sample?.cpu_percent, '%')],
            [es('GPU utilizada', 'GPU usage'), format(sample?.gpu_percent, '%')],
            [es('RAM reconocida por el sistema', 'RAM recognized by the OS'), gib(sample?.ram_total_bytes)],
            [es('RAM usada estimada', 'Estimated used RAM'), gib(ramUsed)],
            [es('RAM disponible estimada', 'Estimated available RAM'), gib(sample?.ram_available_bytes)],
            [es('Intercambio en disco usado', 'Swap used'), gib(sample?.swap_used_bytes)],
            [es('Disco raíz total', 'Root disk total'), gib(sample?.disk_total_bytes)],
            [es('Disco raíz disponible', 'Root disk available'), gib(sample?.disk_available_bytes)],
            [es('Temperatura GPU', 'GPU temperature'), format(sample?.gpu_temperature_c, '°C')],
            [es('Potencia GPU', 'GPU power'), format(sample?.gpu_power_w, 'W')]
          ]} />
        </CardContent></Card>
      </Grid>
    })}
    <Grid size={12}><Card><CardContent>
      <Typography component='h2' variant='h5' className='mbe-3'>{es('Cuánto pueden procesar', 'Processing capacity')}</Typography>
      <Typography className='mbe-3'>{es('El máximo práctico depende del modelo, la precisión, el contexto y la concurrencia. No hay un máximo universal medido. La RAM y la GPU de cada máquina comparten memoria; no se suman como reservas independientes ni como un único equipo.', 'Practical capacity depends on the model, precision, context and concurrency. No universal maximum has been measured. RAM and GPU on each machine share memory; they are not separate pools or a single combined machine.')}</Typography>
      <Typography variant='body2' color='text.secondary' className='mbe-5'>
        {es('NVIDIA publica hasta', 'NVIDIA specifies up to')} {format(FP4_PFLOPS, 'PFLOP')} {es('con precisión FP4 y dispersión: es una cifra teórica, no velocidad de generación de texto ni una medición de este equipo.', 'at FP4 precision with sparsity: a theoretical figure, not text generation speed or a measurement of this machine.')}
      </Typography>
      <Typography component='h3' variant='h6' className='mbe-3'>{es('Prueba histórica de generación de texto', 'Historical text generation test')} · {bench.date}</Typography>
      <Typography variant='body2' className='mbe-3'>{es('La velocidad se expresa en fragmentos de texto generados por segundo (tok/s).', 'Speed is shown as text fragments generated per second (tok/s).')}</Typography>
      <Typography variant='body2' className='mbe-4'>{bench.engine} · {bench.model} · {es('contexto', 'context')} {format(bench.context)} · {es('peticiones simultáneas', 'concurrent requests')}: {format(bench.concurrency)}</Typography>
      <Facts rows={[
        [es('Mac · una petición', 'Mac · single request'), bench.macSingle.map(v => format(v)).join(' / ') + ' tok/s'],
        [es('DGX · una petición', 'DGX · single request'), bench.dgxSingle.map(v => format(v)).join(' / ') + ' tok/s'],
        [es('Mac · rendimiento agregado', 'Mac · aggregate throughput'), format(bench.macAggregate, 'tok/s')],
        [es('DGX · rendimiento agregado', 'DGX · aggregate throughput'), format(bench.dgxAggregate, 'tok/s')]
      ]} />
      <Typography variant='body2' color='text.secondary' className='mbs-4'>{es('Fuente: registro corregido de puesta en marcha. Ensayos separados bajo esas condiciones; no son una medición actual, una suma de equipos ni una prueba de concurrencia máxima.', 'Source: corrected commissioning record. Separate tests under those conditions; not current measurements, a combined-machine total or a maximum-concurrency test.')}</Typography>
    </CardContent></Card></Grid>
    <Grid size={12}><Typography variant='body2' color='text.secondary'>{es('CPU: muestra breve. RAM disponible: estimación del sistema operativo. Memoria unificada compartida con GPU. Disco raíz: no inventaría discos externos. No disponible significa que la fuente no lo ofrece o la lectura falló; nunca se sustituye por cero. Esta vista publica solo agregados, sin procesos, nombres de modelos cargados ni datos personales.', 'CPU: short sample. Available RAM: operating-system estimate. Unified memory is shared with the GPU. Root disk: external drives are not inventoried. Unavailable means the source does not provide it or the reading failed; it is never replaced with zero. This view publishes aggregates only, without processes, loaded-model names or personal data.')}</Typography></Grid>
  </Grid>
}
