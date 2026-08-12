#!/usr/bin/env node
// check-hardcode.mjs — eje 7: cero cifras a mano.
// Toda cifra visible se calcula de los 5 JSON en tiempo de render. Lo que se
// escribe a mano envejece en silencio: este script lo impide.
// Determinista: lo decide el script, no el criterio de un modelo.
//
//   node scripts/check-hardcode.mjs            → informe + salida 1 si hay fallos
//   node scripts/check-hardcode.mjs --deudas   → además lista las deudas abiertas

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

const enBlanca = (texto, fichero) => BLANCA.find(b => (b.re ? b.re.test(texto) : b.fichero === fichero))
const enDeuda = fichero => DEUDA.find(d => d.fichero === fichero)

export function comprobarHardcode(base = process.cwd()) {
  const cadenas = cadenasDeCopy(base)
  const fallos = []
  const deudas = []
  const reLetra = new RegExp(`\\b(${[...EN_LETRA_ES, ...EN_LETRA_EN].join('|')})\\b`, 'i')

  for (const { fichero, linea, texto } of cadenas) {
    // Los huecos de reemplaza() son la forma correcta: no cuentan como cifra.
    const limpio = texto.replace(/\{[a-z0-9_]+\}/gi, '§')
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
