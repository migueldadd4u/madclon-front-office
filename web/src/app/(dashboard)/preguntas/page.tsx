'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'

// Hook Imports
import { useLang } from '@/lib/i18n'

const PREGUNTAS = [
  {
    es: {
      q: '¿Qué es exactamente el Clon de MAD?',
      a: 'Un equipo de programas de inteligencia artificial que trabaja para Miguel Ángel Delgado (MAD) las 24 horas. Lee lo que llega (correo, WhatsApp, notas), lo clasifica, prepara respuestas y dossieres, y deja las decisiones importantes listas para que el humano solo tenga que decir sí o no.'
    },
    en: {
      q: 'What exactly is the MAD Clone?',
      a: 'A team of artificial intelligence programs working for Miguel Ángel Delgado (MAD) 24 hours a day. It reads what arrives (mail, WhatsApp, notes), sorts it, prepares replies and dossiers, and leaves the important decisions ready so the human only has to say yes or no.'
    }
  },
  {
    es: {
      q: '¿El clon decide cosas por su cuenta?',
      a: 'No. El Clon propone; MAD dispone. Todo lo que toca a otras personas — enviar un correo, aceptar una cita, mover un euro — pasa antes por la aprobación humana. El Clon prepara el trabajo; la firma es siempre de MAD.'
    },
    en: {
      q: 'Does the clone decide things on its own?',
      a: "No. The clone proposes; MAD disposes. Anything that touches other people — sending an email, accepting a meeting, moving a euro — goes through human approval first. The clone prepares the work; the signature is always MAD's."
    }
  },
  {
    es: {
      q: '¿Qué son los «tokens» que aparecen por todas partes?',
      a: 'La unidad de trabajo de la IA. Léelo como «palabras pensadas»: cada vez que el clon lee un correo o redacta un borrador, gasta tokens. Medirlos es medir cuánto trabaja el sistema — igual que los kilómetros de un coche.'
    },
    en: {
      q: 'What are the «tokens» shown everywhere?',
      a: "The unit of AI work. Read it as «words thought»: every time the clone reads an email or drafts a reply, it spends tokens. Measuring them means measuring how much the system works — like a car's kilometres."
    }
  },
  {
    es: {
      q: '¿Cuánto trabaja realmente?',
      a: 'Las cifras de esta web lo dicen en directo: cientos de millones de tokens al mes, una decena de rutinas automáticas cada día y una flota de siete clones especializados (correo, patrimonio, operaciones, ideas…). El panel se regenera solo cada noche.'
    },
    en: {
      q: 'How much does it actually work?',
      a: 'The figures on this website say it live: hundreds of millions of tokens a month, about a dozen automatic routines every day and a fleet of seven specialized clones (mail, assets, operations, ideas…). The dashboard regenerates itself every night.'
    }
  },
  {
    es: {
      q: '¿Mis datos están seguros?',
      a: 'Esta web pública solo muestra cifras agregadas del sistema: cuánto trabaja, cuánto falla, cuántas rutinas van en verde. Jamás aparecen nombres, correos, mensajes ni nada personal. Los datos vivos viven en la memoria privada del sistema (el «vault»), que no sale del equipo de MAD.'
    },
    en: {
      q: 'Is my data safe?',
      a: "This public website only shows aggregated system figures: how much it works, how often it fails, how many routines are green. Names, emails, messages or anything personal never appear. Live data lives in the system's private memory (the «vault»), which never leaves MAD's machine."
    }
  },
  {
    es: {
      q: '¿Qué es eso de que «se mejora a sí mismo»?',
      a: 'Cada noche el clon audita su propio trabajo: qué falló, qué se puede hacer con menos gasto, qué rutina conviene ajustar. Propone mejoras y muchas se aplican solas en horario nocturno; las delicadas esperan el visto bueno humano. Por eso la web cambia un poco cada día.'
    },
    en: {
      q: 'What is this «it improves itself» thing?',
      a: 'Every night the clone audits its own work: what failed, what can be done cheaper, which routine should be adjusted. It proposes improvements and many are applied by themselves overnight; the sensitive ones wait for human approval. That is why the website changes a little every day.'
    }
  },
  {
    es: {
      q: '¿Qué pasa si algo se rompe?',
      a: 'El sistema se vigila a sí mismo con un guardián que comprueba integraciones, puertas de entrada y rutinas cada pocos minutos. Si algo falla, queda marcado en la página de Salud y salta un aviso. La frase de estado de la portada te lo cuenta en lenguaje normal.'
    },
    en: {
      q: 'What happens if something breaks?',
      a: 'The system watches itself with a watchdog that checks integrations, entry doors and routines every few minutes. If something fails, it gets flagged on the Health page and an alert goes off. The status sentence on the home page tells you in plain language.'
    }
  },
  {
    es: {
      q: '¿Por qué existe esta web?',
      a: 'Porque el clon vivía escondido en paneles técnicos que solo entiende quien lo construyó. Este Front Office traduce esos mismos números a algo que cualquiera — familia, socios, curiosos — puede entender de un vistazo, sin saber qué es un «second brain».'
    },
    en: {
      q: 'Why does this website exist?',
      a: 'Because the clone lived hidden in technical dashboards that only its builder could read. This Front Office translates those same numbers into something anyone — family, partners, the curious — can understand at a glance, without knowing what a «second brain» is.'
    }
  }
]

const PreguntasPage = () => {
  const { lang, t } = useLang()

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <Card>
          <CardContent className='flex flex-col gap-2'>
            <Typography variant='h4'>{t('faq_titulo')}</Typography>
            <Typography color='text.secondary' className='max-is-2xl'>
              {t('faq_intro')}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, lg: 10, xl: 8 }}>
        {PREGUNTAS.map((p, i) => (
          <Accordion key={p.es.q} defaultExpanded={i === 0}>
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line text-xl' />}>
              <Typography fontWeight={600}>{p[lang].q}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color='text.secondary'>{p[lang].a}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Grid>
    </Grid>
  )
}

export default PreguntasPage
