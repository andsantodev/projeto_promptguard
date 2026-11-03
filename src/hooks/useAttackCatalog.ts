import { useCallback, useEffect, useState } from 'react'

import { fetchAttacks } from '../lib/api'
import type { Attack } from '../lib/types'

export type CatalogStatus = 'loading' | 'success' | 'error'

type AttackCatalog = {
  status: CatalogStatus
  attacks: Attack[]
  retry: () => void
}

export function useAttackCatalog(): AttackCatalog {
  const [status, setStatus] = useState<CatalogStatus>('loading')
  const [attacks, setAttacks] = useState<Attack[]>([])
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    fetchAttacks(controller.signal)
      .then((loaded) => {
        setAttacks(loaded)
        setStatus('success')
      })
      .catch(() => {
        // An aborted request is the cleanup of a previous run, not a failure.
        if (!controller.signal.aborted) {
          setAttacks([])
          setStatus('error')
        }
      })

    return () => controller.abort()
  }, [attempt])

  // The retry handler, not the effect, puts the UI back into the loading state.
  const retry = useCallback(() => {
    setAttacks([])
    setStatus('loading')
    setAttempt((current) => current + 1)
  }, [])

  return { status, attacks, retry }
}
