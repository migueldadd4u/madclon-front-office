'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// Component Imports
import DataGate from '@/components/dashboard/DataGate'
import StatCard from '@/components/dashboard/StatCard'
import HeroClon from '@/components/dashboard/HeroClon'
import EscaparateClon from '@/components/dashboard/EscaparateClon'
import HardwareOverview from '@/components/dashboard/HardwareOverview'
import ClonOpina from '@/components/dashboard/ClonOpina'
import EstaNoche from '@/components/dashboard/EstaNoche'
import Latido from '@/components/dashboard/Latido'
import DiaEnLaVida from '@/components/dashboard/DiaEnLaVida'
import ProgresoDia from '@/components/dashboard/ProgresoDia'
import ConsolaClon from '@/components/dashboard/ConsolaClon'
import DatoRancio from '@/components/dashboard/DatoRancio'

// Hook Imports
import { useLang } from '@/lib/i18n'
import type { Lang, StrKey } from '@/lib/i18n'

// Data Imports
import { fmt, fmtCorto, fmtFecha } from '@/lib/data'
import type { PanelData } from '@/lib/data'

/** Sustituye {marcadores} en las plantillas bilingües por valores. */
const reemplaza = (plantilla: string, valores: Record<string, string>) =>
  Object.entries(valores).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, v), plantilla)

/** Resumen del estado en lenguaje llano, generado de los datos (sin IA en tiempo real). */
function fraseEstado(data: PanelData, lang: Lang, t: (k: StrKey) => string): string {
  const { overview } = data
  const partes: string[] = []
  const cronsOk = overview.crons.length - overview.crons_en_error
  const saludOk = (overview.salud_global ?? '').includes('🟢')

  if (saludOk && overview.crons_en_error === 0) {
    partes.push(t('frase_tranquilo'))
  } else if (saludOk) {
    partes.push(t('frase_bien'))
  } else {
    partes.push(t('frase_atencion'))
  }

  partes.push(`${cronsOk} ${t('frase_rutinas_de')} ${overview.crons.length} ${t('frase_rutinas_fin')}`)
  if (overview.gateways?.length) partes.push(`${overview.gateways.length} ${t('frase_puertas')}`)
  const problemas = overview.healthcheck?.problemas ?? 0

  if (problemas > 0) partes.push(`${problemas} ${problemas === 1 ? t('frase_aviso_1') : t('frase_aviso_n')}`)
  const propuestas = overview.gtd.propuestas ?? 0

  if (propuestas > 0) {
    partes.push(lang === 'en' ? `and ${propuestas} ${t('frase_propuestas')}` : `y ${propuestas} ${t('frase_propuestas')}`)
  }

  return partes.join(', ') + '.'
}

