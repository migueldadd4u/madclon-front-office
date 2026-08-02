import assert from 'node:assert/strict'
import test from 'node:test'

import { candidatosPlaywright, resolverPlaywrightHome } from './playwright-home.mjs'

test('la ruta persistente sustituye a un /tmp podado', () => {
  const persistente = '/casa/.clonmad/panel/pwshot'
  const disponibles = new Set([`${persistente}:playwright`, `${persistente}:axe-core/axe.min.js`])
  const resolver = (directorio, modulo) => {
    if (!disponibles.has(`${directorio}:${modulo}`)) throw Object.assign(new Error('podado'), { code: 'MODULE_NOT_FOUND' })

    return `${directorio}/node_modules/${modulo}`
  }

  const r = resolverPlaywrightHome({ home: '/casa', legacy: '/tmp/pwshot', resolver })

  assert.equal(r.directorio, persistente)
})

test('PW_HOME explícito gana cuando contiene ambos módulos', () => {
  const resolver = (directorio, modulo) => {
    if (directorio !== '/driver-propio') throw new Error('no existe')

    return `${directorio}/${modulo}`
  }

  assert.equal(resolverPlaywrightHome({ override: '/driver-propio', home: '/casa', resolver }).directorio, '/driver-propio')
})

test('sin driver completo falla con las rutas examinadas', () => {
  assert.deepEqual(candidatosPlaywright({ override: '/uno', home: '/casa', legacy: '/tmp/pwshot' }), [
    '/uno',
    '/casa/.clonmad/panel/pwshot',
    '/tmp/pwshot'
  ])
  assert.throws(
    () => resolverPlaywrightHome({ override: '/uno', home: '/casa', resolver: () => { throw new Error('ausente') } }),
    /no hay Playwright\+axe utilizables/
  )
})
