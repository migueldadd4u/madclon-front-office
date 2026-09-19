// Guardia del barrido de accesibilidad: el gate tiene que mirar LOS DOS modos de
// color, con cookie propia cada uno, y ninguno puede quedarse con la matriz vacía.
//
// POR QUÉ EXISTE. El 15/09/2026, al pasar el arranque de los frontales a claro,
// el gate del escaparate destapó siete focos de contraste que llevaban meses
// escondidos en el modo que nadie medía —el claro— incluido el de ALTO CONTRASTE
// a 1,1:1. La causa no fue el color: fue que el barrido daba por sabido cuál era
// el modo de fábrica y no pedía ninguno. Esta prueba impide que la ceguera se dé
// la vuelta: si alguien quita el oscuro de `modos-color.mjs`, o lo deja con cero
// anchos, o los dos modos acaban pidiendo la misma cookie, salta aquí y no en
// producción.

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { modosAxe } from './modos-color.mjs'

const MATRIZ = { anchos: [375, 390, 834, 1440], idiomas: ['es', 'en'], contrastes: [false, true] }

test('el barrido recorre los dos modos de color, no solo el de fábrica', () => {
  const ids = modosAxe(MATRIZ).map(m => m.id)

  assert.deepEqual([...ids].sort(), ['claro', 'oscuro'], `el gate debe barrer claro Y oscuro; hoy barre: ${ids.join(', ')}`)
})

test('cada modo se pide por su cookie de ajustes, y no comparten valor', () => {
  const modos = modosAxe(MATRIZ)

  for (const modo of modos) {
    const valor = JSON.parse(decodeURIComponent(modo.cookie))

    assert.equal(valor.mode, modo.id === 'claro' ? 'light' : 'dark', `la cookie de ${modo.id} no pide su modo`)
    assert.equal(modo.atributo, modo.id === 'claro' ? 'data-light' : 'data-dark')
  }

  assert.notEqual(modos[0].cookie, modos[1].cookie, 'los dos modos piden la misma cookie: se mediría uno dos veces')
})

test('ningún modo se queda sin matriz: un modo con cero pasadas no está medido', () => {
  for (const modo of modosAxe(MATRIZ)) {
    assert.ok(modo.anchos.length > 0, `${modo.id} se quedó sin anchos`)
    assert.ok(modo.idiomas.length > 0, `${modo.id} se quedó sin idiomas`)
    assert.ok(modo.contrastes.length > 0, `${modo.id} se quedó sin contrastes`)
  }
})

test('el alto contraste NO se recorta en ningún modo: es la superficie que peor lo pasó el 15/09', () => {
  for (const modo of modosAxe(MATRIZ)) {
    assert.deepEqual(modo.contrastes, MATRIZ.contrastes, `${modo.id} no mide el alto contraste`)
  }
})

test('el corte del modo secundario conserva los dos extremos de ancho', () => {
  const [, oscuro] = modosAxe(MATRIZ)

  assert.ok(oscuro.anchos.includes(Math.min(...MATRIZ.anchos)), 'el corte perdió el ancho de móvil')
  assert.ok(oscuro.anchos.includes(Math.max(...MATRIZ.anchos)), 'el corte perdió el ancho de escritorio')
})

test('hay exactamente un modo de referencia, y es el claro (norma de MAD 15/09/2026)', () => {
  const referencia = modosAxe(MATRIZ).filter(m => m.referencia)

  assert.equal(referencia.length, 1, 'el modo de referencia tiene que ser uno y solo uno')
  assert.equal(referencia[0].id, 'claro')
  assert.deepEqual(referencia[0].anchos, MATRIZ.anchos, 'el modo de fábrica se mide con la matriz ENTERA')
  assert.deepEqual(referencia[0].idiomas, MATRIZ.idiomas, 'el modo de fábrica se mide en todos los idiomas')
})

test('una matriz vacía revienta en vez de colarse como barrido válido', () => {
  assert.throws(() => modosAxe({ anchos: [], idiomas: ['es'], contrastes: [false] }), /matriz vacía/)
  assert.throws(() => modosAxe({ anchos: [375], idiomas: [], contrastes: [false] }), /matriz vacía/)
  assert.throws(() => modosAxe({ anchos: [375], idiomas: ['es'], contrastes: [] }), /matriz vacía/)
})
