// Guardia de la suite de la CI: ninguna prueba se queda fuera sin decir por qué.
//
// POR QUÉ EXISTE. Hasta el 01/11/2026 la CI solo corría 4 de los 9 `*.test.mjs`.
// Las pruebas nuevas se fueron enganchando al gate local (`gate.mjs`) y nunca al
// script que corre la CI, así que un cambio podía publicarse con una regresión que
// solo se habría visto en la máquina que pasa el gate. Además la CI usaba Node 20,
// que no lee TypeScript: `tema-claro.test.mjs` importa `themeConfig.ts` y allí
// habría fallado con ERR_UNKNOWN_FILE_EXTENSION.
//
// Regla: toda `scripts/*.test.mjs` está en el script `test` de package.json (lo que
// corre la CI antes de construir) o en FUERA_DE_CI con su motivo. Nunca en los dos.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'

const WEB = new URL('../', import.meta.url)
const RAIZ = new URL('../../', import.meta.url)
const SCRIPTS = new URL('./', import.meta.url)

// Pruebas que NO son herméticas (necesitan red, navegador o algo instalado fuera del
// repo). Las corre el gate local; la CI no puede.
const FUERA_DE_CI = {
  'esperas.test.mjs':
    'abre Chromium con Playwright, y ambos viven instalados fuera del repo (ver playwright-home.mjs); lo corre el gate local en su check 13'
}

const pkg = JSON.parse(readFileSync(new URL('package.json', WEB), 'utf8'))

const ficherosDe = script =>
  (script ?? '')
    .split(/\s+/)
    .filter(token => token.endsWith('.test.mjs'))
    .map(token => token.replace(/^scripts\//, ''))

const enCI = ficherosDe(pkg.scripts.test)
const enDisco = readdirSync(SCRIPTS).filter(nombre => nombre.endsWith('.test.mjs'))

test('el script test existe y corre con node:test', () => {
  assert.match(pkg.scripts.test ?? '', /^node --test /)
})

test('cada prueba está en la CI o fuera con motivo, nunca en los dos sitios', () => {
  const huerfanas = enDisco.filter(nombre => !enCI.includes(nombre) && !FUERA_DE_CI[nombre])
  const dobles = enCI.filter(nombre => FUERA_DE_CI[nombre])

  assert.deepEqual(huerfanas, [], `pruebas sin CI ni motivo: ${huerfanas.join(', ')}`)
  assert.deepEqual(dobles, [], `pruebas en la CI y también marcadas fuera: ${dobles.join(', ')}`)
})

test('el script test no apunta a ficheros que no existen', () => {
  const fantasmas = enCI.filter(nombre => !existsSync(new URL(nombre, SCRIPTS)))

  assert.deepEqual(fantasmas, [])
})

test('lo que corre el gate como privacidad también lo corre la CI', () => {
  const faltan = ficherosDe(pkg.scripts['test:public-safety']).filter(nombre => !enCI.includes(nombre))

  assert.deepEqual(faltan, [], `test:public-safety corre ${faltan.join(', ')} y la CI no`)
})

const leerWorkflow = ruta => {
  const url = new URL(ruta, RAIZ)

  assert.ok(existsSync(url), `falta ${ruta}`)

  return readFileSync(url, 'utf8')
}

const PYTHON = /python3 -m unittest discover -s exporter -p 'test_\*publico\*\.py'/

test('los dos workflows usan Node 22 y corren las pruebas de Node y del exportador', () => {
  for (const ruta of ['.github/workflows/deploy.yml', '.github/workflows/ci.yml']) {
    const yml = leerWorkflow(ruta)

    assert.match(yml, /node-version: ['"]?22['"]?\s*$/m, `${ruta}: Node 22`)
    assert.doesNotMatch(yml, /node-version: ['"]?(1\d|20)\b/, `${ruta}: Node sin soporte`)
    assert.match(yml, /run: yarn test\s*$/m, `${ruta}: no corre yarn test`)
    assert.match(yml, PYTHON, `${ruta}: no corre los unittest del exportador`)
  }
})

test('el despliegue no construye sin haber pasado antes las pruebas', () => {
  const yml = leerWorkflow('.github/workflows/deploy.yml')
  const build = yml.search(/run: yarn build\s*$/m)

  const antes = patron => {
    const i = yml.search(patron)

    return i >= 0 && i < build
  }

  assert.ok(build > 0, 'deploy.yml no construye')
  assert.ok(antes(/run: yarn test\s*$/m), 'yarn test falta o va después del build')
  assert.ok(antes(PYTHON), 'los unittest del exportador faltan o van después del build')

  for (const paso of ['yarn test', 'python3 -m unittest']) {
    const bloque = yml.slice(0, build).split(/\n\s*- /).find(b => b.includes(paso))

    assert.doesNotMatch(bloque ?? '', /continue-on-error/, `el paso «${paso}» no puede ser informativo`)
  }
})

test('la CI de ramas y PR solo lee: ni escribe ni despliega', () => {
  const yml = leerWorkflow('.github/workflows/ci.yml')

  assert.match(yml, /^permissions:\s*\n\s+contents: read\s*$/m)
  assert.doesNotMatch(yml, /:\s*write\b/)
  assert.doesNotMatch(yml, /deploy-pages|upload-pages-artifact|configure-pages|yarn build/)
  assert.match(yml, /^\s+push:/m)
  assert.match(yml, /^\s+pull_request:/m)
})
