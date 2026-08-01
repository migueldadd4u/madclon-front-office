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
  { re: /(^|[\s:])0\s?€|€0\b/, motivo: 'el cero es un hecho verificable, no una estimación que envejezca' }
]

// ── DEUDAS ABIERTAS ─────────────────────────────────────────────────────────────
// Cifras a mano ya detectadas y aún no derivadas de los JSON. Las salda la entrega 4.
const DEUDA = [
  { fichero: 'src/lib/i18n.tsx', motivo: 'eje 7: «siete clones / octavo actor» a mano (entrega 4)' },
  { fichero: 'src/app/(dashboard)/preguntas/page.tsx', motivo: 'eje 7: «cientos de millones / una decena / siete» a mano (entrega 4)' },
  { fichero: 'src/app/(dashboard)/historia/page.tsx', motivo: 'eje 7: hitos narrativos con cifras a mano (entrega 4)' },
  { fichero: 'src/components/dashboard/Insignias.tsx', motivo: 'eje 7: umbrales de insignia a mano (entrega 4)' }
]

const enBlanca = texto => BLANCA.find(b => b.re.test(texto))
const enDeuda = fichero => DEUDA.find(d => d.fichero === fichero)

export function comprobarHardcode(base = process.cwd()) {
  const cadenas = cadenasDeCopy(base)
  const fallos = []
  const deudas = []
  const reLetra = new RegExp(`\\b(${[...EN_LETRA_ES, ...EN_LETRA_EN].join('|')})\\b`, 'i')

  for (const { fichero, linea, texto } of cadenas) {
    // Los huecos de reemplaza() son la forma correcta: no cuentan como cifra.
    const limpio = texto.replace(/\{[a-z0-9_]+\}/gi, '§')
    const blanca = enBlanca(limpio)

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
