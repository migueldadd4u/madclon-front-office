#!/usr/bin/env node
// check-hardcode.mjs — eje 7: cero cifras a mano.
// Toda cifra visible se calcula de los 5 JSON en tiempo de render. Lo que se
// escribe a mano envejece en silencio: este script lo impide.
// Determinista: lo decide el script, no el criterio de un modelo.
//
//   node scripts/check-hardcode.mjs            → informe + salida 1 si hay fallos
//   node scripts/check-hardcode.mjs --deudas   → además lista las deudas abiertas

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { cadenasDeCopy } from './lib/cadenas.mjs'

// Numerales escritos en letra (los dígitos se detectan aparte).
const EN_LETRA_ES = [
  'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'doce',
  'veinte', 'treinta', 'cien', 'ciento', 'cientos', 'mil', 'miles', 'millón', 'millones',
  // «once» (11) queda fuera a propósito: choca con el «once» inglés (= una vez).
  'decena', 'decenas', 'centenar', 'centenares', 'docena', 'docenas', 'octavo', 'séptimo'
]
const EN_LETRA_EN = [
  'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'twenty', 'thirty', 'hundred', 'hundreds', 'thousand', 'thousands', 'million', 'millions',
  'dozen', 'dozens', 'eighth', 'seventh'
]

// ── LISTA BLANCA (explícita y comentada, como manda el eje 7) ────────────────────
// Solo entra aquí lo que NO es una cifra medida: constantes del mundo, unidades y
// nombres propios. Todo lo demás se deriva de los JSON con {placeholder}.
const BLANCA = [
  { re: /\b24\s*(h|horas|hours)\b/i, motivo: 'constante del mundo: el día tiene 24 h (franja «un día en la vida»)' },
  { re: /\b(100|0)\s*%/, motivo: 'extremos de una escala, no una medida' },
  { re: /\bA4\b/, motivo: 'nombre de formato de papel' },
  { re: /\bpor millón de tokens\b|\bper million tokens\b/i, motivo: 'unidad de precio (€/M), no un recuento' },
  { re: /\b(segundo|second) (cerebro|brain)\b/i, motivo: 'nombre propio del proyecto, no un ordinal' },
  { re: /\bprimer[ao]?\b|\bfirst\b/i, motivo: 'ordinal narrativo sin cifra medida detrás' },
  { re: /\bde cada (diez|10)\b|\bout of (ten|10)\b/i, motivo: 'base fija de la proporción; el numerador sí sale del JSON' },
  { re: /\bcinco (nodos|preguntas)\b|\bfive (nodes|questions)\b/i, motivo: 'constante de la marca (M constelación) y del checklist' },
  { re: /\b30 (días|days|d)\b/i, motivo: 'ventana fija de medición del exportador, no una cifra medida' },
  { re: /(^|[\s:])0\s?€|€0\b/, motivo: 'el cero es un hecho verificable, no una estimación que envejezca' },
  // Saldadas o justificadas en la entrega 4 (2026-08-01):
  // ⛔ RETIRADA en la ronda R7 (2026-08-12). La exención cubría el fichero ENTERO
  // para proteger las fechas de los hitos, y con ellas coló un contador de
  // bitácoras escrito a mano que se quedó congelado en 175 mientras el vault ya
  // tenía 177: exactamente el fallo que este script existe para impedir. Los
  // hitos viven ahora en exporter/historia.md y llegan por overview.json, así que
  // /historia ya no necesita ninguna exención: cualquier cifra a mano FALLA.
  { re: /\b(dos|two) (voces|voices)\b/i, motivo: 'constante estructural del gráfico: siempre son dos series (piensa / termina)' },
  { re: /\b(un aviso o dos|a warning or two)\b/i, motivo: 'modismo, no un recuento' },
  { re: /\b(capa|layer) [12]\b/i, motivo: 'nombre de la capa de navegación, no una cifra medida' },
  { re: /\b(de cada|out of every) (10|1\.000|1,000|diez|ten)\b/i, motivo: 'base fija de la proporción; el numerador sí sale del JSON' },
  { re: /token ≈|un token|one token/i, motivo: 'definición de la unidad (≈3-4 letras, ~500 por página): constante del mundo' },
  { re: /\b0?3:00\b/, motivo: 'hora del reloj a la que corre la rutina, no una medida' },
  { re: /· 7 (días|days)\b/, motivo: 'ventana fija de la serie de automejora, igual que los 30 días del exportador' }
]

// ── DEUDAS ABIERTAS ─────────────────────────────────────────────────────────────
// Cifras a mano ya detectadas y aún no derivadas de los JSON. Las salda la entrega 4.
// Vacía desde la entrega 4 (2026-08-01): las cifras que envejecían ya se derivan de los
// JSON. Lo que queda en BLANCA no son medidas, son constantes; cualquier cifra nueva FALLA.
const DEUDA = []

