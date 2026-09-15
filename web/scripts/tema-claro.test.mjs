// La norma de MAD del 15/09/2026: los frontales del clon —público, privado y
// administración— arrancan SIEMPRE en claro. Nunca en oscuro.
//
// Esto era hasta hoy una frase en un comentario (`themeConfig.mode`), y una frase
// no sobrevive a una rama vieja: cualquier fusión que arrastre el `dark` anterior
// lo devolvería sin que nadie se enterara hasta abrir la web. Aquí queda en
// código, y el gate lo ejecuta (check 4c).
//
// Se mide el VALOR que exporta el módulo, no el texto del fichero: un comentario
// que diga «claro» con un `dark` debajo no engaña a esta prueba.
//
// `system` tampoco vale: sigue al sistema operativo de quien visita, o sea que en
// un aparato en oscuro pintaría oscuro — justo lo que la norma prohíbe. Y en esta
// app todo el arranque cuelga de aquí: `getMode`, `getSystemMode` y `getServerMode`
// (src/@core/utils/serverHelpers.ts) devuelven este valor, porque la web pública es
// estática y no hay servidor que lea cookies.
//
// El panel privado y el Clon-Admin tienen su gemela en
// panel-mad/web/tests/tema-claro-por-defecto.test.ts.

import assert from 'node:assert/strict'
import test from 'node:test'

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import themeConfig from '../src/configs/themeConfig.ts'

test('el escaparate público arranca en claro, nunca en oscuro ni siguiendo al sistema', () => {
  assert.equal(
    themeConfig.mode,
    'light',
    `themeConfig declara mode: '${themeConfig.mode}' y la norma de MAD (15/09/2026) exige 'light'`
  )
})

// `serverHelpers` no se puede importar aquí —usa el alias `@configs/…`, que es de
// TypeScript y Node no resuelve—, así que se lee: lo que importa es que sus tres
// puertas deriven del config y no puedan clavar un modo por su cuenta.
test('el arranque no puede imponer oscuro por su cuenta: todo cuelga del config', () => {
  const ruta = fileURLToPath(new URL('../src/@core/utils/serverHelpers.ts', import.meta.url))
  const fuente = readFileSync(ruta, 'utf8')
  const sinComentarios = fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

  for (const puerta of ['getMode', 'getSystemMode', 'getServerMode']) {
    assert.match(sinComentarios, new RegExp(`export const ${puerta}`), `falta la puerta ${puerta}`)
  }

  assert.doesNotMatch(
    sinComentarios,
    /['\"]dark['\"]/,
    'serverHelpers.ts clava un modo oscuro literal en vez de derivarlo de themeConfig'
  )
})
