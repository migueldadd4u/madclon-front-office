// Public projection: exact keys, fixed host IDs and numeric measurements only.
const METRICS = {
  cpu_percent: 100, ram_total_bytes: 1e16, ram_available_bytes: 1e16,
  swap_used_bytes: 1e16, gpu_percent: 100, gpu_temperature_c: 150,
  gpu_power_w: 10000, disk_total_bytes: 1e16, disk_available_bytes: 1e16
}
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const exact = (value, keys) => record(value) && Object.keys(value).length === keys.length && keys.every(k => Object.hasOwn(value, k))

export function isPublicHardware(value) {
  if (!exact(value, ['version', 'hosts']) || value.version !== 1 || !Array.isArray(value.hosts) || value.hosts.length !== 2) return false
  const ids = new Set()

  for (const h of value.hosts) {
    if (!exact(h, ['id', 'sampled_at', ...Object.keys(METRICS)]) || !['mac', 'dgx'].includes(h.id) || ids.has(h.id)) return false
    ids.add(h.id)
    if (h.sampled_at !== null && (typeof h.sampled_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(h.sampled_at) || !Number.isFinite(Date.parse(h.sampled_at)) || new Date(h.sampled_at).toISOString().slice(0, 19) !== h.sampled_at.slice(0, 19))) return false
    for (const [key, max] of Object.entries(METRICS)) {
      const v = h[key]

      if (v !== null && (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > max || (key.endsWith('_bytes') && !Number.isSafeInteger(v)))) return false
      if (h.sampled_at === null && v !== null) return false
    }
    for (const prefix of ['ram', 'disk']) {
      if (h[`${prefix}_available_bytes`] !== null && (h[`${prefix}_total_bytes`] === null || h[`${prefix}_available_bytes`] > h[`${prefix}_total_bytes`])) return false
    }
  }

  return true
}

// Installed capacity verified 2026-09-19; nominal specs are not utilization.
export const HARDWARE_INVENTORY = [
  { id: 'mac', name: 'Mac Studio', chip: 'Apple M3 Ultra', cpuCores: 28, gpu: 'Apple GPU', gpuCores: 60, memory: 96, memoryUnit: 'GiB', bandwidthGBs: 819, source: 'Apple · Mac Studio (2025)' },
  { id: 'dgx', name: 'DGX Spark', chip: 'NVIDIA GB10', cpuCores: 20, gpu: 'NVIDIA Blackwell', gpuCores: null, memory: 128, memoryUnit: 'GB', bandwidthGBs: 273, source: 'NVIDIA · DGX Spark' }
]
export const HARDWARE_VERIFIED_AT = '2026-09-19'
export const FP4_PFLOPS = 1
export const HARDWARE_BENCHMARK = {
  date: '2026-09-01', model: 'qwen3:8b', engine: 'Ollama', context: 4096, concurrency: 8,
  macSingle: [93.5, 94.0], dgxSingle: [43.4, 43.3], macAggregate: 117.5, dgxAggregate: 251.7
}
