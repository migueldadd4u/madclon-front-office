'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { createPublishedHardwareReader, loadPublishedHardware } from './published-hardware.mjs'
import type { PublishedHardwareState } from './published-hardware.mjs'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export function usePublishedHardware() {
  const [state, setState] = useState<PublishedHardwareState>({ hardware: null, retained: null, busy: true, error: false, checkedAt: null })
  const reader = useRef<ReturnType<typeof createPublishedHardwareReader> | null>(null)

  useEffect(() => {
    const current = createPublishedHardwareReader({
      load: signal => loadPublishedHardware(BASE, signal),
      onChange: setState
    })

    reader.current = current
    void current.refresh()

    return () => {
      reader.current = null
      current.dispose()
    }
  }, [])

  const refresh = useCallback(() => { void reader.current?.refresh() }, [])

  return { ...state, refresh }
}
