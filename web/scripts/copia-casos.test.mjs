// Guardias de la fuente «para quien decide» (exporter/casos.md, 22/11/2026).
//
// Los casos por cargo son inventados y van a una web pública: lo que impide que uno
// salga cojo, sin traducir, con un canal que el clon no ingiere o prometiendo un
// resultado es el generador, no la atención de quien lo escribe. Cada regla se prueba
// aquí inyectando su defecto sobre la fuente real.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { ALTURAS, CAMPOS_CASO, CANALES, FORMA_CASO, generar, parsear, validar } from './build-copia-casos.mjs'

const FUENTE = readFileSync(new URL('../../exporter/casos.md', import.meta.url), 'utf8')
const avisosDe = md => validar(parsear(md))

/** Sustituye la primera aparición exacta; si no está, la prueba no mide nada y lo dice. */
const cambia = (viejo, nuevo) => {
  assert.ok(FUENTE.includes(viejo), `la fuente ya no contiene «${viejo.slice(0, 50)}»: actualiza esta prueba`)

  return FUENTE.replace(viejo, nuevo)
}

test('la fuente real cumple sus reglas y lo horneado es lo que dice', () => {
  const { avisos, orden, cuerpo } = generar(FUENTE)

  assert.deepEqual(avisos, [])
  assert.deepEqual(orden, ['alcaldia', 'rectorado', 'direccion', 'electo'])
  assert.equal(readFileSync(new URL('../src/lib/copia-casos.ts', import.meta.url), 'utf8'), cuerpo, 'regenera con node scripts/build-copia-casos.mjs')
})

test('cada caso trae sus cuatro etapas enteras, en español y en inglés', () => {
  const { casos, orden } = generar(FUENTE)

  for (const clave of orden) {
    const caso = casos[clave]

    for (const campo of CAMPOS_CASO) assert.ok(caso[campo], `${clave}.${campo}`)

    for (const idioma of ['es', 'en']) {
      const cuenta = prefijo => Object.keys(caso).filter(c => new RegExp(`^${idioma}_${prefijo}_\\d+(_titulo)?$`).test(c)).length

      assert.equal(cuenta('llega'), FORMA_CASO.llega, `${clave} · ${idioma} · lo que llegó`)
      assert.equal(cuenta('cruce'), FORMA_CASO.cruces, `${clave} · ${idioma} · lo que hizo el clon`)
      assert.equal(cuenta('decision'), FORMA_CASO.decisiones, `${clave} · ${idioma} · decisiones`)
      assert.equal(cuenta('compromiso'), FORMA_CASO.compromisos, `${clave} · ${idioma} · compromisos`)
      assert.ok(caso[`${idioma}_decides`].length > 40, `${clave} · ${idioma} · lo que decides tú`)
    }
  }
})

test('todo caso deja la decisión en una persona: el clon no envía, no firma, no publica', () => {
  const { casos } = generar(FUENTE)

  for (const [clave, caso] of Object.entries(casos)) {
    assert.match(caso.es_decides, /El clon no /, `${clave}: «lo que decides tú» tiene que decir lo que el clon NO hace`)
    assert.match(caso.en_decides, /The clone (does not|publishes nothing)/, `${clave}: en inglés también`)
  }
})

test('solo entran los canales que el clon ingiere y las alturas que existen', () => {
  const { casos } = generar(FUENTE)

  for (const caso of Object.values(casos)) {
    for (let i = 1; i <= FORMA_CASO.llega; i++) assert.ok(CANALES.includes(caso[`canal_${i}`]))
    assert.ok(ALTURAS.includes(caso.reto_altura))
  }

  assert.match(avisosDe(cambia('canal_3: llamada', 'canal_3: prensa')).join('\n'), /«prensa» no es un canal que el clon ingiera/)
  assert.match(avisosDe(cambia('reto_altura: frente', 'reto_altura: epopeya')).join('\n'), /«epopeya» no es una altura/)
})

test('un caso que promete un resultado no se hornea', () => {
  const conPromesa = cambia('es_gana: La queja repetida,', 'es_gana: Un ahorro del tiempo de gabinete: la queja repetida,')

  assert.match(avisosDe(conPromesa).join('\n'), /«caso-alcaldia»\.es_gana: promete un resultado/)
  assert.match(avisosDe(cambia('en_reto_fin: The pool opens to the public.', 'en_reto_fin: Guaranteed: the pool opens to the public.')).join('\n'), /promete un resultado/)
})

test('los límites sí pueden nombrar lo que NO se acredita', () => {
  const { bloques } = generar(FUENTE)

  assert.match(bloques['limite-1'].es_texto, /no acreditan precisión de la IA, conexión con tus canales, ahorro ni resultados/)
  assert.deepEqual(avisosDe(FUENTE).filter(a => a.includes('limite')), [])
})

test('una traducción que falta, un campo de más o un bloque huérfano se cantan', () => {
  assert.match(avisosDe(cambia('en_llega_3: A missed call', 'en_llegaa_3: A missed call')).join('\n'), /faltan en_llega_3[\s\S]*campos que no se esperan \(¿errata\?\) en_llegaa_3/)
  assert.match(avisosDe(FUENTE + '\n### bloque-suelto\nes_titulo: a\nes_texto: b\nen_titulo: c\nen_texto: d\n').join('\n'), /«bloque-suelto»: bloque que ninguna página usa/)
  assert.match(avisosDe(cambia('### rotulo\n', '### rotulo-quitado\n')).join('\n'), /falta el bloque «rotulo»/)
})

test('el orden de los cargos y los bloques de caso no pueden divergir', () => {
  assert.match(avisosDe(cambia('orden: alcaldia rectorado direccion electo', 'orden: alcaldia rectorado direccion')).join('\n'), /«caso-electo» no está en «cargos»\.orden/)
  assert.match(avisosDe(cambia('orden: alcaldia rectorado direccion electo', 'orden: alcaldia rectorado direccion electo consejeria')).join('\n'), /nombra «consejeria» y no existe el bloque «caso-consejeria»/)
})

test('un título de sección cierra el bloque: lo que viene debajo no es suyo', () => {
  const bloques = parsear('### uno\nes_titulo: a\n\n## Sección\nes_texto: esto no es del bloque uno\n\n### dos\nes_titulo: b\n')

  assert.deepEqual(bloques, { uno: { es_titulo: 'a' }, dos: { es_titulo: 'b' } })
})

test('una fuente que incumple no llega a hornearse ni a medias', () => {
  const { avisos } = generar(cambia('### caso-electo\n', '### caso-electo\nes_cargo_extra: sobra\n'))

  assert.ok(avisos.length > 0)
})
