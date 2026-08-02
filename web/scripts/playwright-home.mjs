import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { join } from 'node:path'

export function candidatosPlaywright({ override = process.env.PW_HOME, home = homedir(), legacy = '/tmp/pwshot' } = {}) {
  return [...new Set([override, join(home, '.clonmad/panel/pwshot'), legacy].filter(Boolean))]
}

export function resolverPlaywrightHome(opciones = {}) {
  const candidatos = candidatosPlaywright(opciones)
  const resolver =
    opciones.resolver ||
    ((directorio, modulo) => createRequire(join(directorio, 'noop.js')).resolve(modulo))
  const errores = []

  for (const directorio of candidatos) {
    try {
      resolver(directorio, 'playwright')
      resolver(directorio, 'axe-core/axe.min.js')

      return { directorio, errores }
    } catch (error) {
      errores.push(`${directorio}: ${error?.code || error?.message || 'no disponible'}`)
    }
  }

  throw new Error(`no hay Playwright+axe utilizables; comprobados: ${errores.join(' · ')}`)
}
