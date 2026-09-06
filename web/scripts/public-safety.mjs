#!/usr/bin/env node
// Gate de contención para una web pública y estática.
//
// Principios:
//   - datos públicos: proyección legada aprobada por MAD (2026-08-03) con forma
//     estructural mínima y escáner de contenido sensible BLOQUEANTE; también se
//     acepta el documento canónico retenido (`withheld`) como estado transitorio;
//   - red: sólo GET/HEAD al mismo origen;
//   - despliegue: artefacto estático, sin endpoints;
//   - privacidad del propio gate: nunca imprime valores inspeccionados.

import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

export const PUBLIC_SCHEMA = 'madclon.public-containment.v1'
export const PUBLIC_DATA_FILES = ['manifest.json', 'overview.json', 'clones.json', 'tokens.json', 'serie.json', 'pulso.json']
export const PUBLIC_PINNED_ASSET_FILES = [
  'identidad/avatar.png',
  'identidad/retrato.png',
  'images/avatars/1.png',
  'images/hero-ambiental.png',
  'images/logo-192.png',
  'images/logo-512.png',
  'images/og-madclon.png',
  'manifest.webmanifest',
  'media/README.md',
  'media/hero-loop.mp4',
  'media/hero-loop.webm',
  'media/manifest.json',
  'sw.js'
]
export const APP_PINNED_ASSET_FILES = [
  'src/app/apple-icon.png',
  'src/app/favicon.ico',
  'src/app/icon.svg'
]

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.css', '.html'])
const OUTPUT_EXTENSIONS = new Set(['.html', '.js', '.css'])
const OUTPUT_TEXT_EXTENSIONS = new Set(['.html', '.js', '.css', '.txt', '.json', '.xml', '.webmanifest', '.svg'])

// Tripwires de nombres de estructura interna: VACÍA a propósito (2026-08-03).
// El vocabulario de métricas de sistema (fichas_curadas, automejora, patrimonio
// como nombre de clon de la flota, dossier como palabra llana del FAQ…) fue
// superficie pública aprobada por MAD durante la primera semana del escaparate;
// su decisión de hoy («mejor datos incompletos que un error») restaura esa
// superficie. La frontera de privacidad real es SENSITIVE_DATA_PATTERNS sobre
// los documentos de datos: emails, teléfonos, rutas locales y secretos bloquean
// siempre el build.
const PRIVATE_ARTIFACT_MARKERS = []

// Contenido sensible BLOQUEANTE en documentos de datos: si el JSON contiene un
// email, un teléfono, una ruta local o un secreto, el build falla siempre,
// independientemente del esquema. Teléfonos solo con separadores o prefijo +34:
// una cifra de tokens de 9 dígitos NUNCA debe disparar el tripwire.
const SENSITIVE_DATA_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  /\+34[\s.-]?\d{2,3}[\s.-]?\d{2,3}[\s.-]?\d{2,4}/,
  /\b[6789]\d{2}[\s.-]\d{3}[\s.-]\d{3}\b/,
  /\/Users\/|\/home\/|[A-Z]:\\/i,
  /sk-[a-zA-Z0-9]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|bearer\s+[a-z0-9._-]{8,}|api[_-]?key"?\s*[:=]\s*"?[a-z0-9._-]{8,}/i
]

function finding(code, file, area) {
  return { code, file, area }
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function exactKeys(value, allowed, file, area, findings) {
  if (!isRecord(value)) {
    findings.push(finding('PUBLIC_DOCUMENT_NOT_OBJECT', file, area))

    return false
  }

  const keys = Object.keys(value)

  if (allowed.some(key => !Object.hasOwn(value, key))) {
    findings.push(finding('PUBLIC_REQUIRED_FIELD_MISSING', file, area))
  }

  if (keys.some(key => !allowed.includes(key))) {
    findings.push(finding('PUBLIC_FIELD_NOT_ALLOWLISTED', file, area))
  }

  return true
}

function schemaIsValid(value, file, findings) {
  if (value.schema !== PUBLIC_SCHEMA) {
    findings.push(finding('PUBLIC_SCHEMA_MISSING_OR_WRONG', file, 'schema'))

    return false
  }

  return true
}

function validUtcTimestamp(value) {
  if (typeof value !== 'string') return false
  const match = value.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?Z$/)

  if (!match) return false
  const milliseconds = (match[2] || '').padEnd(3, '0')
  const normalized = `${match[1]}.${milliseconds}Z`
  const parsed = new Date(normalized)

  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === normalized && parsed.getTime() <= Date.now() + 5 * 60 * 1000
}

