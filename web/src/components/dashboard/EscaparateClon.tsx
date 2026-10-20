'use client'

import { useEffect, useRef } from 'react'

import Link from 'next/link'

import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Timeline from '@mui/lab/Timeline'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineSeparator from '@mui/lab/TimelineSeparator'

import { useLang } from '@/lib/i18n'

// Fecha editorial del guion, compartida por time y su presentación localizada.
// No es una métrica del sistema ni una fecha ficticia de un mensaje de cliente.
const FECHA_GUION = '2026-10-18'

// Guion editorial sintético: no consume ni reproduce información privada.
const COPY = {
  es: {
    titulo: '¿En qué podría ayudarte?',
    intro:
      'Empieza por un proceso acotado. Mira qué prepara el clon y qué tendrías que comprobar antes de valorar un piloto.',
    salida: 'Qué entrega',
    capacidades: [
      {
        icono: 'ri-inbox-line',
        titulo: 'Ordenar lo que llega',
        problema: 'Correos y notas repartidos, sin un siguiente paso claro.',
        resultado: 'Una entrada con origen, petición y siguiente gesto.',
        enlace: 'Ver una entrada de ejemplo',
        href: '#ejemplo-entrada'
      },
      {
        icono: 'ri-file-search-line',
        titulo: 'Preparar una decisión',
        problema: 'Material que hay que reunir y revisar antes de decidir.',
        resultado: 'Una propuesta con su fuente, dudas y límites para revisar.',
        enlace: 'Ver una propuesta de ejemplo',
        href: '#ejemplo-decision'
      },
      {
        icono: 'ri-focus-3-line',
        titulo: 'Seguir un trabajo',
        problema: 'Trabajos abiertos sin saber qué falta para terminarlos.',
        resultado: 'Un reto con pasos, avance y fecha del dato.',
        enlace: 'Ver los retos públicos',
        href: '/retos/'
      }
    ],
    demo: 'Una petición, un resultado que puedes revisar',
    rotulo: 'Demostración sintética',
    aviso:
      'Este mensaje y sus salidas son inventados para explicar el recorrido. No son un correo real ni un resultado de cliente.',
    fecha: 'Guion del {fecha} · fuente: mensaje de ejemplo de esta página.',
    mensajeTitulo: 'Lo que llega',
    mensaje:
      'Tenemos una propuesta para revisar. Reúne los antecedentes e indica qué información falta antes de decidir.',
    entradaTitulo: 'Una entrada ordenada',
    origen: 'Origen',
    origenValor: 'Mensaje sintético de esta página',
    peticion: 'Petición',
    peticionValor: 'Preparar la revisión de una propuesta.',
    gesto: 'Siguiente paso propuesto',
    gestoValor: 'Reunir la propuesta y sus antecedentes autorizados.',
    decisionTitulo: 'Una propuesta para revisar',
    fuente: 'Fuente disponible',
    fuenteValor: 'Solo el mensaje de ejemplo.',
    falta: 'Qué falta',
    faltaValor: 'No se ha adjuntado la propuesta ni sus antecedentes. No hay base para recomendar su aprobación.',
    humano: 'Revisión humana pendiente',
    humanoValor: 'Confirmar la documentación necesaria y el criterio para decidir. No se ha enviado ninguna petición.',
    limitesEjemplo: 'Ver los límites de este ejemplo',
    como: 'Cómo funciona, con una persona al mando',
    pasos: [
      {
        titulo: 'Captura con procedencia',
        texto: 'El punto de partida es una entrada y su fuente. En este ejemplo puedes leer el mensaje completo arriba.'
      },
      {
        titulo: 'Prepara y muestra lo que falta',
        texto:
          'La propuesta separa la petición, el siguiente paso y las dudas. Una fuente insuficiente no se convierte en una certeza.'
      },
      {
        titulo: 'La persona revisa y decide',
        texto:
          'El humano comprueba el material y aprueba los envíos y decisiones que le corresponden. La IA puede equivocarse.'
      }
    ],
    limites: 'Qué puedes comprobar y cuáles son los límites',
    preguntas: [
      {
        titulo: '¿Qué demuestra este ejemplo?',
        texto:
          'El formato de una entrada y una propuesta revisable. Es una ilustración: no acredita precisión de la IA, conexión con tus canales, ahorro ni resultados comerciales. Los retos públicos muestran su propio estado y fecha; un trabajo en curso no es un éxito de cliente.'
      },
      {
        titulo: '¿Qué se publica de mis datos?',
        texto:
          'Esta demostración no utiliza información de terceros. La web muestra cifras agregadas y los retos que tienen autorización para contarse. Los mensajes, documentos y fichas privadas no forman parte de este ejemplo. Si una fuente pública no llega o no valida, su sección queda en revisión.'
      },
      {
        titulo: '¿Qué habría que acordar antes de un piloto?',
        texto:
          'Un canal, un tipo de entrada y un resultado concreto. Después, material autorizado y un criterio para que una persona compruebe si la salida es útil. La revisión, los permisos y el alcance se acuerdan antes de conectar datos; aquí no se ofrece un precio ni un plazo de respuesta.'
      }
    ],
    siguiente: 'Explora los retos públicos',
    siguienteTexto:
      'Retos permite ver trabajos autorizados y qué falta para cerrarlos. Para explorar una colaboración, identifica un proceso parecido y el resultado que necesitarías comprobar.',
    cta: 'Ver retos públicos',
    faq: 'Más preguntas sobre el clon'
  },
  en: {
    titulo: 'Where could it help you?',
    intro:
      'Start with one bounded process. See what the clone prepares and what you would need to check before considering a pilot.',
    salida: 'What you get',
    capacidades: [
      {
        icono: 'ri-inbox-line',
        titulo: 'Organize incoming information',
        problema: 'Scattered emails and notes, with no clear next step.',
        resultado: 'An entry with its origin, request and proposed next step.',
        enlace: 'See a sample entry',
        href: '#ejemplo-entrada'
      },
      {
        icono: 'ri-file-search-line',
        titulo: 'Prepare a decision',
        problema: 'Material that needs gathering and reviewing before deciding.',
        resultado: 'A proposal with its source, uncertainties and limits to review.',
        enlace: 'See a sample proposal',
        href: '#ejemplo-decision'
      },
      {
        icono: 'ri-focus-3-line',
        titulo: 'Follow a piece of work',
        problema: 'Open work without a clear view of what remains.',
        resultado: 'A challenge with steps, progress and the date of the data.',
        enlace: 'See the public challenges',
        href: '/retos/'
      }
    ],
    demo: 'One request, an output you can review',
    rotulo: 'Synthetic demonstration',
    aviso:
      'This message and its outputs were invented to explain the workflow. They are not a real email or a client result.',
    fecha: 'Script dated {fecha} · source: the sample message on this page.',
    mensajeTitulo: 'What comes in',
    mensaje:
      'We have a proposal to review. Gather the background and identify what information is missing before deciding.',
    entradaTitulo: 'An organized entry',
    origen: 'Origin',
    origenValor: 'Synthetic message on this page',
    peticion: 'Request',
    peticionValor: 'Prepare the review of a proposal.',
    gesto: 'Proposed next step',
    gestoValor: 'Gather the proposal and its authorized background material.',
    decisionTitulo: 'A proposal to review',
    fuente: 'Available source',
    fuenteValor: 'Only the sample message.',
    falta: 'What is missing',
    faltaValor: 'Neither the proposal nor its background is attached. There is no basis to recommend approval.',
    humano: 'Human review pending',
    humanoValor: 'Confirm the required documents and the decision criteria. No request has been sent.',
    limitesEjemplo: 'See the limits of this example',
    como: 'How it works, with a person in control',
    pasos: [
      {
        titulo: 'Capture with provenance',
        texto:
          'The starting point is an entry and its source. In this example, you can read the complete message above.'
      },
      {
        titulo: 'Prepare and show what is missing',
        texto:
          'The proposal separates the request, next step and uncertainties. An insufficient source does not become a certainty.'
      },
      {
        titulo: 'A person reviews and decides',
        texto:
          'The human checks the material and approves the messages and decisions that require their authority. AI can make mistakes.'
      }
    ],
    limites: 'What you can check and what the limits are',
    preguntas: [
      {
        titulo: 'What does this example demonstrate?',
        texto:
          'The format of an entry and a reviewable proposal. It is an illustration: it does not establish AI accuracy, integration with your channels, savings or commercial results. Public challenges show their own status and date; work in progress is not a client success.'
      },
      {
        titulo: 'What is published from my data?',
        texto:
          'This demonstration uses no third-party information. The website shows aggregate figures and challenges authorized for publication. Private messages, documents and records are not part of this example. If a public source is unavailable or invalid, its section remains under review.'
      },
      {
        titulo: 'What needs agreeing before a pilot?',
        texto:
          'One channel, one type of entry and one concrete output. Then, authorized material and criteria for a person to check whether the output is useful. Review, permissions and scope are agreed before connecting data; this page offers no price or response deadline.'
      }
    ],
    siguiente: 'Explore public challenges',
    siguienteTexto:
      'Challenges lets you see authorized work and what remains to close it. To explore a collaboration, identify a similar process and the output you would need to check.',
    cta: 'View public challenges',
    faq: 'More questions about the clone'
  }
} as const

