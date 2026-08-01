#!/usr/bin/env node
// check-copy.mjs — eje 5 (identidad) + eje 4 (cero tecnicismos sin traducir).
// Determinista: lo decide este script, no el criterio de un modelo.
//
//   node scripts/check-copy.mjs            → informe + salida 1 si hay fallos
//   node scripts/check-copy.mjs --deudas   → además lista las deudas abiertas
//
// REGLA 1 · identidad. Toda frase que nombre a «Miguel» debe llevar «Ángel» o «MAD»
//   en la MISMA frase. Identidad canónica: «el Clon de Miguel Ángel Delgado (MAD)»,
//   abreviado «el Clon de MAD» tras la primera mención de cada página.
// REGLA 2 · tecnicismos. Si una página usa una palabra técnica, esa MISMA página
//   tiene que traerla traducida en algún punto (glosario al lado, no en otra web).

import { cadenasDeCopy, frases } from './lib/cadenas.mjs'

// ── Regla 2: tecnicismo → palabras que demuestran que está traducido en ese fichero.
const TECNICISMOS = {
  gateway: ['puerta', 'door'],
  vault: ['memoria privada', 'private memory', 'cuaderno privado', 'private notebook'],
  token: ['palabras pensadas', 'words thought', 'unidad de trabajo', 'unit of'],
  cron: ['cada noche', 'every night', 'automátic', 'automatic'],
  'service worker': ['sin internet', 'offline'],
  endpoint: ['dirección', 'address'],
  prompt: ['instrucción', 'instruction'],
  commit: ['cambio guardado', 'saved change'],
  staged: ['preparado', 'ready to'],
  router: ['reparte', 'routes'],
  pipeline: ['cadena de pasos', 'chain of steps']
}

// ── DEUDAS ABIERTAS ─────────────────────────────────────────────────────────────
// Lista blanca EXPLÍCITA Y COMENTADA. Cada entrada es una deuda real, con el eje
// y la entrega que debe borrarla. No se añade nada aquí sin anotarlo en MEJORAS.md.
// Vacía desde la entrega 2 (2026-08-01): las 35 cadenas heredadas de «Miguel» suelto
// y las 4 sin glosa se saldaron ahí. A partir de ahora cualquier reincidencia FALLA.
const DEUDA = []

const esDeudaIdentidad = frase => DEUDA.some(d => d.patron && d.patron.test(frase))
const esDeudaTermino = t => DEUDA.some(d => d.termino === t)

export function comprobarCopy(base = process.cwd()) {
  const cadenas = cadenasDeCopy(base)
  const fallos = []
  const deudas = []

  // Regla 1 — identidad
  for (const { fichero, linea, texto } of cadenas) {
    for (const frase of frases(texto)) {
      if (!/\bMiguel\b/.test(frase)) continue
      if (/Ángel|Angel|\bMAD\b/.test(frase)) continue
      const hallazgo = { regla: 'identidad', fichero, linea, evidencia: frase.slice(0, 110) }

      if (esDeudaIdentidad(frase)) deudas.push(hallazgo)
      else fallos.push(hallazgo)
    }
  }

  // Regla 2 — tecnicismos con glosario, por fichero
  const porFichero = new Map()

  for (const c of cadenas) {
    if (!porFichero.has(c.fichero)) porFichero.set(c.fichero, [])
    porFichero.get(c.fichero).push(c)
  }

  for (const [fichero, lista] of porFichero) {
    const todo = lista.map(l => l.texto).join(' ').toLowerCase()

    for (const [termino, glosas] of Object.entries(TECNICISMOS)) {
      const re = new RegExp(`\\b${termino.replace(' ', '\\s')}s?\\b`, 'i')
      const usado = lista.find(l => re.test(l.texto))

      if (!usado) continue
      if (glosas.some(g => todo.includes(g.toLowerCase()))) continue
      const hallazgo = { regla: `tecnicismo:${termino}`, fichero, linea: usado.linea, evidencia: usado.texto.slice(0, 110) }

      if (esDeudaTermino(termino)) deudas.push(hallazgo)
      else fallos.push(hallazgo)
    }
  }

  return { cadenas: cadenas.length, fallos, deudas }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = comprobarCopy()

  console.log(`check-copy · ${r.cadenas} cadenas de copy analizadas`)
  r.fallos.forEach(f => console.log(`  FALLO [${f.regla}] ${f.fichero}:${f.linea} → «${f.evidencia}»`))
  if (process.argv.includes('--deudas')) {
    r.deudas.forEach(d => console.log(`  deuda [${d.regla}] ${d.fichero}:${d.linea} → «${d.evidencia}»`))
  }

  console.log(
    r.fallos.length === 0
      ? `  OK · 0 fallos (${r.deudas.length} en lista blanca de deudas abiertas)`
      : `  FALLO · ${r.fallos.length} incumplimientos`
  )
  process.exit(r.fallos.length === 0 ? 0 : 1)
}
