// Guardia de las fronteras de error de la web: si algo revienta al pintar, la página
// confiesa «en revisión» como el resto del escaparate, nunca la pantalla genérica.
//
// POR QUÉ EXISTE. Las páginas del panel son componentes de cliente que pintan los
// JSON publicados. `DataGate` ya convierte un documento ausente o roto en «en
// revisión», pero un dato con una forma que nadie previó podía romper el render y
// acabar en el error genérico del framework, en inglés y sin salida. Decisión de MAD
// (03/08/2026): mejor datos incompletos que una página de error.
//
// Las fronteras no enseñan NUNCA el texto de la excepción: puede llevar rutas,
// nombres o trozos del dato que la provocó.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const SRC = new URL('../src/', import.meta.url)

const FRONTERAS = {
  panel: 'app/(dashboard)/error.tsx',
  global: 'app/global-error.tsx'
}

const CLAVES = ['error_pagina_titulo', 'error_pagina_texto', 'error_reintentar']

const leer = ruta => {
  const url = new URL(ruta, SRC)

  assert.ok(existsSync(url), `falta src/${ruta}`)

  return readFileSync(url, 'utf8')
}

const sinComentarios = fuente => fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

for (const [nombre, ruta] of Object.entries(FRONTERAS)) {
  test(`${nombre}: existe y es un componente de cliente`, () => {
    const codigo = sinComentarios(leer(ruta)).trimStart()

    assert.match(codigo, /^['"]use client['"]/, `${ruta} debe empezar por 'use client'`)
    assert.match(codigo, /export default/)
  })

  test(`${nombre}: no enseña ni lee la excepción`, () => {
    const codigo = sinComentarios(leer(ruta))

    assert.doesNotMatch(codigo, /\.\s*(message|stack|digest|cause)\b/, 'lee propiedades de la excepción')
    assert.doesNotMatch(codigo, /\.\s*error\b/, 'lee props.error')
    assert.doesNotMatch(codigo, /[{(,]\s*error\s*[,})=]/, 'saca `error` de las props')
    assert.doesNotMatch(codigo, /\bconsole\./, 'vuelca la excepción a la consola')
  })

  test(`${nombre}: confiesa «en revisión» con role=status y un botón que reintenta`, () => {
    const codigo = sinComentarios(leer(ruta))

    assert.match(codigo, /role=['"]status['"]/)
    assert.match(codigo, /<(Button|button)\b[^>]*onClick=\{\s*(\(\)\s*=>\s*reset\(\)|reset)\s*\}/, 'el botón tiene que llamar a reset()')

    for (const clave of CLAVES) assert.match(codigo, new RegExp(`['"]${clave}['"]`), `no usa ${clave}`)
  })
}

test('panel: el idioma sale del contexto de la web', () => {
  assert.match(sinComentarios(leer(FRONTERAS.panel)), /useLang\(\)/)
})

test('global: pinta su propio documento y resuelve el idioma guardado', () => {
  const codigo = sinComentarios(leer(FRONTERAS.global))

  assert.match(codigo, /<html\b[^>]*\blang=\{/, 'global-error sustituye al layout raíz: necesita <html lang>')
  assert.match(codigo, /<body\b/)
  assert.match(codigo, /idiomaGuardado\(\)/, 'sin LangProvider, el idioma se lee del almacenamiento')
})

test('los textos existen en ES y EN, y son los de «en revisión» de la web', () => {
  const i18n = readFileSync(new URL('lib/i18n.tsx', SRC), 'utf8')
  const texto = clave => {
    const m = new RegExp(`\\b${clave}: \\{\\s*es: '([^']+)',\\s*en: (['"])(.+?)\\2\\s*\\}`, 's').exec(i18n)

    assert.ok(m, `falta ${clave} en i18n.tsx con es y en`)

    return { es: m[1], en: m[3] }
  }

  const titulo = texto('error_pagina_titulo')

  assert.match(titulo.es, /en revisión/)
  assert.match(titulo.en, /under review/)
  assert.match(texto('revision_titulo').es, /en revisión/, 'el bloque y la página dicen lo mismo')

  for (const clave of CLAVES) {
    const { es, en } = texto(clave)

    assert.ok(es.length > 0 && en.length > 0)
    assert.notEqual(es, en, `${clave} no está traducido`)
    assert.doesNotMatch(es + en, /\berror\b|exception|excepción|stack/i, `${clave} habla en técnico`)
  }
})