function canonicalPublicDocument(name, value) {
  if (name === 'manifest.json') {
    return `${JSON.stringify({ schema: value.schema, generated_at: value.generated_at })}\n`
  }

  if (name === 'serie.json') {
    return `${JSON.stringify({ schema: value.schema, status: value.status, points: value.points })}\n`
  }

  return `${JSON.stringify({ schema: value.schema, status: value.status })}\n`
}

function validateWithheldDocument(value, file, findings) {
  if (!exactKeys(value, ['schema', 'status'], file, 'root', findings)) return
  schemaIsValid(value, file, findings)
  if (value.status !== 'withheld') findings.push(finding('PUBLIC_STATUS_MUST_BE_WITHHELD', file, 'status'))
}

// Forma estructural mínima de la proyección legada (la superficie pública que
// rigió hasta la contención y que MAD restauró el 2026-08-03). Tolerante con
// campos extra: el exportador puede crecer sin romper el gate.
const LEGACY_DATA_SHAPES = {
  'manifest.json': v => typeof v.generado === 'string' && typeof v.version === 'number',
  'overview.json': v => isRecord(v.gtd) && isRecord(v.personas) && isRecord(v.automejora) && Array.isArray(v.crons),
  'clones.json': v => Array.isArray(v.clones) && Array.isArray(v.integraciones),
  'tokens.json': v => isRecord(v.contador) && isRecord(v.kpis) && Array.isArray(v.intervenciones),
  'serie.json': v => Array.isArray(v.serie) && isRecord(v.linea_base),
  // Contrato del pulso diario para loquedigalaia-web (su data/schema/pulso.schema.json):
  // esquema cerrado, solo agregados numéricos, indicador obligatorio de tokens.
  'pulso.json': v =>
    ['clonmadv3', 'jarvis'].includes(v.clone) &&
    typeof v.asOf === 'string' &&
    Array.isArray(v.indicators) && v.indicators.length >= 1 &&
    v.indicators.every(i =>
      isRecord(i) &&
      Object.keys(i).every(k => ['id', 'label', 'value', 'unit', 'asOf', 'source', 'monotonic'].includes(k)) &&
      typeof i.id === 'string' && /^[a-z0-9-]+$/.test(i.id) &&
      typeof i.label === 'string' &&
      typeof i.value === 'number' && Number.isFinite(i.value) &&
      typeof i.unit === 'string' &&
      typeof i.asOf === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(i.asOf) &&
      typeof i.source === 'string')
}

function isWithheldDocument(name, value) {
  if (!isRecord(value) || value.schema !== PUBLIC_SCHEMA) return false
  if (name === 'manifest.json') return true // el timestamp se valida en su rama

  return value.status === 'withheld'
}

function validateLegacyDocument(name, value, source, file, findings) {
  const shape = LEGACY_DATA_SHAPES[name]

  if (!shape || !shape(value)) {
    findings.push(finding('PUBLIC_DATA_LEGACY_SHAPE_INVALID', file, 'schema'))

    return
  }

  if (SENSITIVE_DATA_PATTERNS.some(pattern => pattern.test(source))) {
    findings.push(finding('PUBLIC_DATA_SENSITIVE_CONTENT', file, 'privacy'))
  }
}

// Contrato dual: el documento retenido canónico sigue siendo válido (estado
// transitorio) y la proyección legada con contenido saneado también. Un
// documento que no es NINGUNA de las dos cosas produce hallazgos.
export function validatePublicDocument(name, value, source = null) {
  const file = `data/${name}`
  const findings = []

  if (!isRecord(value)) {
    findings.push(finding('PUBLIC_DOCUMENT_NOT_OBJECT', file, 'root'))

    return findings
  }

  if (!PUBLIC_DATA_FILES.includes(name)) {
    findings.push(finding('PUBLIC_DATA_FILE_NOT_ALLOWLISTED', file, 'directory'))

    return findings
  }

  if (isWithheldDocument(name, value)) {
    if (name === 'manifest.json') {
      if (!exactKeys(value, ['schema', 'generated_at'], file, 'root', findings)) return findings

      if (!validUtcTimestamp(value.generated_at)) {
        findings.push(finding('PUBLIC_TIMESTAMP_NOT_UTC_ISO8601', file, 'generated_at'))
      }

      return findings
    }

    if (name === 'serie.json') {
      if (!exactKeys(value, ['schema', 'status', 'points'], file, 'root', findings)) return findings

      if (!Array.isArray(value.points) || value.points.length !== 0) {
        findings.push(finding('PUBLIC_SERIES_MUST_BE_EMPTY', file, 'points'))
      }

      return findings
    }

    validateWithheldDocument(value, file, findings)

    return findings
  }

  validateLegacyDocument(name, value, source ?? JSON.stringify(value), file, findings)

  return findings
}

