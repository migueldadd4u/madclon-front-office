'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Timeline from '@mui/lab/Timeline'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent'

// Component Imports
import DataGate from '@/components/dashboard/DataGate'
import Insignias from '@/components/dashboard/Insignias'
import StatCard from '@/components/dashboard/StatCard'
import Link from '@/components/Link'

// Hook Imports
import { useLang } from '@/lib/i18n'
import type { Lang, StrKey } from '@/lib/i18n'

// Data Imports
import { fmt, fmtCorto } from '@/lib/data'
import type { PanelData } from '@/lib/data'
import { HITOS_BUILD } from '@/lib/historia-hitos'

// La línea de tiempo NO se escribe aquí: nace en exporter/historia.md, fuente
// única, y scripts/build-historia.mjs la hornea en el build. Escribirla a mano
// en React fue lo que hizo que /historia sirviera un capítulo de julio a
// mediados de agosto con el contador de bitácoras congelado.
//
// Y viaja CON EL BUILD, no por los datos: cuando dependió de overview.json, un
// visitante con ese documento en la caché del service worker (hasta 24 h por
// diseño) recibía JS nuevo + datos viejos y la línea de tiempo desaparecía
// entera. El histórico no cambia; lo que cambia son las cifras, y esas sí
// vienen de los JSON.

type Color = 'primary' | 'success' | 'info' | 'warning' | 'error' | 'secondary'

const COLORES: Color[] = ['primary', 'success', 'info', 'warning', 'error', 'secondary']

// El icono y el color llegan como texto en un JSON: se validan antes de pisar el
// DOM, y si no encajan el capítulo se pinta igual con el aspecto por defecto.
const color = (v: string): Color => (COLORES.includes(v as Color) ? (v as Color) : 'primary')
const icono = (v: string): string => (/^ri-[a-z0-9-]+$/.test(v) ? v : 'ri-circle-line')

const reemplaza = (plantilla: string, valores: Record<string, string>) =>
  Object.entries(valores).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, v), plantilla)

const fechaLarga = (iso: string, lang: Lang) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

// Máximo de la serie por métrica, conservando la fecha en la que se marcó
const maxPor = (puntos: { fecha: string; contexto?: Record<string, number> }[], clave: string) =>
  puntos.reduce<{ v: number; f: string } | null>((acc, p) => {
    const v = p.contexto?.[clave]

    return v != null && v > 0 && (!acc || v > acc.v) ? { v, f: p.fecha } : acc
  }, null)

/** Un capítulo de la línea: los curados y el vivo comparten forma y aspecto. */
const Capitulo = ({
  fecha,
  titulo,
  texto,
  icon,
  dot,
  ultimo,
  destacado
}: {
  fecha: string
  titulo: string
  texto: string
  icon: string
  dot: Color
  ultimo: boolean
  destacado?: boolean
}) => (
  <TimelineItem>
    <TimelineOppositeContent
      sx={{ flex: { xs: 0.25, sm: 0.2 }, m: 'auto 0' }}
      color='text.secondary'
      variant='body2'
      className='font-medium'
    >
      {fecha}
    </TimelineOppositeContent>
    <TimelineSeparator>
      <TimelineDot color={dot} variant={destacado ? 'filled' : 'tonal'}>
        <i className={`${icon} text-base`} />
      </TimelineDot>
      {!ultimo && <TimelineConnector />}
    </TimelineSeparator>
    <TimelineContent className='pbs-1'>
      <Typography variant='h6' component='span'>
        {titulo}
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        {texto}
      </Typography>
    </TimelineContent>
  </TimelineItem>
)

/** Texto del capítulo vivo: solo cifras de los JSON, cero literales. */
const textoDeHoy = (data: PanelData, t: (k: StrKey) => string) =>
  reemplaza(t('his_hoy_texto'), {
    clones: fmt(data.clones.clones.length),
    rutinasok: fmt(data.overview.crons.length - data.overview.crons_en_error),
    rutinas: fmt(data.overview.crons.length),
    tokens: fmtCorto(data.tokens.contador.ventana_30d)
  })

