import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  PUBLIC_DATA_FILES,
  PUBLIC_SCHEMA,
  auditOutputTree,
  auditPublicDataDirectory,
  auditRuntimeSource,
  auditServiceWorkerSource,
  validatePublicDocument
} from './public-safety.mjs'

const SAFE_DOCUMENTS = {
  'manifest.json': { schema: PUBLIC_SCHEMA, generated_at: '2026-08-03T00:00:00Z' },
  'overview.json': { schema: PUBLIC_SCHEMA, status: 'withheld' },
  'clones.json': { schema: PUBLIC_SCHEMA, status: 'withheld' },
  'tokens.json': { schema: PUBLIC_SCHEMA, status: 'withheld' },
  'serie.json': { schema: PUBLIC_SCHEMA, status: 'withheld', points: [] }
}

// Sólo conserva la forma mínima de los cinco formatos encontrados, nunca sus valores.
const LEGACY_REDACTED_SHAPES = {
  'manifest.json': { generado: 'redacted' },
  'overview.json': { gtd: {} },
  'clones.json': { clones: [] },
  'tokens.json': { contador: {} },
  'serie.json': { serie: [] }
}

const SAFE_SW = `
const esDatos = () => true
if (req.method !== 'GET') return
const url = new URL(req.url)
if (url.origin !== self.location.origin) return
if (esDatos(url.pathname)) {
  e.respondWith(fetch(req, { cache: 'no-store' }))
  return
}
c.startsWith('madclon-datos-')
`

const SAFETY_CLI = fileURLToPath(new URL('./public-safety.mjs', import.meta.url))

