'use client'

// La página que cuenta para qué sirve el clon (arco «El escaparate cuenta el reto», 05/09/2026).
//
// Ni una palabra escrita aquí: TODO el texto sale de exporter/retos.md, horneado en el build
// (src/lib/copia-retos.ts). Y ni una cifra: en la fase 0 no hay retos suficientes para que una
// media signifique algo, así que la página lo dice en vez de adornar. Las cifras llegan en la
// fase 1, cuando el exportador publique el agregado anónimo.

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'

// Hook Imports
import { useLang } from '@/lib/i18n'

// Component Imports
import Link from '@/components/Link'

// Data Imports
import { RETOS_BUILD } from '@/lib/copia-retos'

/** Las cuatro alturas, de lo general a lo concreto, con su icono y su color. */
const ALTURAS = [
  { clave: 'altura-horizonte', icono: 'ri-mountain-line', color: 'primary' as const },
  { clave: 'altura-frente', icono: 'ri-flag-line', color: 'info' as const },
  { clave: 'altura-reto', icono: 'ri-focus-3-line', color: 'success' as const },
  { clave: 'altura-empujon', icono: 'ri-flashlight-line', color: 'warning' as const }
]

/** Lo que el clon NO hace. Va pegado a «cómo propone»: separarlos deja media verdad. */
const NO_HACE = ['no-hace-envia', 'no-hace-decide', 'no-hace-escribe', 'no-hace-datos']

const RetosPage = () => {
  const { lang } = useLang()

  const titulo = (clave: string) => RETOS_BUILD[clave]?.[`${lang}_titulo`] ?? ''
  const texto = (clave: string) => RETOS_BUILD[clave]?.[`${lang}_texto`] ?? ''

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <Card>
          <CardContent className='flex flex-col gap-2'>
            <Typography variant='h4'>{titulo('que-es')}</Typography>
            <Typography color='text.secondary' className='max-is-2xl'>
              {texto('que-es')}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, lg: 7 }}>
        <Card className='bs-full'>
          <CardContent className='flex flex-col gap-4'>
            <Typography variant='h5'>{titulo('metodo')}</Typography>
            <Typography color='text.secondary'>{texto('metodo')}</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, lg: 5 }}>
        <Card className='bs-full'>
          <CardContent className='flex flex-col gap-4'>
            <Typography variant='h5'>{titulo('su-momento')}</Typography>
            <Typography color='text.secondary'>{texto('su-momento')}</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={12}>
        <Card>
          <CardContent className='flex flex-col gap-4'>
            <Typography variant='h5'>{lang === 'es' ? 'Las alturas de un reto' : 'The heights of a challenge'}</Typography>
            <div data-alturas>
              {ALTURAS.map((a, i) => (
                <Accordion key={a.clave} defaultExpanded={i === 0}>
                  <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line text-xl' />}>
                    <div className='flex items-center gap-3'>
                      <Chip size='small' color={a.color} variant='tonal' icon={<i className={a.icono} />} label={titulo(a.clave)} />
                    </div>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography color='text.secondary'>{texto(a.clave)}</Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* «Cómo propone» y «lo que no hace» van SIEMPRE en la misma tarjeta: contado a medias,
          esto parece vigilancia. Lo vigila check-contrato (regla «el contrapeso no se separa»). */}
      <Grid size={12}>
        <Card data-como-propone>
          <CardContent className='flex flex-col gap-4'>
            <Typography variant='h5'>{titulo('como-propone')}</Typography>
            <Typography color='text.secondary' className='max-is-3xl'>
              {texto('como-propone')}
            </Typography>
            <Alert severity='info' icon={<i className='ri-scales-3-line' />}>
              <Typography fontWeight={600}>{titulo('limite')}</Typography>
              <Typography variant='body2'>{texto('limite')}</Typography>
            </Alert>
            <div data-no-hace>
              <Typography variant='h6' className='mbe-2'>
                {lang === 'es' ? 'Lo que el clon no hace' : 'What the clone does not do'}
              </Typography>
              <Grid container spacing={4}>
                {NO_HACE.map(clave => (
                  <Grid key={clave} size={{ xs: 12, md: 6 }}>
                    <div className='flex items-start gap-3'>
                      <i className='ri-close-circle-line text-xl text-error' />
                      <div>
                        <Typography fontWeight={600}>{titulo(clave)}</Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {texto(clave)}
                        </Typography>
                      </div>
                    </div>
                  </Grid>
                ))}
              </Grid>
            </div>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, lg: 7 }}>
        <Card className='bs-full'>
          <CardContent className='flex flex-col gap-4'>
            <Typography variant='h5'>{titulo('panel-privado')}</Typography>
            <Typography color='text.secondary'>{texto('panel-privado')}</Typography>
            <Typography variant='body2'>
              {/* Objetivo táctil ≥ 44 px (check 8 del gate). */}
              <Link href='/historia' className='inline-flex items-center min-bs-[44px]'>
                {lang === 'es' ? 'Cómo se llegó hasta aquí →' : 'How we got here →'}
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, lg: 5 }}>
        <Card className='bs-full' data-sin-cifras>
          <CardContent className='flex flex-col gap-4'>
            <Typography variant='h5'>{titulo('sin-cifras')}</Typography>
            <Typography color='text.secondary'>{texto('sin-cifras')}</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default RetosPage
