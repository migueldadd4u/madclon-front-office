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
const FECHA_GUION = '2026-10-20'

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
    demo: 'Un correo, una respuesta preparada y una decisión tuya',
    rotulo: 'Demostración sintética',
    aviso: 'El correo, la nota, la agenda y las salidas de este caso son inventados para explicar el recorrido. No son un correo real ni un resultado de cliente. Esta página no envía mensajes ni reserva citas.',
    fecha: 'Guion del {fecha} · fuentes: correo, nota y agenda ficticios que puedes leer aquí.',
    mensajeTitulo: '1. Qué llega',
    mensaje: 'Somos el equipo de una asociación. Queremos ordenar las solicitudes que recibimos por correo y formulario: algunas se nos duplican. ¿Podemos reunirnos el jueves a las 10:00 para ver por dónde empezar?',
    fuentesTitulo: 'Las tres fuentes del ejemplo',
    fuentes: [
      {
        titulo: 'Correo recibido',
        texto: 'El mensaje de la asociación que acabas de leer: pide ayuda y propone el jueves a las 10:00.'
      },
      {
        titulo: 'Nota adjunta',
        texto: 'Las solicitudes se copian a una hoja compartida y algunas se duplican. La asociación todavía no ha autorizado el acceso a su buzón.'
      },
      {
        titulo: 'Agenda ficticia autorizada',
        texto: 'Jueves: de 10:00 a 11:00, ocupado. De 11:30 a 12:00, libre. Solo se usan estas franjas suministradas para el ejemplo.'
      }
    ],
    como: '2. Qué hace el clon',
    pasos: [
      {
        titulo: 'Extrae la petición',
        texto: 'Separa dos asuntos: estudiar las solicitudes duplicadas y responder a la propuesta de reunión. Los registra juntos para conservar el contexto.'
      },
      {
        titulo: 'Contrasta el horario',
        texto: 'Compara las 10:00 del correo con la agenda y encuentra el conflicto. Propone las 11:30, que sí figuran libres; no reserva ese hueco.'
      },
      {
        titulo: 'Prepara la respuesta con lo que falta',
        texto: 'La nota no dice cuántas solicitudes llegan. En vez de prometer una automatización, pide el volumen semanal y tres ejemplos sin datos personales para preparar la primera conversación.'
      }
    ],
    entregaTitulo: '3. Qué entrega',
    entradaTitulo: 'Ficha de seguimiento',
    origen: 'Fuentes',
    origenValor: 'Correo + nota adjunta + franjas de agenda de este ejemplo.',
    peticion: 'Asunto',
    peticionValor: 'Revisar cómo evitar solicitudes duplicadas en la asociación.',
    gesto: 'Siguiente paso',
    gestoValor: 'Revisar el borrador, decidir si propones las 11:30 y pedir tres ejemplos sin datos personales.',
    falta: 'Información pendiente',
    faltaValor: 'Volumen semanal de solicitudes y ejemplos del problema. Sin ellos todavía no hay base para proponer una solución concreta.',
    decisionTitulo: 'Borrador de respuesta',
    respuesta: 'Gracias por escribir. El jueves a las 10:00 no puedo; os propongo las 11:30 para una primera conversación de 30 minutos.\n\nPara prepararla, ¿podéis indicar cuántas solicitudes recibís por semana y enviar tres ejemplos sin datos personales? En la reunión revisaremos dónde se duplican y elegiremos un primer paso.',
    humano: '4. Qué decides tú',
    decisiones: [
      'Si te interesa esa primera conversación y aceptas proponer el jueves a las 11:30.',
      'Si procede pedir el volumen semanal y los tres ejemplos sin datos personales.',
      'Qué cambiar en el borrador antes de enviarlo tú desde tu correo. Prepararlo no autoriza al clon a enviarlo ni a reservar la reunión.'
    ],
    cierreTitulo: 'Cómo termina este caso ficticio',
    cierre: 'En este ejemplo eliges proponer las 11:30, apruebas la petición de muestras y envías tú la respuesta revisada. Ya tienes una ficha y un texto concreto; el correo inicial queda respondido.',
    estadoFinal: 'Estado final del ejemplo: respuesta enviada por la persona; reunión pendiente de confirmación de la asociación. No se da por confirmada solo por proponer una hora.',
    limitesEjemplo: 'Ver los límites de este ejemplo',
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
    demo: 'One email, a prepared reply and your decision',
    rotulo: 'Synthetic demonstration',
    aviso: 'The email, note, calendar and outputs in this case were invented to explain the workflow. They are not a real email or a client result. This page does not send messages or book meetings.',
    fecha: 'Script dated {fecha} · sources: the fictional email, note and calendar shown here.',
    mensajeTitulo: '1. What comes in',
    mensaje: 'We are the team at an association. We want to organise requests received by email and through our form: some are duplicates. Could we meet on Thursday at 10:00 to discuss where to start?',
    fuentesTitulo: 'The three sources in this example',
    fuentes: [
      {
        titulo: 'Incoming email',
        texto: 'The association’s message above: it asks for help and proposes Thursday at 10:00.'
      },
      {
        titulo: 'Attached note',
        texto: 'Requests are copied into a shared spreadsheet; some are duplicates. Access to the association’s mailbox has not yet been authorised.'
      },
      {
        titulo: 'Authorised sample calendar',
        texto: 'Thursday: 10:00–11:00 is busy; 11:30–12:00 is free. Only these supplied time slots are used in the example.'
      }
    ],
    como: '2. What the clone does',
    pasos: [
      {
        titulo: 'Extracts the request',
        texto: 'It separates two matters: examining duplicate requests and replying to the meeting proposal. It records them together to preserve the context.'
      },
      {
        titulo: 'Checks the time',
        texto: 'It compares 10:00 in the email with the calendar and finds the conflict. It proposes 11:30, which is listed as free; it does not book the slot.'
      },
      {
        titulo: 'Drafts a reply that asks for missing information',
        texto: 'The note does not say how many requests arrive. Instead of promising automation, it asks for the weekly volume and three examples without personal data to prepare the first conversation.'
      }
    ],
    entregaTitulo: '3. What it delivers',
    entradaTitulo: 'Follow-up record',
    origen: 'Sources',
    origenValor: 'Email + attached note + sample calendar slots.',
    peticion: 'Subject',
    peticionValor: 'Review how to avoid duplicate requests at the association.',
    gesto: 'Next step',
    gestoValor: 'Review the draft, decide whether to propose 11:30 and request three examples without personal data.',
    falta: 'Missing information',
    faltaValor: 'Weekly request volume and examples of the problem. Without them, there is not yet a basis for proposing a specific solution.',
    decisionTitulo: 'Draft reply',
    respuesta: 'Thank you for getting in touch. Thursday at 10:00 does not work for me; I suggest 11:30 for an initial 30-minute conversation.\n\nTo help us prepare, please tell us how many requests you receive each week and send three examples without personal data. We will review where duplicates occur and choose a first step.',
    humano: '4. What you decide',
    decisiones: [
      'Whether this first conversation is useful and you agree to propose Thursday at 11:30.',
      'Whether to ask for the weekly volume and three examples without personal data.',
      'What to change in the draft before sending it yourself from your email. Preparing it does not authorise the clone to send it or book the meeting.'
    ],
    cierreTitulo: 'How this fictional case ends',
    cierre: 'In this example, you choose to propose 11:30, approve the request for samples and send the reviewed reply yourself. You have a record and a concrete message; the incoming email has been answered.',
    estadoFinal: 'Final status of the example: reply sent by the person; meeting awaiting confirmation from the association. Proposing a time does not confirm it.',
    limitesEjemplo: 'See the limits of this example',
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
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card component='article' aria-labelledby='demo-llega' sx={{ height: '100%' }} data-demo-etapa='1'>
              <CardContent>
                <Typography component='h3' variant='h6' id='demo-llega'>{c.mensajeTitulo}</Typography>
                <Box component='blockquote' id='mensaje-sintetico' sx={{ m: 0, my: 3, pl: 3, borderInlineStart: '3px solid', borderColor: 'primary.main' }}>
                  {c.mensaje}
                </Box>
                <Typography component='h4' variant='subtitle1' sx={{ mb: 2 }}>{c.fuentesTitulo}</Typography>
                <Box data-demo-fuentes>{campos(c.fuentes.map(fuente => [fuente.titulo, fuente.texto] as const))}</Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card component='article' aria-labelledby='como-funciona' sx={{ height: '100%' }} data-demo-etapa='2'>
              <CardContent>
                <Typography component='h3' variant='h6' id='como-funciona' tabIndex={-1} sx={ancla}>{c.como}</Typography>
                <Timeline sx={{ p: 0, mt: 3, mb: 0, '& .MuiTimelineItem-root:before': { display: 'none' } }}>
                  {c.pasos.map((paso, indice) => (
                    <TimelineItem key={paso.titulo}>
                      <TimelineSeparator>
                        <TimelineDot variant='outlined' color='primary' sx={{ px: 2, boxShadow: 'none', fontWeight: 700 }}>{indice + 1}</TimelineDot>
                        {indice < c.pasos.length - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent sx={{ pt: 2, pb: 3 }}>
                        <Typography component='h4' variant='subtitle1'>{paso.titulo}</Typography>
                        <Typography color='text.secondary' sx={{ mt: 1 }}>{paso.texto}</Typography>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card component='article' aria-labelledby='demo-entrega' sx={{ height: '100%' }} data-demo-etapa='3'>
              <CardContent>
                <Typography component='h3' variant='h6' id='demo-entrega' sx={{ mb: 3 }}>{c.entregaTitulo}</Typography>
                <Typography component='h4' variant='subtitle1' id='ejemplo-entrada' tabIndex={-1} sx={{ ...ancla, mb: 2 }}>{c.entradaTitulo}</Typography>
                {campos([[c.origen, c.origenValor], [c.peticion, c.peticionValor], [c.gesto, c.gestoValor], [c.falta, c.faltaValor]])}
                <Typography component='h4' variant='subtitle1' id='ejemplo-decision' tabIndex={-1} sx={{ ...ancla, mt: 4, mb: 2 }}>{c.decisionTitulo}</Typography>
                <Box component='blockquote' data-demo-borrador sx={{ m: 0, p: 3, bgcolor: 'action.hover', borderRadius: 1, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{c.respuesta}</Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card component='article' aria-labelledby='demo-decision-humana' sx={{ height: '100%' }} data-demo-etapa='4'>
              <CardContent>
                <Typography component='h3' variant='h6' id='demo-decision-humana'>{c.humano}</Typography>
                <Box component='ul' sx={{ pl: 3, my: 3, display: 'grid', gap: 2 }}>
                  {c.decisiones.map(decision => <li key={decision}>{decision}</li>)}
                </Box>
                <Typography component='h4' variant='subtitle1'>{c.cierreTitulo}</Typography>
                <Typography color='text.secondary' sx={{ mt: 2 }}>{c.cierre}</Typography>
                <Box data-demo-estado-final sx={{ mt: 3, p: 3, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography fontWeight={600}>{c.estadoFinal}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        <Button component={Link} href='#limites-privacidad' variant='text' color='inherit' sx={{ mt: 4, minBlockSize: 48, ...foco }}>{c.limitesEjemplo}</Button>
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
