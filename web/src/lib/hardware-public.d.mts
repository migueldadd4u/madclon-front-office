export type PublicHardwareHost = {
  id: 'mac' | 'dgx'; sampled_at: string | null;
  cpu_percent: number | null; ram_total_bytes: number | null; ram_available_bytes: number | null;
  swap_used_bytes: number | null; gpu_percent: number | null; gpu_temperature_c: number | null;
  gpu_power_w: number | null; disk_total_bytes: number | null; disk_available_bytes: number | null;
}
export type PublicHardware = {version: 1; hosts: PublicHardwareHost[]}
export function isPublicHardware(value: unknown): value is PublicHardware
export const HARDWARE_INVENTORY: {id: 'mac' | 'dgx'; name: string; chip: string; cpuCores: number; gpu: string; gpuCores: number | null; memory: number; memoryUnit: string; bandwidthGBs: number; source: string}[]
export const HARDWARE_VERIFIED_AT: string
export const FP4_PFLOPS: number
export const HARDWARE_BENCHMARK: {date: string; model: string; engine: string; context: number; concurrency: number; macSingle: number[]; dgxSingle: number[]; macAggregate: number; dgxAggregate: number}
