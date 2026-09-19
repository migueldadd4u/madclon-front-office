import test from 'node:test'
import assert from 'node:assert/strict'
import { isPublicHardware } from '../src/lib/hardware-public.mjs'
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