const InicioPage = () => {
  const { lang, t } = useLang()
  const [diaSel, setDiaSel] = useState<number | null>(null)

  return (
    <div className='flex flex-col gap-8'>
      <HeroClon />
      <EscaparateClon />
      <section aria-label={t('home_sistema')}>
    <DataGate necesita={['overview', 'tokens', 'clones', 'manifest', 'serie']} fallback={partial => <HardwareOverview hardware={partial.overview?.hardware} />}>
      {data => {
        const { overview, tokens, clones, manifest } = data
        const saludOk = (overview.salud_global ?? '').includes('🟢')
        const diasVida = Math.max(1, Math.floor((Date.now() - new Date('2026-04-14T00:00:00').getTime()) / 86_400_000))

        // Puntos del pulso con fecha corta y larga; % de «día normal» = tokens del día / media de la serie
        const pts = data.serie.serie.map(p => ({
          fecha: new Date(`${p.fecha}T00:00:00`).toLocaleDateString(lang === 'en' ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'short' }),
          fechaLarga: new Date(`${p.fecha}T00:00:00`).toLocaleDateString(lang === 'en' ? 'en-GB' : 'es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          }),
          tokens: p.contexto?.tokens ?? 0,
          tareas: p.contexto?.tareas_hechas ?? 0
        }))

        const mediaTokens = pts.length > 0 ? pts.reduce((a, p) => a + p.tokens, 0) / pts.length : 0
        const pctDia = (v: number) => (mediaTokens > 0 ? Math.round((v / mediaTokens) * 100) : null)

        return (
          <>
            <DatoRancio generado={manifest.generado} />
            <Accordion slotProps={{ transition: { unmountOnExit: true } }}>
              <AccordionSummary id='sistema-por-dentro' aria-controls='sistema-contenido' expandIcon={<i className='ri-arrow-down-s-line' aria-hidden='true' />} sx={{ minBlockSize: 56 }}>
                <Typography component='span' fontWeight={600}>{t('home_sistema')}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color='text.secondary' sx={{ mb: 4 }}>{t('home_sistema_sub')} {lang === 'en' ? 'Data generated on' : 'Datos generados el'} {fmtFecha(manifest.generado)}.</Typography>
          <Grid container spacing={6}>

            {/* Cabecera de informe — solo aparece en papel */}
            <Grid size={12} className='fo-print-only'>
              <div className='flex flex-wrap items-baseline justify-between gap-2'>
                <Typography variant='h6'>MAD Clon — {t('home_titulo')}</Typography>
                <Typography variant='caption' className='font-mono'>
                  migueldadd4u.github.io/madclon-front-office
                </Typography>
              </div>
              <Typography variant='caption' color='text.secondary'>
                {t('print_informe')}
              </Typography>
            </Grid>

            {/* Identidad, utilidad y siguiente gesto antes del detalle del sistema. */}
            <Grid size={12}>
              <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 3 }}>
                <Box component='details' sx={{ flex: '1 1 240px', minInlineSize: 0 }}>
                  <Box component='summary' sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, minBlockSize: 48, cursor: 'pointer', '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 3, borderRadius: 1 } }}>
                    <i className='ri-arrow-down-s-line' aria-hidden />
                    <Typography component='span' variant='body2'>{t('home_estado')}</Typography>
                    <Chip
                      size='small'
                      color={saludOk ? 'success' : 'warning'}
                      variant='tonal'
                      icon={<i className={saludOk ? 'ri-checkbox-circle-line' : 'ri-alert-line'} />}
                      label={overview.salud_global?.replace(/[🟢🟡🔴]/g, '').trim() || '—'}
                    />
                  </Box>
                  <Typography variant='body2' sx={{ py: 2 }}>{fraseEstado(data, lang, t)}</Typography>
                  <Box className='flex flex-wrap items-center gap-3'>
                    <ConsolaClon data={data} diasVida={diasVida} />
                    <Latido crons={overview.crons} generado={manifest.generado} />
                  </Box>
                </Box>
              </Box>
            </Grid>

            <Grid size={12}>
              <HardwareOverview hardware={overview.hardware} />
            </Grid>

            {/* Cifras de cabecera — count-up animado al cargar */}
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                icon='ri-token-swap-line'
                valor={fmtCorto(tokens.contador.ventana_30d)}
                countTo={tokens.contador.ventana_30d}
                countFormat={fmtCorto}
                label={t('home_stat_tokens')}
                detalle={`${fmt(tokens.contador.ventana_30d)} tokens`}
                color='primary'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                icon='ri-robot-2-line'
                valor={String(clones.clones.length)}
                countTo={clones.clones.length}
                label={t('home_stat_clones')}
                detalle={t('home_stat_clones_det')}
                color='success'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                icon='ri-heart-pulse-line'
                valor={String(overview.gateways?.length ?? '—')}
                countTo={overview.gateways?.length ?? null}
                label={t('home_stat_gateways')}
                detalle={t('home_stat_gateways_det')}
                color='info'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                icon='ri-calendar-check-line'
                valor={`${overview.crons.length - overview.crons_en_error}/${overview.crons.length}`}
                countTo={overview.crons.length - overview.crons_en_error}
                countFormat={n => `${Math.round(n)}/${overview.crons.length}`}
                label={t('home_stat_rutinas')}
                detalle={overview.crons_en_error > 0 ? `${overview.crons_en_error} ${t('home_stat_rutinas_err')}` : t('home_stat_rutinas_ok')}
                color={overview.crons_en_error > 0 ? 'warning' : 'success'}
              />
            </Grid>

          </Grid>
              </AccordionDetails>
            </Accordion>
            <Grid container spacing={6} data-actividad-publica>
            {/* El clon opina */}
            <Grid size={12}>
              <ClonOpina data={data} />
            </Grid>

            {/* El clon te cuenta su noche */}
            <Grid size={12}>
              <EstaNoche data={data} />
            </Grid>

            {/* Un día en la vida del clon */}
            <Grid size={12}>
              <DiaEnLaVida crons={overview.crons} />
            </Grid>

            {/* Tendencia reciente */}
            <Grid size={12}>
              <Card>
                <CardContent className='flex flex-col gap-2'>
                  <div className='flex flex-wrap items-baseline justify-between gap-2'>
                    <Typography component='h2' variant='h6'>{t('home_pulso_titulo')}</Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {t('home_pulso_caption')}
                    </Typography>
                  </div>
                  <div
                    className='bs-[220px] fo-pulso'
                    tabIndex={0}
                    role='group'
                    aria-label={t('pulso_explora_aria')}
                    onKeyDown={e => {
                      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                        e.preventDefault()
                        setDiaSel(prev => {
                          const n = pts.length

                          if (n === 0) return prev
                          if (prev === null) return n - 1 // la primera flecha empieza en el día más reciente

                          return (prev + (e.key === 'ArrowRight' ? 1 : -1) + n) % n
                        })
                      } else if (e.key === 'Home') {
                        e.preventDefault()
                        setDiaSel(0)
                      } else if (e.key === 'End') {
                        e.preventDefault()
                        setDiaSel(pts.length - 1)
                      } else if (e.key === 'Escape') {
                        setDiaSel(null)
                      }
                    }}
                  >
                    <ResponsiveContainer width='100%' height='100%'>
                      <BarChart
                        data={pts}
                        margin={{ left: 0, right: 8, top: 8 }}
                      >
                        <XAxis
                          dataKey='fecha'
                          tick={{ fill: 'var(--mui-palette-text-secondary)', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          hide
                          yAxisId='tokens'
                          domain={[0, (dataMax: number) => dataMax * 1.15]}
                        />
                        <YAxis
                          hide
                          yAxisId='tareas'
                          orientation='right'
                          domain={[0, (dataMax: number) => dataMax * 1.6]}
                        />
                        <Tooltip
                          cursor={{ fill: 'var(--mui-palette-action-hover)' }}
                          content={({ active, payload }: { active?: boolean; payload?: { payload?: (typeof pts)[number] }[] }) => {
                            if (!active || !payload?.length) return null
                            const d = payload[0]?.payload

                            if (!d) return null
                            const pct = pctDia(d.tokens)

                            return (
                              <div
                                style={{
                                  background: 'var(--mui-palette-background-paper)',
                                  border: '1px solid var(--mui-palette-divider)',
                                  borderRadius: 8,
                                  padding: '8px 12px'
                                }}
                              >
                                <Typography variant='caption' fontWeight={600} className='block first-letter:uppercase'>
                                  {d.fechaLarga}
                                </Typography>
                                <div className='flex items-center gap-2 mbs-1'>
                                  <span className='inline-block bs-2 is-2 rounded-sm' style={{ background: 'var(--mui-palette-primary-main)' }} />
                                  <Typography variant='caption'>
                                    {fmtCorto(d.tokens)} · {t('home_pulso_tooltip_tokens')}
                                  </Typography>
                                </div>
                                <div className='flex items-center gap-2'>
                                  <span className='inline-block bs-2 is-2 rounded-sm' style={{ background: '#06C9A8' }} />
                                  <Typography variant='caption'>
                                    {fmt(d.tareas)} · {t('home_pulso_tooltip_tareas')}
                                  </Typography>
                                </div>
                                {pct !== null && (
                                  <Typography variant='caption' color='text.secondary' className='block mbs-1'>
                                    {reemplaza(t('pulso_tooltip_pct'), { pct: String(pct) })}
                                  </Typography>
                                )}
                              </div>
                            )
                          }}
                        />
                        <Bar dataKey='tokens' yAxisId='tokens' fill='var(--mui-palette-primary-main)' radius={[6, 6, 0, 0]} maxBarSize={40}>
                          {pts.map((_, i) => (
                            <Cell key={i} fillOpacity={diaSel === null || diaSel === i ? 1 : 0.35} />
                          ))}
                        </Bar>
                        <Bar dataKey='tareas' yAxisId='tareas' fill='#06C9A8' radius={[6, 6, 0, 0]} maxBarSize={40}>
                          {pts.map((_, i) => (
                            <Cell key={i} fillOpacity={diaSel === null || diaSel === i ? 1 : 0.35} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className='flex flex-wrap items-center gap-x-5 gap-y-1'>
                    <span className='flex items-center gap-2'>
                      <span className='inline-block bs-2.5 is-2.5 rounded-sm' style={{ background: 'var(--mui-palette-primary-main)' }} />
                      <Typography variant='caption' color='text.secondary'>{t('home_pulso_leyenda_tokens')}</Typography>
                    </span>
                    <span className='flex items-center gap-2'>
                      <span className='inline-block bs-2.5 is-2.5 rounded-sm' style={{ background: '#06C9A8' }} />
                      <Typography variant='caption' color='text.secondary'>{t('home_pulso_leyenda_tareas')}</Typography>
                    </span>
                    <Typography variant='caption' color='text.secondary' className='mis-auto fo-no-print'>
                      {t('pulso_explora_hint')}
                    </Typography>
                  </div>
                  <div aria-live='polite'>
                    {diaSel !== null && pts[diaSel] && (
                      <Typography variant='body2' fontWeight={500} className='first-letter:uppercase'>
                        {reemplaza(t('pulso_dia_sel'), {
                          fecha: pts[diaSel].fechaLarga,
                          tokens: fmtCorto(pts[diaSel].tokens),
                          tareas: fmt(pts[diaSel].tareas),
                          pct: String(pctDia(pts[diaSel].tokens) ?? 0)
                        })}
                      </Typography>
                    )}
                  </div>
                  <ProgresoDia data={data} />
                </CardContent>
              </Card>
            </Grid>
            </Grid>
          </>
        )
      }}
    </DataGate>
      </section>
    </div>
  )
}

export default InicioPage
