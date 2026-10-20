// agente: cdx-publicar-publico-20261020 · 2026-10-20
// El guion inventado puede contener horas; las métricas reales siguen bloqueadas.
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { comprobarHardcode } from './check-hardcode.mjs'

const fuente = readFileSync(new URL('../src/components/dashboard/EscaparateClon.tsx', import.meta.url), 'utf8')
const relativa = 'src/components/dashboard/EscaparateClon.tsx'
const aprobada = 'Las tres fuentes del ejemplo'

function comprobar(mutador = texto => texto, otro) {
  const base = mkdtempSync(join(tmpdir(), 'hardcode-guion-'))

  try {
    const directorio = join(base, 'src/components/dashboard')

    mkdirSync(directorio, { recursive: true })
    writeFileSync(join(base, relativa), mutador(fuente))
    if (otro) writeFileSync(join(directorio, 'OtraTarjeta.tsx'), `export const texto = ${JSON.stringify(otro)}\n`)

    return comprobarHardcode(base)
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
}

test('las cifras del guion sintético ES/EN aprobado no son métricas reales', () => {
  assert.deepEqual(comprobar().fallos, [])
})

test('la misma frase en otra tarjeta conserva el bloqueo', () => {
  const resultado = comprobar(undefined, aprobada)

  assert.equal(resultado.fallos.length, 1)
  assert.equal(resultado.fallos[0].fichero, 'src/components/dashboard/OtraTarjeta.tsx')
})

test('la misma frase fuera del tramo sintético en el mismo fichero falla', () => {
  const resultado = comprobar(texto => texto + `\nconst fueraDelEjemplo = ${JSON.stringify(aprobada)}\n`)

  assert.equal(resultado.fallos.length, 1)
})

test('un contador real nuevo dentro del ejemplo sigue fallando', () => {
  const resultado = comprobar(texto => texto.replace("fuentesTitulo: 'Las tres fuentes del ejemplo',", "fuentesTitulo: 'Las tres fuentes del ejemplo',\n    contador: 'Tenemos 1729 fichas y 41 tareas terminadas.',"))

  assert.equal(resultado.fallos.length, 1)
  assert.match(resultado.fallos[0].evidencia, /1729/)
})

test('una cifra extra en una frase aprobada no hereda su excepción', () => {
  const resultado = comprobar(texto => texto.replace(aprobada, aprobada + ' con 99 resultados medidos'))

  assert.equal(resultado.fallos.length, 1)
})

test('un horario modificado exige revisar el nuevo literal', () => {
  const resultado = comprobar(texto => texto.replace('¿Podemos reunirnos el jueves a las 10:00', '¿Podemos reunirnos el jueves a las 09:30'))

  assert.equal(resultado.fallos.length, 1)
})

test('una cantidad modificada exige revisar el nuevo literal', () => {
  const resultado = comprobar(texto => texto.replace(aprobada, 'Las cuatro fuentes del ejemplo'))

  assert.equal(resultado.fallos.length, 1)
})

test('quitar el rótulo sintético cierra la excepción', () => {
  const resultado = comprobar(texto => texto.replace("rotulo: 'Demostración sintética',", "rotulo: 'Resultado real',"))

  assert.ok(resultado.fallos.length > 0)
})
