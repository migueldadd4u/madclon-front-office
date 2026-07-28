'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
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
import StatCard from '@/components/dashboard/StatCard'

// Hook Imports
import { useLang } from '@/lib/i18n'

// Data Imports
import { fmtCorto } from '@/lib/data'

// Hitos verificados: cada fecha corresponde a una bitácora real del vault (00_SISTEMA/handoffs/)
const HITOS = [
  {
    fecha: { es: '14 abril 2026', en: '14 April 2026' },
    es: { titulo: 'Nace el proyecto', texto: 'Primeras notas de lo que será el segundo cerebro de MAD. Todo empieza como un experimento de memoria.' },
    en: { titulo: 'The project is born', texto: "The first notes of what will become MAD's second brain. It all starts as a memory experiment." },
    icon: 'ri-seedling-line',
    color: 'success' as const
  },
  {
    fecha: { es: '16 abril 2026', en: '16 April 2026' },
    es: { titulo: 'De un agente a varios', texto: 'El clon da el salto a multi-agente con memoria propia: ya no es un chatbot, es un equipo.' },
    en: { titulo: 'From one agent to many', texto: 'The clone leaps to multi-agent with its own memory: no longer a chatbot, but a team.' },
    icon: 'ri-team-line',
    color: 'primary' as const
  },
  {
    fecha: { es: '19 abril 2026', en: '19 April 2026' },
    es: { titulo: 'El motor Hermes arranca', texto: 'El corazón del sistema queda operativo: rutinas automáticas que laten solas, de día y de noche.' },
    en: { titulo: 'The Hermes engine starts', texto: "The system's heart becomes operational: automatic routines beating on their own, day and night." },
    icon: 'ri-heart-pulse-line',
    color: 'info' as const
  },
  {
    fecha: { es: '22 abril 2026', en: '22 April 2026' },
    es: { titulo: 'Nace el clon Patrimonio', texto: 'El primer especialista con oficio: vigilar el patrimonio de la familia. La flota empieza a crecer.' },
    en: { titulo: 'The Assets clone is born', texto: "The first specialist with a craft: watching over the family's assets. The fleet begins to grow." },
    icon: 'ri-safe-2-line',
    color: 'warning' as const
  },
  {
    fecha: { es: '12 mayo 2026', en: '12 May 2026' },
    es: { titulo: 'Ecosistema completo', texto: 'Siete bots orquestados trabajando en equipo y WhatsApp conectado como puerta de entrada.' },
    en: { titulo: 'Full ecosystem', texto: 'Seven orchestrated bots working as a team, with WhatsApp connected as an entry door.' },
    icon: 'ri-robot-2-line',
    color: 'primary' as const
  },
  {
    fecha: { es: '15 mayo 2026', en: '15 May 2026' },
    es: { titulo: 'Cambio de motor en marcha', texto: 'Toda la flota migra de OpenClaw a Hermes sin perder un solo día de servicio.' },
    en: { titulo: 'Engine swap in motion', texto: 'The whole fleet migrates from OpenClaw to Hermes without losing a single day of service.' },
    icon: 'ri-refresh-line',
    color: 'info' as const
  },
  {
    fecha: { es: '24 mayo 2026', en: '24 May 2026' },
    es: { titulo: 'El correo entra en escena', texto: 'El clon empieza a leer y clasificar el correo, con reglas de privacidad desde el primer día.' },
    en: { titulo: 'Mail enters the scene', texto: 'The clone starts reading and sorting mail, with privacy rules from day one.' },
    icon: 'ri-mail-line',
    color: 'success' as const
  },
  {
    fecha: { es: '2 junio 2026', en: '2 June 2026' },
    es: { titulo: 'El cerebro se interconecta', texto: 'Las notas del vault dejan de ser islas: todo queda enlazado y localizable en segundos.' },
    en: { titulo: 'The brain interconnects', texto: 'Vault notes stop being islands: everything gets linked and findable in seconds.' },
    icon: 'ri-mind-map',
    color: 'primary' as const
  },
  {
    fecha: { es: '20 junio 2026', en: '20 June 2026' },
    es: { titulo: 'Nace la automejora', texto: 'El clon empieza a proponer y aplicar mejoras sobre sí mismo. Cada noche, un poco mejor.' },
    en: { titulo: 'Self-improvement is born', texto: 'The clone starts proposing and applying improvements on itself. Every night, a little better.' },
    icon: 'ri-arrow-up-double-line',
    color: 'warning' as const
  },
  {
    fecha: { es: '7 julio 2026', en: '7 July 2026' },
    es: { titulo: 'La flota se organiza', texto: 'Panel de dirección para los subclones: cada uno con oficio, canales y responsabilidades claras.' },
    en: { titulo: 'The fleet gets organized', texto: 'A management panel for the subclones: each with a craft, channels and clear responsibilities.' },
    icon: 'ri-dashboard-3-line',
    color: 'info' as const
  },
  {
    fecha: { es: '26 julio 2026', en: '26 July 2026' },
    es: { titulo: 'El clon se mide a sí mismo', texto: 'Se congela la línea base de eficiencia y nace este Front Office: los números del clon, abiertos.' },
    en: { titulo: 'The clone measures itself', texto: "The efficiency baseline is frozen and this Front Office is born: the clone's numbers, in the open." },
    icon: 'ri-ruler-line',
    color: 'success' as const
  },
  {
    fecha: { es: '28 julio 2026', en: '28 July 2026' },
    es: { titulo: 'Marca propia', texto: 'El Front Office estrena logotipo MAD Clon: la M constelación, cinco nodos trabajando como uno.' },
    en: { titulo: 'A brand of its own', texto: 'The Front Office unveils the MAD Clon logo: the constellation M, five nodes working as one.' },
    icon: 'ri-shape-line',
    color: 'primary' as const
  }
]

