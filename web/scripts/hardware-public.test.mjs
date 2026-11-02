import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { isPublicHardware } from '../src/lib/hardware-public.mjs'
import { createPublishedHardwareReader, loadPublishedHardware } from '../src/lib/published-hardware.mjs'
import { validatePublicDocument } from './public-safety.mjs'

const host = id => ({ id, sampled_at: '2026-09-19T10:00:00Z', cpu_percent: 0, ram_total_bytes: 100, ram_available_bytes: 30, swap_used_bytes: 0, gpu_percent: null, gpu_temperature_c: null, gpu_power_w: null, disk_total_bytes: 200, disk_available_bytes: 20 })
const snapshot = () => ({ version: 1, hosts: [host('mac'), host('dgx')] })

test('hardware numeric snapshot accepts zero, partial data and unavailable host', () => {
  const v = snapshot()
  assert.equal(isPublicHardware(v), true)
  for (const key of Object.keys(v.hosts[1])) if (key !== 'id') v.hosts[1][key] = null
  assert.equal(isPublicHardware(v), true)
})
test('hardware rejects private text, extra keys, malformed timestamps and incoherent metrics', () => {
  for (const mutate of [
    v => { v.hosts[0].processes = ['canary-secret'] },
    v => { v.hosts[0].id = 'private-host' },
    v => { v.hosts[0].cpu_percent = 'private-command' },
    v => { v.hosts[0].cpu_percent = NaN },
    v => { v.hosts[0].gpu_percent = 101 },
    v => { v.hosts[0].ram_available_bytes = 101 },
    v => { v.hosts[0].disk_available_bytes = -1 },
    v => { v.hosts[0].sampled_at = 'private-path' },
    v => { v.hosts[0].sampled_at = '2026-02-30T10:00:00Z' },
    v => { v.hosts[0].sampled_at = null },
    v => { v.hosts[1].id = 'mac' },
    v => { v.hosts.pop() },
    v => { v.secret = 'canary' }
  ]) { const v = snapshot(); mutate(v); assert.equal(isPublicHardware(v), false) }
})
test('the public-safety gate blocks hardware payloads even without a generic sensitive-data match', () => {
  const overview = { gtd: {}, personas: {}, automejora: {}, crons: [], hardware: snapshot() }
  assert.deepEqual(validatePublicDocument('overview.json', overview), [])
  overview.hardware.hosts[0].username = 'innocent-looking'
  assert.ok(validatePublicDocument('overview.json', overview).some(f => f.code === 'PUBLIC_HARDWARE_INVALID'))
})

const manifest = { version: 1, generado: '2026-11-02T08:00:00Z' }
const defer = () => { let resolve; const promise = new Promise(r => { resolve = r }); return { promise, resolve } }
const tick = () => new Promise(resolve => setImmediate(resolve))

test('published hardware reads one stable batch with no-store and the same abort signal', async () => {
  const calls = []
  const controller = new AbortController()
  const responses = [manifest, { hardware: snapshot() }, manifest]
  const result = await loadPublishedHardware('/portal', controller.signal, async (url, options) => {
    calls.push({ url, options })

    return Response.json(responses.shift())
  })

  assert.deepEqual(calls.map(c => c.url), ['/portal/data/manifest.json', '/portal/data/overview.json', '/portal/data/manifest.json'])
  assert.ok(calls.every(c => c.options.cache === 'no-store' && c.options.signal === controller.signal && c.options.method === 'GET'))
  assert.deepEqual(result, { hardware: snapshot(), retained: null })
})

test('a changed publication, unavailable document or private payload cannot become a reading', async () => {
  const invalid = snapshot()
  invalid.hosts[0].processes = ['PRIVATE-CANARY']
  for (const responses of [
    [manifest, { hardware: snapshot() }, { ...manifest, generado: '2026-11-02T08:00:01Z' }],
    [manifest, { hardware: invalid }, manifest],
    [{ version: 1, generado: 'invalid' }]
  ]) {
    await assert.rejects(loadPublishedHardware('', new AbortController().signal, async () => Response.json(responses.shift())))
  }
  await assert.rejects(loadPublishedHardware('', new AbortController().signal, async () => new Response('', { status: 503 })))
})