export function auditPublicDataDirectory(directory) {
  const findings = []

  if (!existsSync(directory)) {
    return [finding('PUBLIC_DATA_DIRECTORY_MISSING', 'data', 'directory')]
  }

  const entries = readdirSync(directory, { withFileTypes: true })
  const allowed = new Set(PUBLIC_DATA_FILES)

  for (const entry of entries) {
    if (!allowed.has(entry.name) || !entry.isFile()) {
      findings.push(finding('PUBLIC_DATA_ENTRY_NOT_ALLOWLISTED', 'data', 'directory'))
    }
  }

  for (const name of PUBLIC_DATA_FILES) {
    const path = join(directory, name)

    if (!existsSync(path) || !statSync(path).isFile()) {
      findings.push(finding('PUBLIC_DATA_FILE_MISSING', `data/${name}`, 'directory'))

      continue
    }

    if (statSync(path).size > 64 * 1024) {
      findings.push(finding('PUBLIC_DATA_FILE_TOO_LARGE', `data/${name}`, 'file'))

      continue
    }

    let value
    let source

    try {
      source = readFileSync(path, 'utf8')
      value = JSON.parse(source)
    } catch {
      findings.push(finding('PUBLIC_DATA_INVALID_JSON', `data/${name}`, 'file'))

      continue
    }

    const documentFindings = validatePublicDocument(name, value, source)

    findings.push(...documentFindings)

    // La exigencia de JSON canónico byte a byte solo aplica al estado retenido;
    // la proyección legada se valida por forma y contenido, no por serialización.
    if (documentFindings.length === 0 && isWithheldDocument(name, value) && source !== canonicalPublicDocument(name, value)) {
      findings.push(finding('PUBLIC_DATA_NON_CANONICAL_JSON', `data/${name}`, 'file'))
    }
  }

  return findings
}

function walkFiles(directory, extensions, output = []) {
  if (!existsSync(directory)) return output

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)

    if (entry.isDirectory()) {
      walkFiles(path, extensions, output)
    } else if (entry.isFile() && (!extensions || extensions.has(extname(entry.name)))) {
      output.push(path)
    }
  }

  return output
}

function walkEntries(directory, root = directory, output = []) {
  if (!existsSync(directory)) return output

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    const name = relative(root, path).split(sep).join('/')

    if (entry.isDirectory()) walkEntries(path, root, output)
    else output.push({ path, name, regular: entry.isFile() && lstatSync(path).isFile() })
  }

  return output
}

function loadAssetManifest(webRoot) {
  const path = join(webRoot, 'scripts', 'public-assets-v1.json')

  if (!existsSync(path)) {
    return { findings: [finding('PUBLIC_ASSET_MANIFEST_MISSING', 'scripts/public-assets-v1.json', 'configuration')] }
  }

  try {
    const manifest = JSON.parse(readFileSync(path, 'utf8'))

    if (
      !isRecord(manifest) ||
      manifest.schema !== 'madclon.public-assets.v1' ||
      !isRecord(manifest.assets) ||
      !isRecord(manifest.app_assets) ||
      !sameStringSet(Object.keys(manifest.assets), PUBLIC_PINNED_ASSET_FILES) ||
      !sameStringSet(Object.keys(manifest.app_assets), APP_PINNED_ASSET_FILES)
    ) {
      throw new Error('invalid')
    }

    for (const [name, metadata] of [...Object.entries(manifest.assets), ...Object.entries(manifest.app_assets)]) {
      if (
        name !== name.normalize('NFC') ||
        name.startsWith('/') ||
        name.split('/').includes('..') ||
        !isRecord(metadata) ||
        !Number.isSafeInteger(metadata.size) ||
        metadata.size < 0 ||
        typeof metadata.sha256 !== 'string' ||
        !/^[a-f0-9]{64}$/.test(metadata.sha256)
      ) {
        throw new Error('invalid')
      }
    }

    for (const metadata of Object.values(manifest.app_assets)) {
      if (
        typeof metadata.output !== 'string' ||
        metadata.output.startsWith('/') ||
        metadata.output.split('/').includes('..')
      ) {
        throw new Error('invalid')
      }
    }

    return { manifest, findings: [] }
  } catch {
    return { findings: [finding('PUBLIC_ASSET_MANIFEST_INVALID', 'scripts/public-assets-v1.json', 'configuration')] }
  }
}

