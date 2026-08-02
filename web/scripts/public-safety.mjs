#!/usr/bin/env node
// Gate de contención para una web pública y estática.
//
// Principios:
//   - datos públicos: allowlist semántica, exacta y versionada;
//   - red: sólo GET/HEAD al mismo origen;
//   - despliegue: artefacto estático, sin endpoints;
//   - privacidad del propio gate: nunca imprime valores inspeccionados.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

export const PUBLIC_SCHEMA = 'madclon.public-containment.v1'
export const PUBLIC_DATA_FILES = ['manifest.json', 'overview.json', 'clones.json', 'tokens.json', 'serie.json']

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.css', '.html'])
const OUTPUT_EXTENSIONS = new Set(['.html', '.js', '.css'])

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

function validateWithheldDocument(value, file, findings) {
  if (!exactKeys(value, ['schema', 'status'], file, 'root', findings)) return
  schemaIsValid(value, file, findings)
  if (value.status !== 'withheld') findings.push(finding('PUBLIC_STATUS_MUST_BE_WITHHELD', file, 'status'))
}

export function validatePublicDocument(name, value) {
  const file = `data/${name}`
  const findings = []

  if (!isRecord(value)) {
    findings.push(finding('PUBLIC_DOCUMENT_NOT_OBJECT', file, 'root'))

    return findings
  }

  if (name === 'manifest.json') {
    if (!exactKeys(value, ['schema', 'generated_at'], file, 'root', findings)) return findings
    schemaIsValid(value, file, findings)

    if (typeof value.generated_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value.generated_at)) {
      findings.push(finding('PUBLIC_TIMESTAMP_NOT_UTC_ISO8601', file, 'generated_at'))
    }

    return findings
  }

  if (name === 'serie.json') {
    if (!exactKeys(value, ['schema', 'status', 'points'], file, 'root', findings)) return findings
    schemaIsValid(value, file, findings)
    if (value.status !== 'withheld') findings.push(finding('PUBLIC_STATUS_MUST_BE_WITHHELD', file, 'status'))

    if (!Array.isArray(value.points) || value.points.length !== 0) {
      findings.push(finding('PUBLIC_SERIES_MUST_BE_EMPTY', file, 'points'))
    }

    return findings
  }

  if (['overview.json', 'clones.json', 'tokens.json'].includes(name)) {
    validateWithheldDocument(value, file, findings)

    return findings
  }

  findings.push(finding('PUBLIC_DATA_FILE_NOT_ALLOWLISTED', file, 'directory'))

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

    try {
      value = JSON.parse(readFileSync(path, 'utf8'))
    } catch {
      findings.push(finding('PUBLIC_DATA_INVALID_JSON', `data/${name}`, 'file'))

      continue
    }

    findings.push(...validatePublicDocument(name, value))
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

  const externalElement = /(?:\bsrc\b|\bposter\b)\s*=\s*(?:\{\s*)?['"`]https?:\/\//i.test(source)
  const externalCss = extname(file) === '.css' && /url\(\s*['"]?https?:\/\//i.test(source)

  if (externalElement || externalCss) {
    findings.push(finding('RUNTIME_EXTERNAL_SUBRESOURCE_FORBIDDEN', file, 'origin'))
  }

  for (const call of fetchCalls(source)) {
    const argument = firstArgument(call)

    if (!isAllowlistedFetchTarget(argument, file, source)) {
      findings.push(finding('RUNTIME_FETCH_TARGET_NOT_ALLOWLISTED', file, 'origin'))
    }
  }

  return findings
}

export function auditServiceWorkerSource(source, file = 'public/sw.js') {
  const findings = []

  if (
    /caches\s*\.\s*open\s*\([^)]*(?:madclon-datos-|\b(?:data|datos?)\b)|\b(?:const|let|var)\s+DATOS(?:_P)?\b|\bdatos\s*\.\s*(?:add|addAll|put)\s*\(|\b(?:add|addAll|put)\s*\([^)]*\/data\//i.test(source)
  ) {
    findings.push(finding('SERVICE_WORKER_DATA_CACHE_FORBIDDEN', file, 'cache'))
  }

  if (!/if\s*\(esDatos\(url\.pathname\)\)\s*\{[\s\S]*?cache\s*:\s*['"]no-store['"][\s\S]*?return[\s\S]*?\}/.test(source)) {
    findings.push(finding('SERVICE_WORKER_DATA_NO_STORE_GUARD_MISSING', file, 'cache'))
  }

  if (!/c\.startsWith\(['"]madclon-datos-['"]\)/.test(source)) {
    findings.push(finding('SERVICE_WORKER_OLD_DATA_CACHE_PURGE_MISSING', file, 'cache'))
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

  if (/\bfetch\s*\([^)]{0,500}\bmethod\s*:\s*['"`](?!GET['"`]|HEAD['"`])[A-Z]+['"`]/i.test(source)) {
    findings.push(finding('OUTPUT_MUTATING_FETCH_FORBIDDEN', file, 'mutation'))
  }

  if (extname(file) === '.css' && /url\(\s*['"]?https?:\/\//i.test(source)) {
    findings.push(finding('OUTPUT_EXTERNAL_STYLESHEET_RESOURCE_FORBIDDEN', file, 'origin'))
  }

  return findings
}

export function auditOutputTree(webRoot) {
  const out = join(webRoot, 'out')

  if (!existsSync(out)) return [finding('STATIC_OUTPUT_MISSING', 'out', 'output')]

  const findings = []

  for (const path of walkFiles(out, null)) {
    const file = relative(webRoot, path).split(sep).join('/')

    if (/(?:^|\/)api(?:\/|$)/.test(file) || /\.(?:php|cgi|py)$/.test(file)) {
      findings.push(finding('OUTPUT_ENDPOINT_FORBIDDEN', file, 'api'))
    }

    if (extname(path) === '.html') findings.push(...auditOutputHtml(readFileSync(path, 'utf8'), file))
    if (OUTPUT_EXTENSIONS.has(extname(path))) findings.push(...auditOutputCode(readFileSync(path, 'utf8'), file))
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
      ...auditRuntimeTree(root)
    ]
  }

  if (mode === 'out') {
    return [
      ...auditPublicDataDirectory(join(root, 'out', 'data')),
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
