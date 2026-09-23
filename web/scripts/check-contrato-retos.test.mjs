// Reglas de HU-P07a sobre overview.retos (arco cero-a-cien, fase 7): cada defecto inyectado
// pone rojo el contrato y, arreglado, vuelve a verde. Datos inventados.
import test from 'node:test'
import assert from 'node:assert/strict'

import { comprobarRetosPublicados } from './check-contrato.mjs'

const HORNEADOS = ['Caso uno', 'Caso dos', 'Caso tres', 'Caso cuatro', 'Caso cinco']
const reto = (titulo, porcentaje = 40, terminado = false) => ({ titulo_publico: titulo, escala: 'reto', porcentaje, hechos: 2, total: 5, unidad: 'pasos', terminado })

const bloque = (retos, agregado = null) => ({ estado: 'ok', version: 1, generado: '2026-09-24T03:43:00Z', retos, agregado })

const cinco = () =>
  bloque(
    HORNEADOS.map((t, i) => reto(t, i * 20, i === 4)),
    { vivos: 4, terminados: 1, avanceMedio: 40, porEscala: { reto: 5 }, diasDelMasParado: 9 }
  )

const reglas = r => comprobarRetosPublicados(r, HORNEADOS).fallos.map(f => f.regla)

test('sano: un caso, cinco con agregado, en revisión y bloque ausente (aviso, no fallo)', () => {
  assert.deepEqual(reglas(bloque([reto('Caso uno', 0)])), [])
  assert.deepEqual(reglas(cinco()), [])
  assert.deepEqual(reglas({ estado: 'en revisión' }), [])
  const ausente = comprobarRetosPublicados(undefined, HORNEADOS)

  assert.deepEqual(ausente.fallos, [])
  assert.equal(ausente.avisos.length, 1)
})

test('defecto 1: un título que no está declarado → rojo', () => {
  assert.deepEqual(reglas(bloque([reto('Título privado de verdad')])), ['retos-titulo-no-declarado'])
  assert.deepEqual(reglas(bloque([reto('Caso uno ')])), ['retos-titulo-no-declarado'], 'coincidencia EXACTA')
})

test('defecto 2: un campo fuera de la lista blanca → rojo (reto, raíz y «en revisión»)', () => {
  assert.deepEqual(reglas(bloque([{ ...reto('Caso uno'), casa: '04_IDEAS/PLAN' }])), ['retos-campo-fuera-de-lista'])
  assert.deepEqual(reglas({ ...bloque([]), piezas: [] }), ['retos-campo-fuera-de-lista'])
  assert.deepEqual(reglas({ estado: 'en revisión', motivo: 'x' }), ['retos-campo-fuera-de-lista'])
})

test('defecto 3: un agregado que no cuadra → rojo', () => {
  const malo = cinco()

  malo.agregado.avanceMedio = 55
  assert.deepEqual(reglas(malo), ['retos-agregado-no-cuadra'])
  const porAltura = cinco()

  porAltura.agregado.porEscala = { reto: 4 }
  assert.deepEqual(reglas(porAltura), ['retos-agregado-no-cuadra'])
  assert.deepEqual(reglas(bloque([reto('Caso uno')], { vivos: 1, terminados: 0, avanceMedio: 40, porEscala: { reto: 1 }, diasDelMasParado: 1 })), ['retos-agregado-no-cuadra'], 'agregado con menos de 5')
  assert.deepEqual(reglas({ ...cinco(), agregado: null }), ['retos-agregado-no-cuadra'], 'con 5 el agregado existe')
})