function withFixture(fn) {
  const root = mkdtempSync(join(tmpdir(), 'public-safety-test-'))

  try {
    return fn(root)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

function writeDocuments(directory, documents) {
  mkdirSync(directory, { recursive: true })

  for (const [name, value] of Object.entries(documents)) {
    writeFileSync(join(directory, name), JSON.stringify(value))
  }
}

test('la allowlist acepta únicamente los cinco documentos mínimos retenidos', () => {
  for (const name of PUBLIC_DATA_FILES) {
    assert.deepEqual(validatePublicDocument(name, SAFE_DOCUMENTS[name]), [], name)
  }
})

test('regresión: las cinco formas actuales redacted quedan bloqueadas una por una', () => {
  for (const name of PUBLIC_DATA_FILES) {
    const findings = validatePublicDocument(name, LEGACY_REDACTED_SHAPES[name])

    assert.ok(findings.length > 0, `${name} debía quedar bloqueado`)
    assert.ok(findings.some(item => item.code === 'PUBLIC_SCHEMA_MISSING_OR_WRONG'), `${name} debía exigir schema`)
    assert.ok(findings.some(item => item.code === 'PUBLIC_FIELD_NOT_ALLOWLISTED'), `${name} debía rechazar campos heredados`)
  }
})

test('la allowlist rechaza contenido semántico añadido aunque use el schema correcto', () => {
  const extra = validatePublicDocument('tokens.json', {
    schema: PUBLIC_SCHEMA,
    status: 'withheld',
    detail: 'redacted'
  })

  const series = validatePublicDocument('serie.json', {
    schema: PUBLIC_SCHEMA,
    status: 'withheld',
    points: [{ redacted: true }]
  })

  assert.ok(extra.some(item => item.code === 'PUBLIC_FIELD_NOT_ALLOWLISTED'))
  assert.ok(series.some(item => item.code === 'PUBLIC_SERIES_MUST_BE_EMPTY'))
})

test('el directorio público es exacto: cinco nombres y ningún adjunto', () => {
  withFixture(root => {
    const data = join(root, 'data')

    writeDocuments(data, SAFE_DOCUMENTS)
    assert.deepEqual(auditPublicDataDirectory(data), [])
    writeFileSync(join(data, 'extra.json'), '{}')
    assert.ok(auditPublicDataDirectory(data).some(item => item.code === 'PUBLIC_DATA_ENTRY_NOT_ALLOWLISTED'))
  })
})

test('no-eco: un canario en JSON inválido nunca aparece en stdout ni stderr', () => {
  withFixture(webRoot => {
    const canary = 'PRIVATE_CANARY_DO_NOT_ECHO_7f2d9c'

    writeDocuments(join(webRoot, 'public', 'data'), SAFE_DOCUMENTS)
    writeFileSync(join(webRoot, 'public', 'data', 'tokens.json'), `{"sensitive":"${canary}"`)
    writeFileSync(join(webRoot, 'public', 'sw.js'), SAFE_SW)

    const result = spawnSync(process.execPath, [SAFETY_CLI, '--source'], {
      cwd: webRoot,
      encoding: 'utf8'
    })

    const transcript = `${result.stdout}${result.stderr}`

    assert.equal(result.status, 1)
    assert.equal(result.stdout, '')
    assert.equal(
      result.stderr,
      'PUBLIC SAFETY BLOQUEADO · source · 1 hallazgos\n' +
        '  - data/tokens.json: PUBLIC_DATA_INVALID_JSON [file]\n'
    )
    assert.equal(transcript.includes(canary), false)
  })
})

test('la superficie runtime permite GET relativo al mismo origen', () => {
  const source = "fetch(`${BASE}/data/${name}.json`).then(r => r.json())"

  assert.deepEqual(auditRuntimeSource(source, 'src/lib/data.ts'), [])
})

test('la superficie runtime bloquea APIs, mutaciones y orígenes externos', () => {
  const cases = [
    ['', 'src/app/api/private/route.ts', 'RUNTIME_API_ROUTE_FORBIDDEN'],
    ['', 'src/app/route.ts', 'RUNTIME_API_ROUTE_FORBIDDEN'],
    ['', 'proxy.ts', 'RUNTIME_MIDDLEWARE_FORBIDDEN'],
    ["'use server'\nexport async function save() {}", 'src/app/action.ts', 'RUNTIME_SERVER_ACTION_FORBIDDEN'],
    ['export const DELETE = () => {}', 'src/app/delete.ts', 'RUNTIME_MUTATING_HANDLER_FORBIDDEN'],
    ["fetch('/x', { method: 'POST' })", 'src/lib/post.ts', 'RUNTIME_MUTATING_METHOD_FORBIDDEN'],
    ["fetch('https://example.invalid/x')", 'src/lib/external.ts', 'RUNTIME_FETCH_TARGET_NOT_ALLOWLISTED'],
    ['fetch(target)', 'src/lib/dynamic.ts', 'RUNTIME_FETCH_TARGET_NOT_ALLOWLISTED'],
    ["new WebSocket('wss://example.invalid')", 'src/lib/socket.ts', 'RUNTIME_EGRESS_CLIENT_FORBIDDEN']
  ]

  for (const [source, file, code] of cases) {
    assert.ok(auditRuntimeSource(source, file).some(item => item.code === code), `${file} debía emitir ${code}`)
  }
})

test('el service worker exige no-store y purga toda caché JSON anterior', () => {
  assert.deepEqual(auditServiceWorkerSource(SAFE_SW), [])
  assert.ok(
    auditServiceWorkerSource("caches.open('madclon-datos-v2')").some(
      item => item.code === 'SERVICE_WORKER_DATA_CACHE_FORBIDDEN'
    )
  )
})

test('el postbuild rechaza endpoints, mutaciones y orígenes externos', () => {
  withFixture(webRoot => {
    const out = join(webRoot, 'out')

    writeDocuments(join(out, 'data'), SAFE_DOCUMENTS)
    writeFileSync(join(out, 'sw.js'), SAFE_SW)
    writeFileSync(join(out, 'index.html'), '<form method="get"></form>')
    assert.deepEqual(auditOutputTree(webRoot), [])
    writeFileSync(
      join(out, 'index.html'),
      '<form method="post"></form><script src="https://example.invalid/x.js"></script>'
    )
    writeFileSync(join(out, 'app.js'), "fetch('https://example.invalid/x', { method: 'POST' })")
    mkdirSync(join(out, 'api'), { recursive: true })
    writeFileSync(join(out, 'api', 'private'), 'redacted')

    const findings = auditOutputTree(webRoot)

    assert.ok(findings.some(item => item.code === 'OUTPUT_MUTATING_FORM_FORBIDDEN'))
    assert.ok(findings.some(item => item.code === 'OUTPUT_EXTERNAL_SUBRESOURCE_FORBIDDEN'))
    assert.ok(findings.some(item => item.code === 'OUTPUT_MUTATING_FETCH_FORBIDDEN'))
    assert.ok(findings.some(item => item.code === 'OUTPUT_EXTERNAL_FETCH_FORBIDDEN'))
    assert.ok(findings.some(item => item.code === 'OUTPUT_ENDPOINT_FORBIDDEN'))
  })
})