test('withholding before or during a reading removes every metric', async () => {
  const withheld = { schema: 'madclon.public-containment.v1', generated_at: '2026-11-02T08:00:01Z' }
  for (const responses of [[withheld], [manifest, { hardware: snapshot() }, withheld]]) {
    const result = await loadPublishedHardware('', new AbortController().signal, async () => Response.json(responses.shift()))

    assert.deepEqual(result, { hardware: null, retained: withheld.generated_at })
  }
})

test('entry and explicit clicks load once each, concurrent clicks coalesce and time does not poll', async () => {
  let calls = 0
  let held = defer()
  const states = []
  const reader = createPublishedHardwareReader({ load: async () => { calls++; return held.promise }, onChange: s => states.push(s), now: () => 123 })
  const first = reader.refresh()

  assert.equal(states.at(-1).busy, true)
  assert.equal(reader.refresh(), first)
  await tick()
  assert.equal(calls, 1)
  held.resolve({ hardware: snapshot(), retained: null })
  await first
  assert.equal(states.at(-1).busy, false)
  assert.equal(states.at(-1).checkedAt, 123)
  await new Promise(resolve => setTimeout(resolve, 30))
  assert.equal(calls, 1)
  held = defer()
  const second = reader.refresh()
  await tick()
  assert.equal(calls, 2)
  held.resolve({ hardware: snapshot(), retained: null })
  await second
  reader.dispose()
})

test('failed manual refresh preserves the dated sample and exposes only a generic error flag', async () => {
  let fail = false
  let state
  const reader = createPublishedHardwareReader({ load: async () => {
    if (fail) throw new Error('PRIVATE-CANARY')

    return { hardware: snapshot(), retained: null }
  }, onChange: s => { state = s } })

  await reader.refresh()
  fail = true
  await reader.refresh()
  assert.equal(state.error, true)
  assert.equal(state.busy, false)
  assert.deepEqual(state.hardware, snapshot())
  assert.doesNotMatch(JSON.stringify(state), /PRIVATE-CANARY/)
  reader.dispose()
})

test('one timeout aborts the whole operation including a stalled response body, without retry', async () => {
  let calls = 0
  let signal
  let state
  const reader = createPublishedHardwareReader({
    load: input => {
      signal = input

      return loadPublishedHardware('', input, async () => {
        calls++

        return { ok: true, text: () => new Promise(() => {}) }
      })
    },
    onChange: s => { state = s },
    timeoutMs: 15
  })

  await reader.refresh()
  assert.equal(signal.aborted, true)
  assert.equal(state.busy, false)
  assert.equal(state.error, true)
  await new Promise(resolve => setTimeout(resolve, 25))
  assert.equal(calls, 1)
  reader.dispose()
})

test('leaving the page aborts pending work and prevents all later updates and reads', async () => {
  let signal
  const states = []
  const reader = createPublishedHardwareReader({ load: input => { signal = input; return new Promise(() => {}) }, onChange: s => states.push(s) })
  const work = reader.refresh()

  await tick()
  reader.dispose()
  await work
  assert.equal(signal.aborted, true)
  assert.equal(states.length, 1)
  await reader.refresh()
  assert.equal(states.length, 1)
})

test('hardware UI has a top manual action, and no interval, visibility or focus refresh', () => {
  const page = readFileSync(new URL('../src/app/(dashboard)/hardware/page.tsx', import.meta.url), 'utf8')
  const overview = readFileSync(new URL('../src/components/dashboard/HardwareOverview.tsx', import.meta.url), 'utf8')
  const hook = readFileSync(new URL('../src/lib/usePublishedHardware.ts', import.meta.url), 'utf8')

  assert.match(page, /onClick=\{refresh\} disabled=\{busy\}/)
  assert.ok(page.indexOf('Actualizar muestra publicada') < page.indexOf('HARDWARE_INVENTORY.map'))
  assert.match(page, /Disco no disponible/)
  assert.match(page, /incluye reservas del sistema/)
  for (const source of [page, overview, hook]) assert.doesNotMatch(source, /setInterval|visibilitychange|addEventListener\(['"]focus|window\.onfocus/)
  assert.match(hook, /void current\.refresh\(\)/)
  assert.match(hook, /current\.dispose\(\)/)
})
