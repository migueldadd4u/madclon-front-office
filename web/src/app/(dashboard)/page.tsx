'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// Component Imports
import DataGate from '@/components/dashboard/DataGate'
import StatCard from '@/components/dashboard/StatCard'
import ClonOpina from '@/components/dashboard/ClonOpina'
import EstaNoche from '@/components/dashboard/EstaNoche'
import Latido from '@/components/dashboard/Latido'
import DiaEnLaVida from '@/components/dashboard/DiaEnLaVida'
import ProgresoDia from '@/components/dashboard/ProgresoDia'
import ConsolaClon from '@/components/dashboard/ConsolaClon'

// Hook Imports
import { useLang } from '@/lib/i18n'
import type { Lang, StrKey } from '@/lib/i18n'

// Data Imports
import { fmt, fmtCorto, fmtFecha } from '@/lib/data'
import type { PanelData } from '@/lib/data'

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

const PASOS = [
  {
    icon: 'ri-inbox-line',
    es: {
      titulo: 'Captura',
      texto: 'Todo lo que llega — correos, WhatsApp, notas, citas — entra en una bandeja única. Nada se pierde: cada cosa queda clasificada o esperando su turno.'
    },
    en: {
      titulo: 'Capture',
      texto: 'Everything that arrives — mail, WhatsApp, notes, appointments — goes into a single inbox. Nothing is lost: everything gets sorted or waits its turn.'
    }
  },
  {
    icon: 'ri-brain-line',
    es: {
      titulo: 'Piensa',
      texto: 'Un consejo de varios modelos de IA (GPT, Grok, Kimi, GLM…) contrasta opiniones antes de proponer nada. Las decisiones importantes siempre las toma el humano.'
    },
    en: {
      titulo: 'Think',
      texto: 'A council of several AI models (GPT, Grok, Kimi, GLM…) compares opinions before proposing anything. The important decisions are always made by the human.'
    }
  },
  {
    icon: 'ri-hand-heart-line',
    es: {
      titulo: 'Actúa',
      texto: 'Prepara borradores, persigue respuestas que se deben, monta dossieres y deja las propuestas listas para que Miguel solo tenga que decir sí o no.'
    },
    en: {
      titulo: 'Act',
      texto: 'It prepares drafts, chases owed replies, builds dossiers and leaves proposals ready so Miguel only has to say yes or no.'
    }
  },
  {
    icon: 'ri-line-chart-line',
    es: {
      titulo: 'Se mide',
      texto: 'Cada noche se audita a sí mismo: cuánto gasta, cuánto falla, si hoy es mejor que ayer. Los números de este panel son esa autoauditoría, en directo.'
    },
    en: {
      titulo: 'Measure',
      texto: 'Every night it audits itself: how much it spends, how often it fails, whether today is better than yesterday. The numbers on this dashboard are that self-audit, live.'
    }
  }
]

const InicioPage = () => {
  const { lang, t } = useLang()

  return (
    <DataGate>
      {data => {
        const { overview, tokens, clones, manifest } = data
        const saludOk = (overview.salud_global ?? '').includes('🟢')
        const diasVida = Math.max(1, Math.floor((Date.now() - new Date('2026-04-14T00:00:00').getTime()) / 86_400_000))

        return (
          <Grid container spacing={6}>
            {/* Bienvenida */}
            <Grid size={12}>
              <Card>
                <CardContent className='flex flex-col gap-3'>
                  <div className='flex flex-wrap items-center gap-3'>
                    <ConsolaClon data={data} diasVida={diasVida} />
                    <Typography variant='h4'>{t('home_titulo')}</Typography>
                    <Chip
                      size='small'
                      color={saludOk ? 'success' : 'warning'}
                      variant='tonal'
                      icon={<i className={saludOk ? 'ri-checkbox-circle-line' : 'ri-alert-line'} />}
                      label={overview.salud_global?.replace(/[🟢🟡🔴]/g, '').trim() || '—'}
                    />
                    <Latido crons={overview.crons} generado={manifest.generado} />
                  </div>
                  <Typography color='text.secondary' className='max-is-3xl'>
                    {t('home_intro')}
                  </Typography>
                  <Card variant='outlined' className='border-success'>
                    <CardContent className='flex items-start gap-3'>
                      <i className='ri-double-quotes-l text-2xl text-success' />
                      <Typography fontWeight={500}>{fraseEstado(data, lang, t)}</Typography>
                    </CardContent>
                  </Card>
                  <Typography variant='caption' color='text.disabled' className='font-mono'>
                    {lang === 'en' ? 'data generated on' : 'datos generados el'} {fmtFecha(manifest.generado)} · {t('home_caption_datos')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* El clon opina */}
            <Grid size={12}>
              <ClonOpina data={data} />
            </Grid>

            {/* El clon te cuenta su noche */}
            <Grid size={12}>
              <EstaNoche data={data} />
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

            {/* Qué es */}
            <Grid size={12}>
              <Typography variant='h5' className='mbe-1'>{t('home_quees_titulo')}</Typography>
              <Typography color='text.secondary'>{t('home_quees_sub')}</Typography>
            </Grid>
            {PASOS.map((p, i) => (
              <Grid key={p.icon} size={{ xs: 12, sm: 6, lg: 3 }}>
                <Card className='bs-full fo-card-hover'>
                  <CardContent className='flex flex-col gap-2'>
                    <div className='flex items-center justify-between'>
                      <i className={`${p.icon} text-3xl text-primary`} />
                      <Typography variant='caption' color='text.disabled' className='font-mono'>0{i + 1}</Typography>
                    </div>
                    <Typography variant='h6'>{p[lang].titulo}</Typography>
                    <Typography variant='body2' color='text.secondary'>{p[lang].texto}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}

            {/* Un día en la vida del clon */}
            <Grid size={12}>
              <DiaEnLaVida crons={overview.crons} />
            </Grid>

            {/* Tendencia reciente */}
            <Grid size={12}>
              <Card>
                <CardContent className='flex flex-col gap-2'>
                  <div className='flex flex-wrap items-baseline justify-between gap-2'>
                    <Typography variant='h6'>{t('home_pulso_titulo')}</Typography>
                    <Typography variant='caption' color='text.disabled'>
                      {t('home_pulso_caption')}
                    </Typography>
                  </div>
                  <div className='bs-[220px]'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <BarChart
                        data={data.serie.serie.map(p => ({
                          fecha: new Date(p.fecha).toLocaleDateString(lang === 'en' ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'short' }),
                          tokens: p.contexto?.tokens ?? 0,
                          tareas: p.contexto?.tareas_hechas ?? 0
                        }))}
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
                          contentStyle={{
                            background: 'var(--mui-palette-background-paper)',
                            border: '1px solid var(--mui-palette-divider)',
                            borderRadius: 8
                          }}
                          formatter={(v: number, name: string) => [
                            name === 'tokens' ? fmtCorto(v) : fmt(v),
                            name === 'tokens' ? t('home_pulso_tooltip_tokens') : t('home_pulso_tooltip_tareas')
                          ]}
                        />
                        <Bar dataKey='tokens' yAxisId='tokens' fill='var(--mui-palette-primary-main)' radius={[6, 6, 0, 0]} maxBarSize={40} />
                        <Bar dataKey='tareas' yAxisId='tareas' fill='#06C9A8' radius={[6, 6, 0, 0]} maxBarSize={40} />
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
                  </div>
                  <ProgresoDia data={data} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )
      }}
    </DataGate>
  )
}

export default InicioPage
