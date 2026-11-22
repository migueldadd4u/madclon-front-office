#!/usr/bin/env node
// check-iconos.mjs — todo icono que la web pide existe en el paquete de la plantilla.
//
// Por qué existe (22/11/2026). Los iconos son clases `ri-*` que salen de un paquete
// generado (`src/assets/iconify-icons/generated-icons.css`). Pedir uno que no está
// en el paquete NO da error: el hueco se pinta vacío y nadie se entera. El mismo
// día aparecieron dos, los dos llevaban meses en producción: el chip «Horizonte»
// de /retos (`ri-mountain-line`) y la primera tarjeta de /actividad
// (`ri-vote-line`), un cuadrado de color sin nada dentro.
//
// Determinista: lo decide el script, no el ojo de quien revisa.
//
//   node scripts/check-iconos.mjs   → informe + salida 1 si hay iconos que no existen

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/** Dónde vive el código propio que pide iconos (no la plantilla, que trae los suyos). */
export const RAICES_ICONOS = ['src/app', 'src/components', 'src/lib', 'src/views', 'src/data', '../exporter']

const PAQUETE = 'src/assets/iconify-icons/generated-icons.css'
const RE_ICONO = /(?<![a-z0-9-])ri-[a-z0-9]+(?:-[a-z0-9]+)*/g

/** Los iconos que define el paquete, o null si el paquete no está generado. */
export function iconosDelPaquete(base = process.cwd()) {
  const ruta = join(base, PAQUETE)

  if (!existsSync(ruta)) return null

  return new Set(readFileSync(ruta, 'utf8').match(/(?<=\.)ri-[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? [])
}

/** Cada aparición de un icono `ri-*` en el código propio: [{icono, fichero, linea}]. */
export function iconosUsados(base = process.cwd()) {
  const ficheros = []

  const anda = ruta => {
    let estado

    try {
      estado = statSync(ruta)
    } catch {
      return
    }

    if (estado.isDirectory()) readdirSync(ruta).forEach(hijo => anda(join(ruta, hijo)))
    else if (/\.(tsx?|mjs|md)$/.test(ruta)) ficheros.push(ruta)
  }

  RAICES_ICONOS.forEach(raiz => anda(join(base, raiz)))

  const usados = []

  for (const fichero of ficheros.sort()) {
    readFileSync(fichero, 'utf8').split('\n').forEach((texto, i) => {
      for (const icono of texto.match(RE_ICONO) ?? []) usados.push({ icono, fichero: fichero.slice(base.length + 1), linea: i + 1 })
    })
  }

  return usados
}

/**
 * @returns {{ estado: 'sin-paquete' } | { estado: 'ok', usados: number, faltan: {icono: string, fichero: string, linea: number}[] }}
 */
export function comprobarIconos(base = process.cwd()) {
  const paquete = iconosDelPaquete(base)

  if (!paquete) return { estado: 'sin-paquete' }

  const usados = iconosUsados(base)

  return { estado: 'ok', usados: new Set(usados.map(u => u.icono)).size, faltan: usados.filter(u => !paquete.has(u.icono)) }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = comprobarIconos()

  if (r.estado === 'sin-paquete') {
    console.log(`check-iconos · falta ${PAQUETE} (yarn build:icons): no se puede comprobar`)
    process.exit(1)
  }

  console.log(`check-iconos · ${r.usados} iconos distintos en el código propio`)
  r.faltan.forEach(f => console.log(`  FALLO ${f.icono} → ${f.fichero}:${f.linea} no existe en el paquete: saldría un hueco vacío`))
  console.log(r.faltan.length === 0 ? '  OK · todos existen en el paquete de la plantilla' : `  FALLO · ${r.faltan.length} iconos que no existen`)
  process.exit(r.faltan.length === 0 ? 0 : 1)
}