function sameStringSet(actual, expected) {
  return actual.length === expected.length && actual.every(name => expected.includes(name))
}

function hashFile(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function verifyPinnedFile(path, metadata, file, findings) {
  if (!existsSync(path) || !lstatSync(path).isFile() || lstatSync(path).nlink !== 1) {
    findings.push(finding('PUBLIC_PINNED_ASSET_MISSING_OR_UNSAFE', file, 'asset'))

    return
  }

  if (lstatSync(path).size !== metadata.size || hashFile(path) !== metadata.sha256) {
    findings.push(finding('PUBLIC_PINNED_ASSET_MISMATCH', file, 'asset'))
  }
}

export function auditPublicAssetTree(webRoot) {
  const loaded = loadAssetManifest(webRoot)

  if (!loaded.manifest) return loaded.findings
  const findings = [...loaded.findings]
  const publicRoot = join(webRoot, 'public')

  if (!existsSync(publicRoot)) return [finding('PUBLIC_DIRECTORY_MISSING', 'public', 'directory')]

  const expected = new Set([
    ...PUBLIC_DATA_FILES.map(name => `data/${name}`),
    ...Object.keys(loaded.manifest.assets)
  ])

  const seenFolded = new Set()
  const entries = walkEntries(publicRoot)

  for (const entry of entries) {
    const folded = entry.name.normalize('NFC').toLocaleLowerCase('en-US')

    if (seenFolded.has(folded)) findings.push(finding('PUBLIC_ASSET_PATH_COLLISION', 'public', 'directory'))
    seenFolded.add(folded)

    if (!entry.regular || !expected.has(entry.name)) {
      findings.push(finding('PUBLIC_ASSET_NOT_ALLOWLISTED', 'public', 'directory'))
    }
  }

  for (const name of expected) {
    if (!entries.some(entry => entry.regular && entry.name === name)) {
      findings.push(finding('PUBLIC_ASSET_MISSING', `public/${name}`, 'asset'))
    }
  }

  for (const [name, metadata] of Object.entries(loaded.manifest.assets)) {
    verifyPinnedFile(join(publicRoot, name), metadata, `public/${name}`, findings)
  }

  for (const [name, metadata] of Object.entries(loaded.manifest.app_assets)) {
    verifyPinnedFile(join(webRoot, name), metadata, name, findings)
  }

  return findings
}

function firstArgument(body) {
  let quote = ''
  let escaped = false
  let round = 0
  let square = 0
  let curly = 0

  for (let i = 0; i < body.length; i += 1) {
    const char = body[i]

    if (quote) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === quote) quote = ''
      continue
    }

    if (char === "'" || char === '"' || char === '`') quote = char
    else if (char === '(') round += 1
    else if (char === ')') round -= 1
    else if (char === '[') square += 1
    else if (char === ']') square -= 1
    else if (char === '{') curly += 1
    else if (char === '}') curly -= 1
    else if (char === ',' && round === 0 && square === 0 && curly === 0) return body.slice(0, i).trim()
  }

  return body.trim()
}

