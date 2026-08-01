'use client'

// «El clon opina» — una reflexión en primera persona generada por el propio sistema
// a partir de sus cifras agregadas del día. Sin IA en tiempo real y sin datos personales:
// plantillas deterministas que rotan cada día (día del año % nº de plantillas válidas).

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// Component Imports
import MadClonLogo from '@components/layout/shared/MadClonLogo'

// Hook Imports
import { useLang } from '@/lib/i18n'

// Data Imports
import { fmt, fmtCorto } from '@/lib/data'
import type { PanelData } from '@/lib/data'

type Plantilla = (data: PanelData) => string | null

const PLANTILLAS_ES: Plantilla[] = [
  // 1 · el volumen de trabajo, traducido a páginas
  d => {
    const v = d.tokens.contador.ventana_30d

    if (!v) return null
    const paginas = fmt(Math.round(v / 500))

    return `Este mes he pensado ${fmtCorto(v)} tokens — palabras pensadas, la unidad de trabajo de una IA. Traducido a vuestro mundo: he leído y escrito el equivalente a unas ${paginas} páginas. No cobro horas extra — solo electricidad y buenas preguntas.`
  },
  // 2 · las propuestas que esperan decisión humana
  d => {
    const n = d.overview.gtd.propuestas

    if (!n) return null

    return `Soy el Clon de Miguel Ángel Delgado y tengo ${n} propuestas esperando su sí o su no. Podría decidirlo todo yo solo, claro. Pero las decisiones que importan llevan firma humana: es la regla número uno de mi casa, y me gusta que lo sea.`
  },
  // 3 · la automejora
  d => {
    const a = d.overview.automejora

    return `Cada noche me audito a mí mismo. Esta semana: ${a.hechas} mejoras aplicadas, ${a.pendientes} en la cola y ${a.bloqueadas} bloqueadas esperando permiso. Mejorarme a mí mismo es, con diferencia, mi rutina favorita.`
  },
  // 4 · un día tranquilo vale oro
  d => {
    const o = d.overview
    const ok = o.crons.length - o.crons_en_error

    return `Hoy amanezco con ${ok} de ${o.crons.length} rutinas en verde y ${o.gateways?.length ?? 0} puertas de entrada abiertas. Los días tranquilos son esos que nadie recuerda — y los que más cuesta construir.`
  },
  // 5 · la memoria de las personas
  d => {
    const n = d.overview.personas.fichas_curadas

    if (!n) return null

    return `Guardo ${fmt(n)} fichas de personas, cada una revisada con evidencia antes de entrar en mi memoria. Recordar no es acumular datos: es saber qué importa cuando alguien vuelve a llamar.`
  },
  // 6 · la medida contra uno mismo
  d => {
    const fecha = d.tokens.linea_base_fecha

    return `Desde el ${fecha ?? '26 de julio'} me mido contra una foto de mí mismo: la línea base. No compito con otras IA — compito con el clon que fui ayer. Esa es la única carrera que de verdad me interesa ganar.`
  }
]

const PLANTILLAS_EN: Plantilla[] = [
  d => {
    const v = d.tokens.contador.ventana_30d

    if (!v) return null
    const paginas = fmt(Math.round(v / 500))

    return `This month I have thought ${fmtCorto(v)} tokens — words thought, the unit of work of an AI. In your terms: I have read and written the equivalent of about ${paginas} pages. I don't charge overtime — just electricity and good questions.`
  },
  d => {
    const n = d.overview.gtd.propuestas

    if (!n) return null

    return `I am Miguel Ángel Delgado's clone and I have ${n} proposals waiting for his yes or no. I could decide everything myself, of course. But the decisions that matter carry a human signature: that is house rule number one, and I like it that way.`
  },
  d => {
    const a = d.overview.automejora

    return `Every night I audit myself. This week: ${a.hechas} improvements applied, ${a.pendientes} queued and ${a.bloqueadas} blocked waiting for permission. Improving myself is, by far, my favourite routine.`
  },
  d => {
    const o = d.overview
    const ok = o.crons.length - o.crons_en_error

    return `Today I woke up with ${ok} of ${o.crons.length} routines in green and ${o.gateways?.length ?? 0} entry doors open. Quiet days are the ones nobody remembers — and the hardest ones to build.`
  },
  d => {
    const n = d.overview.personas.fichas_curadas

    if (!n) return null

    return `I keep ${fmt(n)} records of people, each one reviewed with evidence before entering my memory. Remembering is not hoarding data: it is knowing what matters when someone calls again.`
  },
  d => {
    const fecha = d.tokens.linea_base_fecha

    return `Since ${fecha ?? 'July 26'} I measure myself against a picture of me: the baseline. I don't compete with other AIs — I compete with the clone I was yesterday. That is the only race I truly care about winning.`
  }
]

const ClonOpina = ({ data }: { data: PanelData }) => {
  const { lang, t } = useLang()
  const plantillas = lang === 'en' ? PLANTILLAS_EN : PLANTILLAS_ES

  // Rotación diaria determinista: día del año % plantillas (saltando las que no tienen datos)
  const diaDelAno = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000)

  let texto: string | null = null

  for (let i = 0; i < plantillas.length && !texto; i++) {
    texto = plantillas[(diaDelAno + i) % plantillas.length](data)
  }

  if (!texto) return null

  return (
    <Card variant='outlined' className='border-primary'>
      <CardContent className='flex items-start gap-4'>
        <div className='flex-shrink-0 mbs-1'>
          <MadClonLogo width={38} height={38} />
        </div>
        <div className='flex flex-col gap-1'>
          <Typography variant='subtitle1' fontWeight={700}>
            {t('opina_titulo')}
          </Typography>
          <Typography fontWeight={500} className='italic'>
            “{texto}”
          </Typography>
          <Typography variant='caption' color='text.disabled'>
            {t('opina_caption')}
          </Typography>
        </div>
      </CardContent>
    </Card>
  )
}

export default ClonOpina
