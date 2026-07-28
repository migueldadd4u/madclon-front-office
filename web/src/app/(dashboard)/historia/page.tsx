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

// Data Imports
import { fmtCorto } from '@/lib/data'

// Hitos verificados: cada fecha corresponde a una bitácora real del vault (00_SISTEMA/handoffs/)
const HITOS = [
  {
    fecha: '14 abril 2026',
    titulo: 'Nace el proyecto',
    texto: 'Primeras notas de lo que será el segundo cerebro de MAD. Todo empieza como un experimento de memoria.',
    icon: 'ri-seedling-line',
    color: 'success' as const
  },
  {
    fecha: '16 abril 2026',
    titulo: 'De un agente a varios',
    texto: 'El clon da el salto a multi-agente con memoria propia: ya no es un chatbot, es un equipo.',
    icon: 'ri-team-line',
    color: 'primary' as const
  },
  {
    fecha: '19 abril 2026',
    titulo: 'El motor Hermes arranca',
    texto: 'El corazón del sistema queda operativo: rutinas automáticas que laten solas, de día y de noche.',
    icon: 'ri-heart-pulse-line',
    color: 'info' as const
  },
  {
    fecha: '22 abril 2026',
    titulo: 'Nace el clon Patrimonio',
    texto: 'El primer especialista con oficio: vigilar el patrimonio de la familia. La flota empieza a crecer.',
    icon: 'ri-safe-2-line',
    color: 'warning' as const
  },
  {
    fecha: '12 mayo 2026',
    titulo: 'Ecosistema completo',
    texto: 'Siete bots orquestados trabajando en equipo y WhatsApp conectado como puerta de entrada.',
    icon: 'ri-robot-2-line',
    color: 'primary' as const
  },
  {
    fecha: '15 mayo 2026',
    titulo: 'Cambio de motor en marcha',
    texto: 'Toda la flota migra de OpenClaw a Hermes sin perder un solo día de servicio.',
    icon: 'ri-refresh-line',
    color: 'info' as const
  },
  {
    fecha: '24 mayo 2026',
    titulo: 'El correo entra en escena',
    texto: 'El clon empieza a leer y clasificar el correo, con reglas de privacidad desde el primer día.',
    icon: 'ri-mail-line',
    color: 'success' as const
  },
  {
    fecha: '2 junio 2026',
    titulo: 'El cerebro se interconecta',
    texto: 'Las notas del vault dejan de ser islas: todo queda enlazado y localizable en segundos.',
    icon: 'ri-mind-map',
    color: 'primary' as const
  },
  {
    fecha: '20 junio 2026',
    titulo: 'Nace la automejora',
    texto: 'El clon empieza a proponer y aplicar mejoras sobre sí mismo. Cada noche, un poco mejor.',
    icon: 'ri-arrow-up-double-line',
    color: 'warning' as const
  },
  {
    fecha: '7 julio 2026',
    titulo: 'La flota se organiza',
    texto: 'Panel de dirección para los subclones: cada uno con oficio, canales y responsabilidades claras.',
    icon: 'ri-dashboard-3-line',
    color: 'info' as const
  },
  {
    fecha: '26 julio 2026',
    titulo: 'El clon se mide a sí mismo',
    texto: 'Se congela la línea base de eficiencia y nace este Front Office: los números del clon, abiertos.',
    icon: 'ri-ruler-line',
    color: 'success' as const
  },
  {
    fecha: '28 julio 2026',
    titulo: 'Marca propia',
    texto: 'El Front Office estrena logotipo MAD Clon: la M constelación, cinco nodos trabajando como uno.',
    icon: 'ri-shape-line',
    color: 'primary' as const
  }
]

const NACIMIENTO = new Date('2026-04-14T00:00:00')

const HistoriaPage = () => (
  <DataGate>
    {({ tokens, clones }) => {
      const diasVida = Math.max(1, Math.floor((Date.now() - NACIMIENTO.getTime()) / 86_400_000))

      return (
        <Grid container spacing={6}>
          <Grid size={12}>
            <Card>
              <CardContent className='flex flex-col gap-2'>
                <Typography variant='h4'>La historia del clon</Typography>
                <Typography color='text.secondary' className='max-is-2xl'>
                  Cómo un experimento de memoria se convirtió en un equipo de IA que trabaja cada día.
                  Cada fecha de esta línea corresponde a una bitácora real escrita por el propio sistema.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              icon='ri-calendar-line'
              valor={String(diasVida)}
              label='días de vida'
              detalle='desde el 14 de abril de 2026'
              color='primary'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              icon='ri-book-open-line'
              valor='175'
              label='bitácoras escritas'
              detalle='el clon documenta su propio trabajo'
              color='info'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              icon='ri-robot-2-line'
              valor={String(clones.clones.length)}
              label='clones con oficio'
              detalle='+ el motor de automejora'
              color='success'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard
              icon='ri-token-swap-line'
              valor={fmtCorto(tokens.contador.ventana_30d)}
              label='trabajo de IA en 30 días'
              detalle='y contando, cada noche'
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
                    <TimelineItem key={h.fecha}>
                      <TimelineOppositeContent
                        sx={{ flex: { xs: 0.25, sm: 0.2 }, m: 'auto 0' }}
                        color='text.secondary'
                        variant='body2'
                        className='font-medium'
                      >
                        {h.fecha}
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineDot color={h.color} variant='tonal'>
                          <i className={`${h.icon} text-base`} />
                        </TimelineDot>
                        {i < HITOS.length - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent className='pbs-1'>
                        <Typography variant='h6' component='span'>{h.titulo}</Typography>
                        <Typography variant='body2' color='text.secondary'>{h.texto}</Typography>
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

export default HistoriaPage
