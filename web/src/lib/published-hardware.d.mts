import type { PublicHardware } from './hardware-public.mjs'

export type PublishedHardwareState = {
  hardware: PublicHardware | null
  retained: string | null
  busy: boolean
  error: boolean
  checkedAt: number | null
}
export type PublishedHardwareResult = Pick<PublishedHardwareState, 'hardware' | 'retained'>
export function loadPublishedHardware(base: string, signal: AbortSignal, fetcher?: typeof fetch): Promise<PublishedHardwareResult>
export function createPublishedHardwareReader(options: {
  load: (signal: AbortSignal) => Promise<PublishedHardwareResult>
  onChange: (state: PublishedHardwareState) => void
  now?: () => number
  timeoutMs?: number
}): { refresh: () => Promise<void>; dispose: () => void }
