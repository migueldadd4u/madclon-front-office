import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  APP_PINNED_ASSET_FILES,
  PUBLIC_DATA_FILES,
  PUBLIC_PINNED_ASSET_FILES,
  PUBLIC_SCHEMA,
  auditOutputTree,
  auditPublicAssetTree,
  auditPublicDataDirectory,
  auditRuntimeSource,
  auditServiceWorkerSource,
  validatePublicDocument
} from './public-safety.mjs'

const SAFE_DOCUMENTS = {
  'manifest.json': { schema: PUBLIC_SCHEMA, generated_at: '2026-08-02T22:00:00Z' },
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

const FIXTURE_PUBLIC_ASSETS = {
  'images/logo-192.png': 'fixture-logo-192',
  'images/logo-512.png': 'fixture-logo-512',
  'manifest.webmanifest': '{}',
  'sw.js': SAFE_SW
}

const FIXTURE_APP_ASSETS = {
  'src/app/apple-icon.png': { output: 'apple-icon.png', content: 'fixture-apple-icon' },
  'src/app/favicon.ico': { output: 'favicon.ico', content: 'fixture-favicon' },
  'src/app/icon.svg': { output: 'icon.svg', content: '<svg></svg>' }
}

function metadata(content, output) {
  return {
    ...(output ? { output } : {}),
    size: Buffer.byteLength(content),
    sha256: createHash('sha256').update(content).digest('hex')
  }
}

function writeFixtureFile(root, name, content) {
  const path = join(root, name)

  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, content)
}