const ancla = {
  scrollMarginBlockStart: 100,
  '&:focus': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 4 }
}

const foco = { '&.Mui-focusVisible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: 3 } }

const EscaparateClon = () => {
  const { lang } = useLang()
  const c = COPY[lang]
  const demostracionRef = useRef<HTMLHeadingElement>(null)
  const limitesRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    let frame: number | undefined

    const sincronizarAncla = () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame)

      frame = window.requestAnimationFrame(() => {
        frame = undefined

        if (window.location.pathname !== `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/`) return

        const destino = window.location.hash === '#demostracion'
          ? demostracionRef.current
          : window.location.hash === '#limites-privacidad' ? limitesRef.current : null

        if (!destino?.isConnected) return

        destino.scrollIntoView({ behavior: 'instant', block: 'start' })
        destino.focus({ preventScroll: true })
      })
    }

    window.addEventListener('popstate', sincronizarAncla)
    window.addEventListener('hashchange', sincronizarAncla)
    sincronizarAncla()

    return () => {
      window.removeEventListener('popstate', sincronizarAncla)
      window.removeEventListener('hashchange', sincronizarAncla)
      if (frame !== undefined) window.cancelAnimationFrame(frame)
    }
  }, [])

  const campos = (items: readonly (readonly [string, string])[]) => (
    <Box
      component='dl'
      sx={{
        m: 0,
        display: 'grid',
        gap: 2,
        '& dt': { fontWeight: 600 },
        '& dd': { m: 0, color: 'text.secondary', overflowWrap: 'anywhere' }
      }}
    >
      {items.map(([titulo, texto]) => (
        <div key={titulo}>
          <dt>{titulo}</dt>
          <dd>{texto}</dd>
        </div>
      ))}
    </Box>
  )

  return (
    <Box sx={{ display: 'grid', gap: 8 }} data-escaparate-clon>
      <section aria-labelledby='capacidades-titulo'>
        <Typography component='h2' variant='h4' id='capacidades-titulo'>
          {c.titulo}
        </Typography>
        <Typography color='text.secondary' sx={{ mt: 2, mb: 4, maxInlineSize: '75ch' }}>
          {c.intro}
        </Typography>
        <Grid container spacing={4}>
          {c.capacidades.map(capacidad => (
            <Grid size={{ xs: 12, md: 4 }} key={capacidad.href}>
              <Card sx={{ height: '100%', overflow: 'visible' }}>
                <CardActionArea
                  component={Link}
                  href={capacidad.href}
                  sx={{ ...foco, height: '100%', borderRadius: 'inherit' }}
                >
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
                    <i className={`${capacidad.icono} text-3xl text-primary`} aria-hidden='true' />
                    <Typography component='h3' variant='h6'>
                      {capacidad.titulo}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {capacidad.problema}
                    </Typography>
                    <Typography variant='body2'>
                      <strong>{c.salida}: </strong>
                      {capacidad.resultado}
                    </Typography>
                    <Typography
                      component='span'
                      variant='body2'
                      color='text.primary'
                      sx={{ mt: 'auto', pt: 2, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}
                    >
                      {capacidad.enlace} <span aria-hidden='true'>→</span>
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </section>

      <section aria-labelledby='demostracion'>
        <Typography ref={demostracionRef} component='h2' variant='h4' id='demostracion' tabIndex={-1} sx={ancla}>
          {c.demo}
        </Typography>
        <Alert severity='info' sx={{ mt: 3, mb: 3 }} data-demo-sintetica>
          <Typography fontWeight={600}>{c.rotulo}</Typography>
          <Typography variant='body2'>{c.aviso}</Typography>
        </Alert>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
          <time dateTime={FECHA_GUION}>{c.fecha.replace('{fecha}', new Date(`${FECHA_GUION}T12:00:00Z`).toLocaleDateString(lang === 'en' ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid' }))}</time>
        </Typography>
        <Card variant='outlined' sx={{ mb: 4 }}>
          <CardContent>
            <Typography component='h3' variant='h6'>
              {c.mensajeTitulo}
            </Typography>
            <Box
              component='blockquote'
              id='mensaje-sintetico'
              sx={{ m: 0, mt: 2, pl: 3, borderInlineStart: '3px solid', borderColor: 'primary.main' }}
            >
              {c.mensaje}
            </Box>
          </CardContent>
        </Card>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography component='h3' variant='h6' id='ejemplo-entrada' tabIndex={-1} sx={{ ...ancla, mb: 3 }}>
                  {c.entradaTitulo}
                </Typography>
                {campos([
                  [c.origen, c.origenValor],
                  [c.peticion, c.peticionValor],
                  [c.gesto, c.gestoValor]
                ])}
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography component='h3' variant='h6' id='ejemplo-decision' tabIndex={-1} sx={{ ...ancla, mb: 3 }}>
                  {c.decisionTitulo}
                </Typography>
                {campos([
                  [c.fuente, c.fuenteValor],
                  [c.falta, c.faltaValor],
                  [c.humano, c.humanoValor]
                ])}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        <Button component={Link} href='#limites-privacidad' variant='text' color='inherit' sx={{ mt: 4, minBlockSize: 48, ...foco }}>
          {c.limitesEjemplo}
        </Button>
      </section>

      <section aria-labelledby='como-funciona'>
        <Typography component='h2' variant='h4' id='como-funciona' tabIndex={-1} sx={ancla}>
          {c.como}
        </Typography>
        <Timeline sx={{ p: 0, mt: 4, mb: 0, '& .MuiTimelineItem-root:before': { display: 'none' } }}>
          {c.pasos.map((paso, indice) => (
            <TimelineItem key={paso.titulo}>
              <TimelineSeparator>
                <TimelineDot variant='outlined' color='primary' sx={{ px: 2, boxShadow: 'none', fontWeight: 700 }}>
                  {indice + 1}
                </TimelineDot>
                {indice < c.pasos.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent sx={{ pt: 2, pb: 4 }}>
                <Typography component='h3' variant='h6'>
                  {paso.titulo}
                </Typography>
                <Typography color='text.secondary' sx={{ mt: 1, maxInlineSize: '75ch' }}>
                  {paso.texto}
                </Typography>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </section>

      <section aria-labelledby='limites-privacidad'>
        <Typography ref={limitesRef} component='h2' variant='h4' id='limites-privacidad' tabIndex={-1} sx={{ ...ancla, mb: 4 }}>
          {c.limites}
        </Typography>
        {c.preguntas.map((pregunta, indice) => (
          <Accordion key={pregunta.titulo} defaultExpanded={indice === 0}>
            <AccordionSummary
              id={`limite-${indice}-cabecera`}
              aria-controls={`limite-${indice}-contenido`}
              expandIcon={<i className='ri-arrow-down-s-line' aria-hidden='true' />}
              sx={{ minBlockSize: 56, ...foco }}
            >
              <Typography component='span' fontWeight={600}>
                {pregunta.titulo}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color='text.secondary' sx={{ maxInlineSize: '85ch' }}>
                {pregunta.texto}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </section>

      <Card variant='outlined' component='section' aria-labelledby='siguiente-paso'>
        <CardContent sx={{ display: 'grid', gap: 3 }}>
          <Chip label='MAD Clon' variant='outlined' sx={{ justifySelf: 'start' }} />
          <Typography component='h2' variant='h4' id='siguiente-paso'>
            {c.siguiente}
          </Typography>
          <Typography color='text.secondary' sx={{ maxInlineSize: '75ch' }}>
            {c.siguienteTexto}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 3 }}>
            <Button component={Link} href='/retos/' variant='contained' sx={{ minBlockSize: 48, bgcolor: 'text.primary', color: 'background.paper', '&:hover': { bgcolor: 'text.primary' }, ...foco }}>
              {c.cta}
            </Button>
            <Button component={Link} href='/preguntas/' variant='text' color='inherit' sx={{ minBlockSize: 48, ...foco }}>
              {c.faq}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default EscaparateClon
