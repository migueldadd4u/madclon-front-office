'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'

const PREGUNTAS = [
  {
    q: '¿Qué es exactamente el Clon de MAD?',
    a: 'Un equipo de programas de inteligencia artificial que trabaja para Miguel las 24 horas. Lee lo que llega (correo, WhatsApp, notas), lo clasifica, prepara respuestas y dossieres, y deja las decisiones importantes listas para que el humano solo tenga que decir sí o no.'
  },
  {
    q: '¿El clon decide cosas por su cuenta?',
    a: 'No. El clon propone; Miguel dispone. Todo lo que toca a otras personas — enviar un correo, aceptar una cita, mover un euro — pasa antes por la aprobación humana. El clon prepara el trabajo; la firma es siempre de Miguel.'
  },
  {
    q: '¿Qué son los «tokens» que aparecen por todas partes?',
    a: 'La unidad de trabajo de la IA. Léelo como «palabras pensadas»: cada vez que el clon lee un correo o redacta un borrador, gasta tokens. Medirlos es medir cuánto trabaja el sistema — igual que los kilómetros de un coche.'
  },
  {
    q: '¿Cuánto trabaja realmente?',
    a: 'Las cifras de esta web lo dicen en directo: cientos de millones de tokens al mes, una decena de rutinas automáticas cada día y una flota de siete clones especializados (correo, patrimonio, operaciones, ideas…). El panel se regenera solo cada noche.'
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'Esta web pública solo muestra cifras agregadas del sistema: cuánto trabaja, cuánto falla, cuántas rutinas van en verde. Jamás aparecen nombres, correos, mensajes ni nada personal. Los datos vivos viven en un vault privado que no sale del equipo de Miguel.'
  },
  {
    q: '¿Qué es eso de que «se mejora a sí mismo»?',
    a: 'Cada noche el clon audita su propio trabajo: qué falló, qué se puede hacer con menos gasto, qué rutina conviene ajustar. Propone mejoras y muchas se aplican solas en horario nocturno; las delicadas esperan el visto bueno humano. Por eso la web cambia un poco cada día.'
  },
  {
    q: '¿Qué pasa si algo se rompe?',
    a: 'El sistema se vigila a sí mismo con un guardián que comprueba integraciones, puertas de entrada y rutinas cada pocos minutos. Si algo falla, queda marcado en la página de Salud y salta un aviso. La frase de estado de la portada te lo cuenta en lenguaje normal.'
  },
  {
    q: '¿Por qué existe esta web?',
    a: 'Porque el clon vivía escondido en paneles técnicos que solo entiende quien lo construyó. Este Front Office traduce esos mismos números a algo que cualquiera — familia, socios, curiosos — puede entender de un vistazo, sin saber qué es un «second brain».'
  }
]

const PreguntasPage = () => (
  <Grid container spacing={6}>
    <Grid size={12}>
      <Card>
        <CardContent className='flex flex-col gap-2'>
          <Typography variant='h4'>Preguntas que la gente hace</Typography>
          <Typography color='text.secondary' className='max-is-2xl'>
            Lo que nos preguntan cuando enseñamos el clon por primera vez — respondido sin tecnicismos.
          </Typography>
        </CardContent>
      </Card>
    </Grid>
    <Grid size={{ xs: 12, lg: 10, xl: 8 }}>
      {PREGUNTAS.map((p, i) => (
        <Accordion key={p.q} defaultExpanded={i === 0}>
          <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line text-xl' />}>
            <Typography fontWeight={600}>{p.q}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography color='text.secondary'>{p.a}</Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Grid>
  </Grid>
)

export default PreguntasPage