function withFixture(fn) {
  const root = mkdtempSync(join(tmpdir(), 'public-safety-test-'))

  try {
    assert.deepEqual(Object.keys(FIXTURE_PUBLIC_ASSETS).sort(), [...PUBLIC_PINNED_ASSET_FILES].sort())
    assert.deepEqual(Object.keys(FIXTURE_APP_ASSETS).sort(), [...APP_PINNED_ASSET_FILES].sort())

    for (const [name, content] of Object.entries(FIXTURE_PUBLIC_ASSETS)) {
      writeFixtureFile(join(root, 'public'), name, content)
      writeFixtureFile(join(root, 'out'), name, content)
    }

    for (const [name, asset] of Object.entries(FIXTURE_APP_ASSETS)) {
      writeFixtureFile(root, name, asset.content)
      writeFixtureFile(join(root, 'out'), asset.output, asset.content)
    }

    mkdirSync(join(root, 'scripts'), { recursive: true })
    writeFileSync(
      join(root, 'scripts', 'public-assets-v1.json'),
      JSON.stringify({
        schema: 'madclon.public-assets.v1',
        assets: Object.fromEntries(
          Object.entries(FIXTURE_PUBLIC_ASSETS).map(([name, content]) => [name, metadata(content)])
        ),
        app_assets: Object.fromEntries(
          Object.entries(FIXTURE_APP_ASSETS).map(([name, asset]) => [name, metadata(asset.content, asset.output)])
        )
      })
    )

    return fn(root)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

function writeDocuments(directory, documents) {
  mkdirSync(directory, { recursive: true })

  for (const [name, value] of Object.entries(documents)) {
    writeFileSync(join(directory, name), `${JSON.stringify(value)}\n`)
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

test('el timestamp exige una fecha UTC real', () => {
  const findings = validatePublicDocument('manifest.json', {
    schema: PUBLIC_SCHEMA,
    generated_at: '2026-99-99T99:99:99Z'
  })

  assert.ok(findings.some(item => item.code === 'PUBLIC_TIMESTAMP_NOT_UTC_ISO8601'))

  const future = validatePublicDocument('manifest.json', {
    schema: PUBLIC_SCHEMA,
    generated_at: '9999-01-01T00:00:00Z'
  })

  assert.ok(future.some(item => item.code === 'PUBLIC_TIMESTAMP_NOT_UTC_ISO8601'))
})

test('el JSON público exige una única representación canónica y no hace eco', () => {
  withFixture(root => {
    const data = join(root, 'data')
    const canary = 'PRIVATE_CANARY_DUPLICATE_KEY_6f91'

    writeDocuments(data, SAFE_DOCUMENTS)
    writeFileSync(
      join(data, 'tokens.json'),
      `{"schema":"${PUBLIC_SCHEMA}","status":"${canary}","status":"withheld"}\n`
    )
    const findings = auditPublicDataDirectory(data)
    const transcript = findings.map(item => `${item.file}:${item.code}:${item.area}`).join('\n')

    assert.ok(findings.some(item => item.code === 'PUBLIC_DATA_NON_CANONICAL_JSON'))
    assert.equal(transcript.includes(canary), false)
  })
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

test('la raíz pública rechaza activos arbitrarios sin hacer eco del nombre', () => {
  withFixture(webRoot => {
    const publicRoot = join(webRoot, 'public')
    const canary = 'PRIVATE_FILENAME_CANARY_8b4e.txt'

    writeDocuments(join(publicRoot, 'data'), SAFE_DOCUMENTS)
    writeFileSync(join(publicRoot, canary), 'contenido privado')
    const findings = auditPublicAssetTree(webRoot)
    const transcript = findings.map(item => `${item.file}:${item.code}:${item.area}`).join('\n')

    assert.ok(findings.some(item => item.code === 'PUBLIC_ASSET_NOT_ALLOWLISTED'))
    assert.equal(transcript.includes(canary), false)
  })
})

test('un hash no convierte un raster heredado en activo público aprobado', () => {
  withFixture(webRoot => {
    const manifestPath = join(webRoot, 'scripts', 'public-assets-v1.json')
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

    manifest.assets['images/metrics.png'] = metadata('private-raster-with-valid-hash')
    writeFileSync(manifestPath, JSON.stringify(manifest))
    writeFixtureFile(join(webRoot, 'public'), 'images/metrics.png', 'private-raster-with-valid-hash')

    const findings = auditPublicAssetTree(webRoot)

    assert.ok(findings.some(item => item.code === 'PUBLIC_ASSET_MANIFEST_INVALID'))
    assert.equal(findings.some(item => item.file.includes('metrics')), false)
  })
})

test('no-eco: un canario en JSON inválido nunca aparece en stdout ni stderr', () => {
  withFixture(webRoot => {
    const canary = 'PRIVATE_CANARY_DO_NOT_ECHO_7f2d9c'

    writeDocuments(join(webRoot, 'public', 'data'), SAFE_DOCUMENTS)
    writeFileSync(join(webRoot, 'public', 'data', 'tokens.json'), `{"sensitive":"${canary}"`)
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
    ["fetch('/x', { method })", 'src/lib/dynamic-method.ts', 'RUNTIME_MUTATING_METHOD_FORBIDDEN'],
    ["fetch('https://example.invalid/x')", 'src/lib/external.ts', 'RUNTIME_FETCH_TARGET_NOT_ALLOWLISTED'],
    ['fetch(target)', 'src/lib/dynamic.ts', 'RUNTIME_FETCH_TARGET_NOT_ALLOWLISTED'],
    ["new WebSocket('wss://example.invalid')", 'src/lib/socket.ts', 'RUNTIME_EGRESS_CLIENT_FORBIDDEN'],
    ["<a href='https://example.invalid'>x</a>", 'src/app/link.tsx', 'RUNTIME_EXTERNAL_SUBRESOURCE_FORBIDDEN'],
    ["window.location='https://example.invalid'", 'src/lib/location.ts', 'RUNTIME_EXTERNAL_SUBRESOURCE_FORBIDDEN']
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

    writeFileSync(join(out, 'index.html'), '<main>fichas_curadas</main>')
    assert.ok(auditOutputTree(webRoot).some(item => item.code === 'OUTPUT_PRIVATE_STRUCTURE_FORBIDDEN'))

    mkdirSync(join(out, '_next', 'static'), { recursive: true })
    writeFileSync(join(out, '_next', 'static', 'private.css'), '.ri-dossier-fill{}body::before{content:"fichas_curadas"}')
    assert.ok(auditOutputTree(webRoot).some(item => item.code === 'OUTPUT_PRIVATE_STRUCTURE_FORBIDDEN'))
  })
})

test('el postbuild rechaza un fichero arbitrario sin hacer eco del nombre', () => {
  withFixture(webRoot => {
    const out = join(webRoot, 'out')
    const canary = 'PRIVATE_OUTPUT_FILENAME_CANARY_5cc7.txt'

    writeDocuments(join(out, 'data'), SAFE_DOCUMENTS)
    writeFileSync(join(out, 'sw.js'), SAFE_SW)
    writeFileSync(join(out, 'index.html'), '<main>seguro</main>')
    writeFileSync(join(out, canary), 'contenido privado')
    const findings = auditOutputTree(webRoot)
    const transcript = findings.map(item => `${item.file}:${item.code}:${item.area}`).join('\n')

    assert.ok(findings.some(item => item.code === 'OUTPUT_FILE_NOT_ALLOWLISTED'))
    assert.equal(transcript.includes(canary), false)
  })
})

test('el postbuild distingue el transporte inerte de Next de una mutación de aplicación', () => {
  withFixture(webRoot => {
    const out = join(webRoot, 'out')
    const chunks = join(out, '_next', 'static', 'chunks')

    writeDocuments(join(out, 'data'), SAFE_DOCUMENTS)
    mkdirSync(chunks, { recursive: true })
    writeFileSync(join(out, 'sw.js'), SAFE_SW)
    writeFileSync(join(out, 'index.html'), '<main>seguro</main>')
    writeFileSync(
      join(chunks, '123-runtime.js'),
      'const RSC_CONTENT_TYPE_HEADER=1,NEXT_ACTION_NOT_FOUND_HEADER=1;' +
        'class UnrecognizedActionError extends Error{};' +
        'fetch(e.canonicalUrl,{method:"POST",headers:j,body:S})'
    )
    assert.deepEqual(auditOutputTree(webRoot), [])

    writeFileSync(
      join(chunks, '123-runtime.js'),
      'const RSC_CONTENT_TYPE_HEADER=1,NEXT_ACTION_NOT_FOUND_HEADER=1;' +
        'class UnrecognizedActionError extends Error{};' +
        'fetch(e.canonicalUrl,{method:"POST",headers:j,body:S});' +
        "fetch('/write',{method:'POST'})"
    )
    assert.ok(auditOutputTree(webRoot).some(item => item.code === 'OUTPUT_MUTATING_FETCH_FORBIDDEN'))
  })
})