const HistoriaPage = () => {
  const { lang, t } = useLang()

  return (
    <DataGate necesita={['overview', 'tokens', 'clones', 'serie']}>
      {data => {
        const { tokens, clones, overview } = data
        const historia = overview.historia

        // Los capítulos vienen del build (fuente: exporter/historia.md), nunca de
        // un JSON cacheable: así la línea de tiempo no puede quedarse en blanco.
        const hitos = HITOS_BUILD

        // La edad sale del dato cuando está, y si no del primer capítulo — que es
        // el nacimiento. Nunca de una constante escrita a mano.
        const nacimientoISO = historia?.nacimiento ?? hitos[0]?.fecha ?? null
        const nacimiento = nacimientoISO ? new Date(`${nacimientoISO}T00:00:00`) : null

        const diasVida = nacimiento
          ? Math.max(1, Math.floor((Date.now() - nacimiento.getTime()) / 86_400_000))
          : null

        // La antigüedad narrativa se mide sobre lo que se está pintando, no sobre
        // el JSON: con datos rancios el aviso tiene que seguir siendo cierto.
        const ultimoHito = hitos.at(-1)?.fecha ?? null

        const diasSinCapitulo = ultimoHito
          ? Math.max(0, Math.floor((Date.now() - new Date(`${ultimoHito}T00:00:00`).getTime()) / 86_400_000))
          : null

        const rancia = (diasSinCapitulo ?? 0) > 21

        return (
          <Grid container spacing={6}>
            <Grid size={12}>
              <Card>
                <CardContent className='flex flex-col gap-2'>
                  <Typography variant='h4'>{t('his_titulo')}</Typography>
                  <Typography color='text.secondary' className='max-is-2xl'>
                    {t('his_intro')}
                  </Typography>
                  {/* Ida y vuelta con /retos (T-05.1): quien lee el capítulo del 5 de septiembre
                      llega a la explicación, y al revés. */}
                  <Typography variant='body2'>
                    {/* Objetivo táctil ≥ 44 px (check 8 del gate): un enlace de texto suelto
                        mide 16 px de alto y no se puede pulsar con el dedo. */}
                    <Link href='/retos' className='inline-flex items-center min-bs-[44px]'>
                      {lang === 'es' ? 'Qué es un reto →' : 'What a challenge is →'}
                    </Link>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                icon='ri-calendar-line'
                valor={diasVida === null ? '—' : String(diasVida)}
                label={t('his_dias')}
                detalle={nacimientoISO ? reemplaza(t('his_dias_det'), { fecha: fechaLarga(nacimientoISO, lang) }) : '—'}
                color='primary'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                icon='ri-book-open-line'
                valor={historia?.bitacoras == null ? '—' : fmt(historia.bitacoras)}
                label={t('his_bitacoras')}
                detalle={t('his_bitacoras_det')}
                color='info'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                icon='ri-robot-2-line'
                valor={String(clones.clones.length)}
                label={t('his_clones')}
                detalle={t('home_stat_clones_det')}
                color='success'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                icon='ri-token-swap-line'
                valor={fmtCorto(tokens.contador.ventana_30d)}
                label={t('home_stat_tokens')}
                detalle={t('his_tokens_det')}
                color='warning'
              />
            </Grid>

            <Grid size={12}>
              <Card>
                <CardContent className='flex flex-col gap-3'>
                  {hitos.length === 0 ? (
                    <Typography color='text.secondary' role='status'>
                      {t('his_sin_hitos')}
                    </Typography>
                  ) : (
                    <Timeline
                      sx={{
                        [`& .MuiTimelineItem-root:before`]: { flex: 0, padding: 0 }
                      }}
                    >
                      {hitos.map(h => (
                        <Capitulo
                          key={h.fecha + h.icono}
                          fecha={fechaLarga(h.fecha, lang)}
                          titulo={lang === 'es' ? h.es_titulo : h.en_titulo}
                          texto={lang === 'es' ? h.es_texto : h.en_texto}
                          icon={icono(h.icono)}
                          dot={color(h.color)}
                          ultimo={false}
                        />
                      ))}

                      {/* El capítulo vivo: la línea nunca termina en el pasado. */}
                      <Capitulo
                        fecha={t('his_hoy_fecha')}
                        titulo={t('his_hoy_titulo')}
                        texto={textoDeHoy(data, t)}
                        icon='ri-pulse-line'
                        dot='primary'
                        ultimo
                        destacado
                      />
                    </Timeline>
                  )}

                  {/* Nada muere en silencio: si la narración se retrasa, se dice. */}
                  {ultimoHito && (
                    <div className='flex flex-wrap items-center gap-2'>
                      <Typography variant='caption' color='text.disabled'>
                        {reemplaza(t('his_ultimo'), { fecha: fechaLarga(ultimoHito, lang) })}
                      </Typography>
                      {rancia && (
                        <Chip
                          size='small'
                          color='warning'
                          variant='tonal'
                          icon={<i className='ri-time-line' />}
                          label={reemplaza(t('his_pendiente'), { n: fmt(diasSinCapitulo ?? 0) })}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Récords del sistema: techos medidos de la serie con su fecha */}
            {(() => {
              const records = [
                { rec: maxPor(data.serie.serie, 'tokens'), label: t('rec_tokens'), icon: 'ri-brain-line', color: 'warning' as const, formato: fmtCorto },
                { rec: maxPor(data.serie.serie, 'tareas_hechas'), label: t('rec_tareas'), icon: 'ri-checkbox-circle-line', color: 'success' as const, formato: undefined },
                { rec: maxPor(data.serie.serie, 'llamadas'), label: t('rec_llamadas'), icon: 'ri-exchange-line', color: 'info' as const, formato: undefined }
              ].filter(r => r.rec !== null)

              if (records.length === 0) return null

              return (
                <>
                  <Grid size={12}>
                    <Card>
                      <CardContent className='flex flex-col gap-2'>
                        <Typography variant='h5'>{t('rec_titulo')}</Typography>
                        <Typography color='text.secondary' variant='body2' className='max-is-2xl'>
                          {t('rec_sub')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  {records.map(r => (
                    <Grid key={r.label} size={{ xs: 12, sm: 4 }}>
                      <StatCard
                        icon={r.icon}
                        valor=''
                        label={r.label}
                        detalle={fechaLarga(r.rec!.f, lang)}
                        color={r.color}
                        countTo={r.rec!.v}
                        countFormat={r.formato}
                      />
                    </Grid>
                  ))}
                </>
              )
            })()}

            {/* Insignias del sistema */}
            <Grid size={12}>
              <Insignias data={data} diasVida={diasVida ?? 0} />
            </Grid>
          </Grid>
        )
      }}
    </DataGate>
  )
}

export default HistoriaPage
