'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import CustomAvatar from '@core/components/mui/Avatar'

// Hook Imports
import { useLang } from '@/lib/i18n'
import type { Lang } from '@/lib/i18n'

// Data Imports
import { fmt, fmtCorto } from '@/lib/data'
import type { PanelData } from '@/lib/data'

type Insignia = {
  id: string
  icon: string
  titulo: Record<Lang, string>
  actual: number
  objetivo: number
  formato: (n: number) => string
}

type Props = { data: PanelData; diasVida: number }

/**
 * Insignias del sistema — los hitos reales como logros desbloqueados.
 * Solo cifras agregadas que ya existen en los JSON públicos.
 * Las bloqueadas muestran su progreso: la meta se ve venir.
 */
const Insignias = ({ data, diasVida }: Props) => {
  const { lang, t } = useLang()
  const { tokens, clones, overview } = data
  const fichas = overview.personas.fichas_curadas ?? 0
  const tokens30d = tokens.contador.ventana_30d ?? 0
  const mejoras = overview.automejora.hechas
  const puertas = overview.gateways?.length ?? 0

  const INSIGNIAS: Insignia[] = [
    { id: 't300', icon: 'ri-brain-line', titulo: { es: '300 M pensados', en: '300 M thought' }, actual: tokens30d, objetivo: 300_000_000, formato: fmtCorto },
    { id: 'd100', icon: 'ri-cake-2-line', titulo: { es: '100 días de vida', en: '100 days alive' }, actual: diasVida, objetivo: 100, formato: fmt },
    { id: 'm100', icon: 'ri-hammer-line', titulo: { es: '100 mejoras aplicadas', en: '100 improvements applied' }, actual: mejoras, objetivo: 100, formato: fmt },
    { id: 'p800', icon: 'ri-team-line', titulo: { es: '800 personas recordadas', en: '800 people remembered' }, actual: fichas, objetivo: 800, formato: fmt },
    { id: 'c7', icon: 'ri-robot-2-line', titulo: { es: '7 oficios en la flota', en: '7 crafts in the fleet' }, actual: clones.clones.length, objetivo: 7, formato: fmt },
    { id: 'g9', icon: 'ri-door-open-line', titulo: { es: '9 puertas abiertas', en: '9 open doors' }, actual: puertas, objetivo: 9, formato: fmt },
    { id: 't500', icon: 'ri-rocket-2-line', titulo: { es: '500 M en 30 días', en: '500 M in 30 days' }, actual: tokens30d, objetivo: 500_000_000, formato: fmtCorto },
    { id: 'p1000', icon: 'ri-group-line', titulo: { es: '1.000 personas', en: '1,000 people' }, actual: fichas, objetivo: 1000, formato: fmt },
    { id: 'm1000', icon: 'ri-tools-line', titulo: { es: '1.000 mejoras', en: '1,000 improvements' }, actual: mejoras, objetivo: 1000, formato: fmt },
    { id: 'd365', icon: 'ri-calendar-todo-line', titulo: { es: 'un año de vida', en: 'one year alive' }, actual: diasVida, objetivo: 365, formato: fmt }
  ]

  return (
    <Card>
      <CardContent className='flex flex-col gap-4'>
        <div className='flex flex-wrap items-baseline justify-between gap-2'>
          <Typography variant='h6'>{t('ins_titulo')}</Typography>
          <Typography variant='caption' color='text.disabled'>{t('ins_caption')}</Typography>
        </div>
        <Grid container spacing={4}>
          {INSIGNIAS.map(ins => {
            const desbloqueada = ins.actual >= ins.objetivo

            return (
              <Grid key={ins.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Card
                  variant='outlined'
                  className='bs-full fo-card-hover'
                  sx={desbloqueada ? { borderColor: 'success.main' } : { borderStyle: 'dashed' }}
                >
                  <CardContent className='flex flex-col gap-2'>
                    <div className='flex items-center justify-between'>
                      <CustomAvatar
                        color={desbloqueada ? 'success' : 'secondary'}
                        skin='light'
                        size={40}
                        variant='rounded'
                        sx={desbloqueada ? undefined : { opacity: 0.7 }}
                      >
                        <i className={`${ins.icon} text-xl`} />
                      </CustomAvatar>
                      {desbloqueada && (
                        <Chip size='small' color='success' variant='tonal' icon={<i className='ri-check-line' />} label={t('ins_ok')} />
                      )}
                    </div>
                    <Typography variant='subtitle1' fontWeight={600}>{ins.titulo[lang]}</Typography>
                    {desbloqueada ? (
                      <Typography variant='caption' color='text.secondary' className='font-mono'>
                        {ins.formato(ins.actual)}
                      </Typography>
                    ) : (
                      <div className='flex flex-col gap-1'>
                        <LinearProgress
                          variant='determinate'
                          value={Math.min(100, (ins.actual / ins.objetivo) * 100)}
                          color='primary'
                          aria-label={`${ins.titulo[lang]}: ${ins.formato(ins.actual)} / ${ins.formato(ins.objetivo)}`}
                        />
                        <Typography variant='caption' color='text.disabled' className='font-mono'>
                          {ins.formato(ins.actual)} / {ins.formato(ins.objetivo)}
                        </Typography>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default Insignias
