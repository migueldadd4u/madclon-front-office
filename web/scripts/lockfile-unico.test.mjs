// Guardia del lockfile: en web/ hay UNO, y es el que instala la CI.
//
// POR QUÉ EXISTE. La plantilla trajo un `pnpm-lock.yaml` el 26/07/2026 y nadie lo
// volvió a tocar: la CI instala con yarn (`yarn install --frozen-lockfile`), así que
// ese fichero ni se usaba ni se actualizaba. Aun así el escáner de dependencias de
// GitHub lo leía y abría avisos por versiones que nunca se instalan, mezclados con
// los reales de `yarn.lock`. Un lockfile huérfano solo produce ruido y una segunda
// verdad sobre qué se publica.
//
// Si alguien cambia de gestor de paquetes, esta prueba obliga a cambiar a la vez el
// lockfile y los workflows, en el mismo commit.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const WEB = new URL('../', import.meta.url)
const RAIZ = new URL('../../', import.meta.url)

const LOCKFILES = ['yarn.lock', 'package-lock.json', 'npm-shrinkwrap.json', 'pnpm-lock.yaml', 'bun.lock', 'bun.lockb']
const WORKFLOWS = ['.github/workflows/deploy.yml', '.github/workflows/ci.yml']

test('web/ tiene un único lockfile, yarn.lock', () => {
  const presentes = LOCKFILES.filter(nombre => existsSync(new URL(nombre, WEB)))

  assert.deepEqual(presentes, ['yarn.lock'], `lockfiles en web/: ${presentes.join(', ') || 'ninguno'}`)
})

test('la raíz del repo no tiene lockfiles sueltos', () => {
  const presentes = LOCKFILES.filter(nombre => existsSync(new URL(nombre, RAIZ)))

  assert.deepEqual(presentes, [])
})

test('cada workflow que instala lo hace con yarn y el lockfile congelado', () => {
  for (const ruta of WORKFLOWS) {
    const url = new URL(ruta, RAIZ)

    if (!existsSync(url)) continue
    const yml = readFileSync(url, 'utf8')

    assert.match(yml, /yarn install --frozen-lockfile/, `${ruta} no instala con yarn.lock congelado`)
    assert.match(yml, /cache-dependency-path: web\/yarn\.lock/, `${ruta} no cachea por web/yarn.lock`)
    assert.doesNotMatch(yml, /\b(pnpm|npm ci|npm install)\b/, `${ruta} instala con otro gestor`)
  }
})