const NACIMIENTO = new Date('2026-04-14T00:00:00')

const HistoriaPage = () => {
  const { lang, t } = useLang()

  return (
    <DataGate>
      {({ tokens, clones }) => {
        const diasVida = Math.max(1, Math.floor((Date.now() - NACIMIENTO.getTime()) / 86_400_000))

        return (
          <Grid container spacing={6}>
            <Grid size={12}>
              <Card>
                <CardContent className='flex flex-col gap-2'>
                  <Typography variant='h4'>{t('his_titulo')}</Typography>
                  <Typography color='text.secondary' className='max-is-2xl'>
                    {t('his_intro')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                icon='ri-calendar-line'
                valor={String(diasVida)}
                label={t('his_dias')}
                detalle={t('his_dias_det')}
                color='primary'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                icon='ri-book-open-line'
                valor='175'
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
                <CardContent>
                  <Timeline
                    sx={{
                      [`& .MuiTimelineItem-root:before`]: { flex: 0, padding: 0 }
                    }}
                  >
                    {HITOS.map((h, i) => (
                      <TimelineItem key={h.icon + i}>
                        <TimelineOppositeContent
                          sx={{ flex: { xs: 0.25, sm: 0.2 }, m: 'auto 0' }}
                          color='text.secondary'
                          variant='body2'
                          className='font-medium'
                        >
                          {h.fecha[lang]}
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                          <TimelineDot color={h.color} variant='tonal'>
                            <i className={`${h.icon} text-base`} />
                          </TimelineDot>
                          {i < HITOS.length - 1 && <TimelineConnector />}
                        </TimelineSeparator>
                        <TimelineContent className='pbs-1'>
                          <Typography variant='h6' component='span'>{h[lang].titulo}</Typography>
                          <Typography variant='body2' color='text.secondary'>{h[lang].texto}</Typography>
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )
      }}
    </DataGate>
  )
}

export default HistoriaPage
