'use client'

// La página que cuenta para qué sirve el clon (arco «El escaparate cuenta el reto», 05/09/2026).
//
// Ni una palabra escrita aquí: TODO el texto sale de exporter/retos.md, horneado en el build
// (src/lib/copia-retos.ts). Y ninguna cifra a mano: desde la fase 7 de «cero a cien» (24/09/2026)
// el avance de los retos que su dueño deja contar llega en overview.retos, calculado por el panel
// privado y copiado tal cual por el exportador. Con menos de 5 no hay medias: cada reto es «un
// caso, no una estadística»; con 5, las cifras del agregado. Dato viejo o ausente: «en revisión».

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
import LinearProgress from '@mui/material/LinearProgress'

// Hook Imports
import { useLang } from '@/lib/i18n'
import { usePanelData } from '@/lib/data'
import type { RetoPublico, RetosPublicos } from '@/lib/data'

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

const ALTURA_DE: Record<RetoPublico['escala'], (typeof ALTURAS)[number]> = {
  horizonte: ALTURAS[0],
  frente: ALTURAS[1],
  reto: ALTURAS[2],
  empujon: ALTURAS[3]
}

/** Las cifras del agregado, en el orden en que se leen. Los valores vienen del dato. */
const CIFRAS = [
  { clave: 'cifra-vivos', campo: 'vivos' },
  { clave: 'cifra-terminados', campo: 'terminados' },
  { clave: 'cifra-medio', campo: 'avanceMedio', sufijo: ' %' },
  { clave: 'cifra-parado', campo: 'diasDelMasParado' }
] as const

/** Lo que el clon NO hace. Va pegado a «cómo propone»: separarlos deja media verdad. */
const NO_HACE = ['no-hace-envia', 'no-hace-decide', 'no-hace-escribe', 'no-hace-datos']

/** Traducción horneada de un título público (bloques `publico-<n>`); sin ella, el título tal cual. */
const tituloPublico = (titulo: string, lang: string) => {
  const bloque = Object.entries(RETOS_BUILD).find(([k, b]) => /^publico-\d+$/.test(k) && b.es_titulo === titulo)?.[1]

  return lang === 'en' && bloque ? { texto: bloque.en_titulo, lang: 'en' } : { texto: titulo, lang: 'es' }
}

const AvanceRetos = ({ bloque, cargando, lang, titulo, texto }: {
  bloque: RetosPublicos | undefined
  cargando: boolean
  lang: string
  titulo: (clave: string) => string
  texto: (clave: string) => string
}) => {
  if (cargando) return null

  if (!bloque || bloque.estado !== 'ok') {
    return (
      <Alert severity='info' role='status' data-retos-en-revision>
        <Typography fontWeight={600}>{titulo('avance-en-revision')}</Typography>
        <Typography variant='body2'>{texto('avance-en-revision')}</Typography>
      </Alert>
    )
  }

  const fecha = new Date(bloque.generado).toLocaleDateString(lang === 'en' ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  const agregado = bloque.agregado

  return (
    <div className='flex flex-col gap-4' data-retos-avance={bloque.retos.length}>
      {agregado ? (
        <Grid container spacing={4} data-retos-cifras>
          {CIFRAS.map(c => {
            const valor = agregado[c.campo]

            return (
              <Grid key={c.clave} size={{ xs: 6, md: 3 }}>
                <Typography variant='h4' component='p'>
                  {valor === null ? '—' : `${valor}${'sufijo' in c ? c.sufijo : ''}`}
                </Typography>
                <Typography fontWeight={600}>{titulo(c.clave)}</Typography>
                <Typography variant='body2' color='text.secondary'>{texto(c.clave)}</Typography>
              </Grid>
            )
          })}
        </Grid>
      ) : (
        <Alert severity='info' icon={<i className='ri-user-search-line' />} data-retos-caso>
          <Typography fontWeight={600}>{titulo('avance-caso')}</Typography>
          <Typography variant='body2'>{texto('avance-caso')}</Typography>
        </Alert>
      )}

      <ul className='flex flex-col gap-4 list-none p-0 m-0'>
        {bloque.retos.map(r => {
          const t = tituloPublico(r.titulo_publico, lang)
          const altura = ALTURA_DE[r.escala]

          return (
            <li key={r.titulo_publico} data-reto-publico>
              <div className='flex flex-wrap items-center gap-2 mbe-1'>
                <Typography component='h3' variant='h6' lang={t.lang}>{t.texto}</Typography>
                <Chip size='small' color={altura.color} variant='tonal' icon={<i className={altura.icono} />} label={titulo(altura.clave)} />
              </div>
              <div className='flex items-center gap-3'>
                <LinearProgress
                  variant='determinate'
                  value={r.porcentaje ?? 0}
                  className='flex-1'
                  aria-label={`${t.texto}: ${r.porcentaje ?? '—'} %`}
                />
                <Typography fontWeight={600} data-medida-porcentaje={r.porcentaje ?? ''}>
                  {r.porcentaje === null ? '—' : `${r.porcentaje} %`}
                </Typography>
              </div>
              <Typography variant='body2' color='text.secondary' data-retos-procedencia>
                {`${r.hechos}/${r.total} · ${texto('avance-procedencia')} ${fecha}`}
              </Typography>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const RetosPage = () => {
  const { lang } = useLang()
  const { data, cargando } = usePanelData()
  const retos = data.overview?.retos
  const conCifras = retos?.estado === 'ok' && retos.agregado !== null

  const titulo = (clave: string) => RETOS_BUILD[clave]?.[`${lang}_titulo`] ?? ''
  const texto = (clave: string) => RETOS_BUILD[clave]?.[`${lang}_texto`] ?? ''

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <Card>
          <CardContent className='flex flex-col gap-2'>
            <Typography component='h1' variant='h4'>{titulo('que-es')}</Typography>
            <Typography color='text.secondary' className='max-is-2xl'>
              {texto('que-es')}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={12}>
        <Card>
          <CardContent className='flex flex-col gap-4'>
            <Typography variant='h5' component='h2'>{titulo('avance')}</Typography>
            <Typography color='text.secondary' className='max-is-3xl'>
              {texto('avance')}
            </Typography>
            <AvanceRetos bloque={retos} cargando={cargando} lang={lang} titulo={titulo} texto={texto} />
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

      {/* Con 5 retos que se cuentan ya hay medias (arriba); hasta entonces, la página lo dice. */}
      {!conCifras && (
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card className='bs-full' data-sin-cifras>
            <CardContent className='flex flex-col gap-4'>
              <Typography variant='h5'>{titulo('sin-cifras')}</Typography>
              <Typography color='text.secondary'>{texto('sin-cifras')}</Typography>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  )
}

export default RetosPage
