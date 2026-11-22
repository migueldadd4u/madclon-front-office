// La guardia de cifras a mano, sin exenciones por fichero ni por frase.
//
// Hasta el 22/11/2026 esta prueba defendía una lista de frases literales del guion de
// la asociación. Los casos por cargo ya no viven en React (exporter/casos.md → src/lib),
// así que aquí se comprueba lo contrario: que la portada y sus piezas nuevas NO traen
// ni una cifra escrita, y que ninguna vuelve a colarse por donde antes pasaban.
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { comprobarHardcode } from './check-hardcode.mjs'

const PIEZAS = [
  'src/components/dashboard/EscaparateClon.tsx',
  'src/components/dashboard/RecorridoFuentes.tsx',
  'src/components/dashboard/CasosPorCargo.tsx',
  'src/components/dashboard/NivelesControl.tsx',
  'src/components/dashboard/ParaQuienDecide.tsx'
]

const leer = relativa => readFileSync(new URL(`../${relativa}`, import.meta.url), 'utf8')

/** Monta un árbol mínimo con los ficheros dados (ruta → contenido) y lo pasa por la guardia. */
function comprobar(ficheros) {
  const base = mkdtempSync(join(tmpdir(), 'hardcode-'))

  try {
    for (const [relativa, contenido] of Object.entries(ficheros)) {
      mkdirSync(dirname(join(base, relativa)), { recursive: true })
      writeFileSync(join(base, relativa), contenido)
    }

    return comprobarHardcode(base)
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
}

test('la portada y sus piezas «para quien decide» no llevan ni una cifra escrita', () => {
  assert.deepEqual(comprobar(Object.fromEntries(PIEZAS.map(p => [p, leer(p)]))).fallos, [])
})

for (const pieza of PIEZAS) {
  test(`un contador a mano en ${pieza.split('/').at(-1)} falla: ya no hay exención por fichero`, () => {
    const resultado = comprobar({ [pieza]: leer(pieza) + "\nconst contador = 'Tenemos 1729 fichas y 41 tareas terminadas.'\n" })

    assert.equal(resultado.fallos.length, 1)
    assert.match(resultado.fallos[0].evidencia, /1729/)
  })
}

test('una frase del guion antiguo ya no tiene salvoconducto', () => {
  const resultado = comprobar({
    'src/components/dashboard/EscaparateClon.tsx': leer('src/components/dashboard/EscaparateClon.tsx') + "\nconst vieja = 'Las tres fuentes del ejemplo'\n"
  })

  assert.equal(resultado.fallos.length, 1)
  assert.match(resultado.fallos[0].cifra, /tres/)
})

test('una hora o una cantidad escritas en una página fallan igual que en un componente', () => {
  const resultado = comprobar({
    'src/app/(dashboard)/retos/page.tsx': "export const a = 'El jueves a las 10:00 hay pleno ordinario.'\nexport const b = 'Cuatro colectivos piden reunión esta semana.'\n"
  })

  assert.equal(resultado.fallos.length, 2, 'cuentan las dos: la hora en dígitos y la cantidad en letra')
  assert.match(resultado.fallos[0].evidencia, /10:00/)
  assert.match(resultado.fallos[1].cifra, /cuatro/i)
})

test('los huecos de una plantilla no son cifras', () => {
  const resultado = comprobar({ 'src/components/dashboard/Tarjeta.tsx': "export const texto = 'El clon tiene {n} oficios desde hace {dias} días.'\n" })

  assert.deepEqual(resultado.fallos, [])
})