// Guion editorial sintético aceptado por MAD el20/10/2026, c41cf38.
// Sus horas/ordinales/cantidades describen el ejemplo inventado, no métricas.
// Excepción cerrada por fichero + literal exacto + tramo del guion rotulado.
// No cubre el fichero entero, otras páginas ni una cifra extra/modificada.
const FICHERO_GUION = 'src/components/dashboard/EscaparateClon.tsx'
const TEXTOS_GUION = new Set([
  "Somos el equipo de una asociación. Queremos ordenar las solicitudes que recibimos por correo y formulario: algunas se nos duplican. ¿Podemos reunirnos el jueves a las 10:00 para ver por dónde empezar?",
  "Las tres fuentes del ejemplo",
  "El mensaje de la asociación que acabas de leer: pide ayuda y propone el jueves a las 10:00.",
  "Jueves: de 10:00 a 11:00, ocupado. De 11:30 a 12:00, libre. Solo se usan estas franjas suministradas para el ejemplo.",
  "2. Qué hace el clon",
  "Separa dos asuntos: estudiar las solicitudes duplicadas y responder a la propuesta de reunión. Los registra juntos para conservar el contexto.",
  "Compara las 10:00 del correo con la agenda y encuentra el conflicto. Propone las 11:30, que sí figuran libres; no reserva ese hueco.",
  "Revisar el borrador, decidir si propones las 11:30 y pedir tres ejemplos sin datos personales.",
  "Si procede pedir el volumen semanal y los tres ejemplos sin datos personales.",
  "En este ejemplo eliges proponer las 11:30, apruebas la petición de muestras y envías tú la respuesta revisada. Ya tienes una ficha y un texto concreto; el correo inicial queda respondido.",
  "We are the team at an association. We want to organise requests received by email and through our form: some are duplicates. Could we meet on Thursday at 10:00 to discuss where to start?",
  "The three sources in this example",
  "The association’s message above: it asks for help and proposes Thursday at 10:00.",
  "Thursday: 10:00–11:00 is busy; 11:30–12:00 is free. Only these supplied time slots are used in the example.",
  "2. What the clone does",
  "It separates two matters: examining duplicate requests and replying to the meeting proposal. It records them together to preserve the context.",
  "It compares 10:00 in the email with the calendar and finds the conflict. It proposes 11:30, which is listed as free; it does not book the slot.",
  "Review the draft, decide whether to propose 11:30 and request three examples without personal data.",
  "4. What you decide",
  "Whether to ask for the weekly volume and three examples without personal data.",
  "In this example, you choose to propose 11:30, approve the request for samples and send the reviewed reply yourself. You have a record and a concrete message; the incoming email has been answered."
])

function rangosGuion(base) {
  try {
    const lineas = readFileSync(join(base, FICHERO_GUION), 'utf8').split('\n')
    const anclas = [
      ["mensajeTitulo: '1. Qué llega',", "rotulo: 'Demostración sintética',"],
      ["mensajeTitulo: '1. What comes in',", "rotulo: 'Synthetic demonstration',"]
    ]
    const rangos = []

    for (const [inicio, rotulo] of anclas) {
      const posiciones = lineas.flatMap((linea, i) => linea.trim() === inicio ? [i] : [])

      if (posiciones.length !== 1) return []
      const desde = posiciones[0]
      const finRelativo = lineas.slice(desde + 1).findIndex(linea => /^\s*limitesEjemplo:/.test(linea))

      if (finRelativo < 0 || finRelativo > 120 || !lineas.slice(Math.max(0, desde - 8), desde).some(linea => linea.trim() === rotulo)) return []
      rangos.push({ desde: desde + 1, hasta: desde + finRelativo + 1 })
    }

    return rangos
  } catch {
    return []
  }
}

const enBlanca = (texto, fichero) => BLANCA.find(b => (b.re ? b.re.test(texto) : b.fichero === fichero))
const enDeuda = fichero => DEUDA.find(d => d.fichero === fichero)

export function comprobarHardcode(base = process.cwd()) {
  const cadenas = cadenasDeCopy(base)
  const fallos = []
  const deudas = []
  const rangos = rangosGuion(base)
  const reLetra = new RegExp(`\\b(${[...EN_LETRA_ES, ...EN_LETRA_EN].join('|')})\\b`, 'i')

  for (const { fichero, linea, texto } of cadenas) {
    // Los huecos de reemplaza() son la forma correcta: no cuentan como cifra.
    const limpio = texto.replace(/\{[a-z0-9_]+\}/gi, '§')
    const guion = fichero === FICHERO_GUION && TEXTOS_GUION.has(texto) && rangos.some(r => linea >= r.desde && linea <= r.hasta)

    if (guion) continue
    const blanca = enBlanca(limpio, fichero)

    if (blanca) continue

    const digitos = limpio.match(/\b\d[\d.,]*\b/g)
    const letras = limpio.match(reLetra)

    if (!digitos && !letras) continue
    const hallazgo = {
      fichero,
      linea,
      cifra: (digitos || []).concat(letras ? [letras[0]] : []).join(', '),
      evidencia: texto.slice(0, 100)
    }
    const deuda = enDeuda(fichero)

    if (deuda) deudas.push({ ...hallazgo, motivo: deuda.motivo })
    else fallos.push(hallazgo)
  }

  return { cadenas: cadenas.length, fallos, deudas }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = comprobarHardcode()

  console.log(`check-hardcode · ${r.cadenas} cadenas de copy analizadas`)
  r.fallos.forEach(f => console.log(`  FALLO ${f.fichero}:${f.linea} → «${f.evidencia}» (cifra: ${f.cifra})`))
  if (process.argv.includes('--deudas')) {
    r.deudas.forEach(d => console.log(`  deuda ${d.fichero}:${d.linea} → «${d.evidencia}» (cifra: ${d.cifra})`))
  }

  console.log(
    r.fallos.length === 0
      ? `  OK · 0 cifras a mano (${r.deudas.length} en lista blanca de deudas abiertas)`
      : `  FALLO · ${r.fallos.length} cifras escritas a mano`
  )
  process.exit(r.fallos.length === 0 ? 0 : 1)
}
