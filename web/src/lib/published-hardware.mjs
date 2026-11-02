import { isPublicHardware } from './hardware-public.mjs'

const MAX_BYTES = 128 * 1024
const CONTAINMENT = 'madclon.public-containment.v1'

// Read only the published projection. No private API or remote-machine access.
export async function loadPublishedHardware(base, signal, fetcher = globalThis.fetch) {
  async function document(name) {
    const response = await fetcher(`${base}/data/${name}.json`, { method: 'GET', cache: 'no-store', signal })

    if (!response.ok) throw new Error('Published document unavailable')
    const text = await response.text()

    if (new TextEncoder().encode(text).byteLength > MAX_BYTES) throw new Error('Published document too large')

    return JSON.parse(text)
  }

  const before = await document('manifest')

  if (before?.schema === CONTAINMENT && typeof before.generated_at === 'string')
    return { hardware: null, retained: before.generated_at }
  if (typeof before?.generado !== 'string' || !Number.isFinite(Date.parse(before.generado)) || typeof before.version !== 'number')
    throw new Error('Published manifest invalid')
  const overview = await document('overview')
  const after = await document('manifest')

  if (after?.schema === CONTAINMENT && typeof after.generated_at === 'string')
    return { hardware: null, retained: after.generated_at }
  if (after?.generado !== before.generado || after?.version !== before.version)
    throw new Error('Published batch changed during reading')
  if (!isPublicHardware(overview?.hardware)) throw new Error('Published hardware invalid')

  return { hardware: overview.hardware, retained: null }
}

// A single operation per entry or click. The only timer bounds that operation.
export function createPublishedHardwareReader({ load, onChange, now = Date.now, timeoutMs = 10000 }) {
  let disposed = false
  let pending = null
  let controller = null
  let state = { hardware: null, retained: null, busy: true, error: false, checkedAt: null }

  function publish(next) {
    state = { ...state, ...next }
    if (!disposed) onChange(state)
  }

  function refresh() {
    if (disposed) return Promise.resolve()
    if (pending) return pending
    controller = new AbortController()
    const signal = controller.signal
    let timeout

    publish({ busy: true, error: false })
    const aborted = new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(new Error('Reading aborted')), { once: true })
      timeout = setTimeout(() => controller?.abort(), timeoutMs)
    })

    // The promise is installed before load starts, so same-tick clicks coalesce.
    pending = Promise.resolve()
      .then(() => Promise.race([load(signal), aborted]))
      .then(result => publish({ ...result, busy: false, error: false, checkedAt: now() }))
      .catch(() => publish({ busy: false, error: true, checkedAt: now() }))
      .finally(() => {
        clearTimeout(timeout)
        pending = null
      })

    return pending
  }

  return {
    refresh,
    dispose() {
      disposed = true
      controller?.abort()
    }
  }
}