function fetchCalls(source) {
  const calls = []
  const startPattern = /\bfetch\s*\(/g

  while (startPattern.exec(source) !== null) {
    const start = startPattern.lastIndex
    let depth = 1
    let quote = ''
    let escaped = false
    let end = start

    for (; end < source.length && depth > 0; end += 1) {
      const char = source[end]

      if (quote) {
        if (escaped) escaped = false
        else if (char === '\\') escaped = true
        else if (char === quote) quote = ''
        continue
      }

      if (char === "'" || char === '"' || char === '`') quote = char
      else if (char === '(') depth += 1
      else if (char === ')') depth -= 1
    }

    calls.push(source.slice(start, Math.max(start, end - 1)))
    startPattern.lastIndex = Math.max(startPattern.lastIndex, end)
  }

  return calls
}

function isAllowlistedFetchTarget(argument, relativeFile, source) {
  if (/^(?:'|"|`)\/(?!\/)/.test(argument)) return true
  if (/^`\$\{BASE\}\//.test(argument)) return true

  if (argument === 'req' && relativeFile === 'public/sw.js') {
    const getOnly = /if\s*\(req\.method\s*!==\s*['"]GET['"]\)\s*return/.test(source)
    const sameOrigin = /if\s*\(url\.origin\s*!==\s*self\.location\.origin\)\s*return/.test(source)

    return getOnly && sameOrigin
  }

  return false
}

// ── SALIDA NAVEGABLE DECLARADA ──────────────────────────────────────────────────
// El escaparate no tenía NINGUNA salida externa, y era a propósito. MAD abre una
// (12/08/2026): el sello de versión del pie es la puerta al panel privado, que
// pide identificación nada más llegar. La dirección es de su tailnet (rango
// 100.x): no se enruta desde internet, así que publicarla revela que existe y
// cómo se llama, no da acceso.
//
// Se declara por FICHERO + DESTINO EXACTO + atributo `href`. No es una lista que
// crezca sola: añadir otra obliga a escribirla aquí, que es justo el punto.
export const SALIDA_NAVEGABLE_DECLARADA = {
  fichero: 'src/components/layout/shared/SelloVersion.tsx',
  destino: 'http://macstudio-de-clon.tail89283c.ts.net/entrar'
}

function descontarSalidaDeclarada(source, file) {
  if (file !== SALIDA_NAVEGABLE_DECLARADA.fichero) return source

  const destino = SALIDA_NAVEGABLE_DECLARADA.destino.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  return source.replace(new RegExp(`\\bhref\\s*=\\s*(['"\`])${destino}\\1`, 'g'), 'href=§declarada§')
}

export function auditRuntimeSource(source, relativeFile) {
  const file = relativeFile.split(sep).join('/')
  const findings = []

  if (/^src\/pages\/api(?:\/|$)/.test(file) || /^src\/app\/api(?:\/|$)/.test(file) || /^src\/app\/(?:.*\/)?route\.(?:js|jsx|mjs|cjs|ts|tsx)$/.test(file)) {
    findings.push(finding('RUNTIME_API_ROUTE_FORBIDDEN', file, 'api'))
  }

  if (/^(?:src\/)?(?:middleware|proxy)\.(?:js|jsx|mjs|cjs|ts|tsx)$/.test(file)) {
    findings.push(finding('RUNTIME_MIDDLEWARE_FORBIDDEN', file, 'api'))
  }

  if (/(?:^|[;\n])\s*['"]use server['"]\s*;?/.test(source)) {
    findings.push(finding('RUNTIME_SERVER_ACTION_FORBIDDEN', file, 'mutation'))
  }

  if (/\bexport\s+(?:(?:async\s+)?function|(?:const|let|var))\s+(?:POST|PUT|PATCH|DELETE)\b/.test(source)) {
    findings.push(finding('RUNTIME_MUTATING_HANDLER_FORBIDDEN', file, 'mutation'))
  }

  const hasNonReadMethod = [...source.matchAll(/\bmethod\s*:\s*['"`]([A-Z]+)['"`]/gi)].some(
    match => !['GET', 'HEAD'].includes(match[1].toUpperCase())
  )

  if (hasNonReadMethod) {
    findings.push(finding('RUNTIME_MUTATING_METHOD_FORBIDDEN', file, 'mutation'))
  }

  if (/\b(?:axios\s*\.\s*(?:post|put|patch|delete)|navigator\s*\.\s*sendBeacon|WebSocket\s*\(|EventSource\s*\(|XMLHttpRequest\s*\()/i.test(source)) {
    findings.push(finding('RUNTIME_EGRESS_CLIENT_FORBIDDEN', file, 'network'))
  }

  // La salida declarada se descuenta ANTES de mirar, y solo donde está declarada:
  // en cualquier otro fichero, o usada como `src`, o con otro destino, esa misma
  // línea vuelve a bloquear el build.
  const sinDeclarada = descontarSalidaDeclarada(source, file)

  const externalElement = /(?:\bsrc\b|\bposter\b)\s*=\s*(?:\{\s*)?['"`]https?:\/\//i.test(sinDeclarada)
  const externalCss = extname(file) === '.css' && /url\(\s*['"]?https?:\/\//i.test(sinDeclarada)

  const externalNavigation =
    /\bhref\s*=\s*(?:\{\s*)?['"`]https?:\/\//i.test(sinDeclarada) ||
    /\b(?:window\.)?location\s*(?:=|\.(?:assign|replace)\s*\()\s*['"`]https?:\/\//i.test(sinDeclarada) ||
    /\bwindow\.open\s*\(\s*['"`]https?:\/\//i.test(sinDeclarada)

  if (externalElement || externalCss || externalNavigation) {
    findings.push(finding('RUNTIME_EXTERNAL_SUBRESOURCE_FORBIDDEN', file, 'origin'))
  }

  for (const call of fetchCalls(source)) {
    const argument = firstArgument(call)

    const unsafeDynamicMethod = [...call.matchAll(/\bmethod\s*:\s*([^,}\n]+)/gi)].some(
      match => !/^['"`](?:GET|HEAD)['"`]$/i.test(match[1].trim())
    ) || /(?:^|[{,])\s*method\s*(?:[,}])/.test(call) || /\.\.\./.test(call)

    if (!isAllowlistedFetchTarget(argument, file, source)) {
      findings.push(finding('RUNTIME_FETCH_TARGET_NOT_ALLOWLISTED', file, 'origin'))
    }

    if (unsafeDynamicMethod) {
      findings.push(finding('RUNTIME_MUTATING_METHOD_FORBIDDEN', file, 'mutation'))
    }
  }

  return findings
}

export function auditServiceWorkerSource(source, file = 'public/sw.js') {
  const findings = []

  // Diseño aprobado (PWA v2, restaurado por decisión de MAD 2026-08-03): los JSON
  // de /data se cachean UN DÍA con sello `sw-fecha` y sirven lo guardado cuando no
  // hay red — la degradación elegante también aplica offline. Lo que el gate exige
  // es que esa caché sea segura: solo GET, mismo origen, caducidad y purga.

  if (!/if\s*\(req\.method\s*!==\s*['"]GET['"]\)\s*return/.test(source)) {
    findings.push(finding('SERVICE_WORKER_GET_GUARD_MISSING', file, 'cache'))
  }

  if (!/url\.origin\s*!==\s*self\.location\.origin/.test(source)) {
    findings.push(finding('SERVICE_WORKER_ORIGIN_GUARD_MISSING', file, 'cache'))
  }

  if (!/sw-fecha/.test(source) || !/DIA_MS\s*=\s*24\s*\*\s*60\s*\*\s*60\s*\*\s*1000/.test(source)) {
    findings.push(finding('SERVICE_WORKER_DATA_CACHE_EXPIRY_MISSING', file, 'cache'))
  }

  if (!/caches\.delete/.test(source)) {
    findings.push(finding('SERVICE_WORKER_OLD_CACHE_PURGE_MISSING', file, 'cache'))
  }

  return findings
}

export function auditRuntimeTree(webRoot) {
  const findings = []
  const roots = [join(webRoot, 'src'), join(webRoot, 'public')]

  for (const root of roots) {
    for (const path of walkFiles(root, SOURCE_EXTENSIONS)) {
      if (path.includes(`${sep}public${sep}data${sep}`)) continue
      const relativeFile = relative(webRoot, path)
      const source = readFileSync(path, 'utf8')

      findings.push(...auditRuntimeSource(source, relativeFile))
    }
  }

  for (const stem of ['middleware', 'proxy']) {
    for (const extension of SOURCE_EXTENSIONS) {
      const path = join(webRoot, `${stem}${extension}`)

      if (existsSync(path)) findings.push(...auditRuntimeSource(readFileSync(path, 'utf8'), relative(webRoot, path)))
    }
  }

  const swPath = join(webRoot, 'public', 'sw.js')

  if (!existsSync(swPath)) findings.push(finding('SERVICE_WORKER_MISSING', 'public/sw.js', 'cache'))
  else findings.push(...auditServiceWorkerSource(readFileSync(swPath, 'utf8')))

  return findings
}

function auditOutputHtml(source, file) {
  const findings = []
  const externalSubresource = /<(?:script|img|iframe|source|video|audio)\b[^>]*(?:src|poster)\s*=\s*['"]https?:\/\//i
  const externalLinkResource = /<link\b(?=[^>]*\brel\s*=\s*['"](?:stylesheet|preload|modulepreload|icon)['"])[^>]*\bhref\s*=\s*['"]https?:\/\//i

  if (externalSubresource.test(source) || externalLinkResource.test(source)) {
    findings.push(finding('OUTPUT_EXTERNAL_SUBRESOURCE_FORBIDDEN', file, 'origin'))
  }

  for (const form of source.matchAll(/<form\b[^>]*>/gi)) {
    const method = form[0].match(/\bmethod\s*=\s*['"]([^'"]+)['"]/i)?.[1] || 'get'

    if (!/^(?:get)$/i.test(method)) findings.push(finding('OUTPUT_MUTATING_FORM_FORBIDDEN', file, 'mutation'))
    if (/\baction\s*=\s*['"]https?:\/\//i.test(form[0])) findings.push(finding('OUTPUT_EXTERNAL_FORM_ACTION_FORBIDDEN', file, 'origin'))
  }

  return findings
}

function auditOutputCode(source, file) {
  const findings = []

  if (/\bfetch\s*\(\s*['"`]https?:\/\//i.test(source)) {
    findings.push(finding('OUTPUT_EXTERNAL_FETCH_FORBIDDEN', file, 'origin'))
  }

  // Next incluye un transporte genérico de Server Actions aunque la exportación
  // estática no declare acciones ni endpoints. Eximimos sólo ESA llamada exacta,
  // nunca el chunk entero: otra mutación co-bundleada sigue bloqueando el build.
  const mutaciones = [...source.matchAll(/\bfetch\s*\([^)]{0,500}\bmethod\s*:\s*['"`](?!GET['"`]|HEAD['"`])[A-Z]+['"`]/gi)]

  const mutacionReal = mutaciones.some(match => {
    const start = Math.max(0, (match.index || 0) - 2000)
    const end = Math.min(source.length, (match.index || 0) + match[0].length + 2000)
    const context = source.slice(start, end)

    const transporteNext =
      /^out\/_next\/static\/chunks\/[^/]+\.js$/.test(file) &&
      /^fetch\([\w$.]+,\{method:['"]POST['"]$/i.test(match[0]) &&
      /NEXT_ACTION_NOT_FOUND_HEADER/.test(context) &&
      /UnrecognizedActionError/.test(context) &&
      /RSC_CONTENT_TYPE_HEADER/.test(context)

    return !transporteNext
  })

  if (mutacionReal) {
    findings.push(finding('OUTPUT_MUTATING_FETCH_FORBIDDEN', file, 'mutation'))
  }

  if (extname(file) === '.css' && /url\(\s*['"]?https?:\/\//i.test(source)) {
    findings.push(finding('OUTPUT_EXTERNAL_STYLESHEET_RESOURCE_FORBIDDEN', file, 'origin'))
  }

  return findings
}

function auditOutputPrivacyText(source, file) {
  // Remix Icon incluye dos nombres de clase legítimos con «dossier». Se retiran
  // únicamente esos selectores; el resto del CSS (incluido `content:`) se audita.
  const normalized = source
    .replace(/\.ri-dossier-(?:fill|line)\b/gi, '')
    .toLocaleLowerCase('es-ES')

  return PRIVATE_ARTIFACT_MARKERS.some(marker => normalized.includes(marker))
    ? [finding('OUTPUT_PRIVATE_STRUCTURE_FORBIDDEN', file, 'privacy')]
    : []
}

const OUTPUT_ROUTE_DIRECTORIES = new Set([
  '404',
  '_not-found',
  'actividad',
  'eficiencia',
  'flota',
  'historia',
  'preguntas',
  'retos',
  'salud',
  'tokens'
])

function isAllowedGeneratedOutput(name, pinned) {
  if (pinned.has(name) || PUBLIC_DATA_FILES.some(file => name === `data/${file}`)) return true
  if (name === '404.html' || name === 'index.html' || name === 'index.txt') return true
  if (name === 'robots.txt' || name === 'sitemap.xml') return true
  if (/^__next\.[^/]+\.txt$/.test(name)) return true
  if (/^_next\/static\/.+\.(?:js|css|woff2)$/.test(name)) return true

  const slash = name.indexOf('/')

  if (slash < 0) return false
  const directory = name.slice(0, slash)
  const nested = name.slice(slash + 1)

  if (!OUTPUT_ROUTE_DIRECTORIES.has(directory)) return false

  return nested === 'index.html' || nested === 'index.txt' || /^__next\.[^/]+\.txt$/.test(nested)
}

function auditPinnedOutputAssets(webRoot, manifest) {
  const findings = []
  const out = join(webRoot, 'out')

  for (const [name, metadata] of Object.entries(manifest.assets)) {
    verifyPinnedFile(join(out, name), metadata, `out/${name}`, findings)
  }

  for (const metadata of Object.values(manifest.app_assets)) {
    verifyPinnedFile(join(out, metadata.output), metadata, `out/${metadata.output}`, findings)
  }

  return findings
}

export function auditOutputTree(webRoot) {
  const out = join(webRoot, 'out')

  if (!existsSync(out)) return [finding('STATIC_OUTPUT_MISSING', 'out', 'output')]

  const loaded = loadAssetManifest(webRoot)
  const findings = [...loaded.findings]
  const pinned = new Set()

  if (loaded.manifest) {
    Object.keys(loaded.manifest.assets).forEach(name => pinned.add(name))
    Object.values(loaded.manifest.app_assets).forEach(metadata => pinned.add(metadata.output))
    findings.push(...auditPinnedOutputAssets(webRoot, loaded.manifest))
  }

  for (const entry of walkEntries(out)) {
    const file = `out/${entry.name}`
    const allowlisted = entry.regular && isAllowedGeneratedOutput(entry.name, pinned)
    const reportedFile = allowlisted ? file : 'out'

    if (!allowlisted) {
      findings.push(finding('OUTPUT_FILE_NOT_ALLOWLISTED', 'out', 'output'))
    }

    if (/(?:^|\/)api(?:\/|$)/.test(file) || /\.(?:php|cgi|py)$/.test(file)) {
      findings.push(finding('OUTPUT_ENDPOINT_FORBIDDEN', reportedFile, 'api'))
    }

    if (!entry.regular) continue
    const extension = extname(entry.path)
    const source = OUTPUT_TEXT_EXTENSIONS.has(extension) ? readFileSync(entry.path, 'utf8') : null

    if (extension === '.html') findings.push(...auditOutputHtml(source, reportedFile))
    if (OUTPUT_EXTENSIONS.has(extension)) findings.push(...auditOutputCode(source, reportedFile))
    if (source !== null) findings.push(...auditOutputPrivacyText(source, reportedFile))
  }

  const swPath = join(out, 'sw.js')

  if (!existsSync(swPath)) findings.push(finding('OUTPUT_SERVICE_WORKER_MISSING', 'out/sw.js', 'cache'))
  else findings.push(...auditServiceWorkerSource(readFileSync(swPath, 'utf8'), 'out/sw.js'))

  return findings
}

export function auditPublicSafety({ webRoot = process.cwd(), mode = 'source' } = {}) {
  const root = resolve(webRoot)

  if (mode === 'source') {
    return [
      ...auditPublicDataDirectory(join(root, 'public', 'data')),
      ...auditPublicAssetTree(root),
      ...auditRuntimeTree(root)
    ]
  }

  if (mode === 'out') {
    return [
      ...auditPublicDataDirectory(join(root, 'out', 'data')),
      ...auditPublicAssetTree(root),
      ...auditOutputTree(root)
    ]
  }

  return [finding('SAFETY_MODE_INVALID', 'gate', 'configuration')]
}

export function formatFinding(item) {
  // Deliberadamente no hay mensaje libre ni valor observado.
  return `${item.file}: ${item.code} [${item.area}]`
}

function parseMode(argv) {
  if (argv.includes('--out')) return 'out'
  if (argv.includes('--source')) return 'source'

  return null
}

function main() {
  const mode = parseMode(process.argv.slice(2))

  if (!mode) {
    console.error('Uso: node scripts/public-safety.mjs --source|--out')
    process.exit(2)
  }

  const findings = auditPublicSafety({ mode })

  if (findings.length === 0) {
    console.log(`PUBLIC SAFETY OK · ${mode} · allowlist ${PUBLIC_SCHEMA}`)

    return
  }

  console.error(`PUBLIC SAFETY BLOQUEADO · ${mode} · ${findings.length} hallazgos`)
  for (const item of findings) console.error(`  - ${formatFinding(item)}`)
  process.exit(1)
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href

if (isMain) main()
