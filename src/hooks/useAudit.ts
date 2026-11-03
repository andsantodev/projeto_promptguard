import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { AuditRequestError, runAudit } from '../lib/api'
import { calculateRiskScore } from '../lib/scoring'
import type { ScoredAttack } from '../lib/scoring'
import type { Attack, AuditErrorKind, AuditResult } from '../lib/types'

export type AuditCardState =
  | { status: 'pending' }
  | { status: 'done'; result: AuditResult }
  | { status: 'error'; kind: AuditErrorKind }

type UseAuditOptions = {
  systemPrompt: string
  attacks: Attack[]
}

type AuditProgress = {
  cards: Record<string, AuditCardState>
  isComplete: boolean
  score: number | null
  retry: (attackId: string) => void
}

function initialCards(attacks: Attack[]): Record<string, AuditCardState> {
  return Object.fromEntries(attacks.map((attack) => [attack.id, { status: 'pending' }]))
}

export function useAudit({ systemPrompt, attacks }: UseAuditOptions): AuditProgress {
  const [cards, setCards] = useState<Record<string, AuditCardState>>(() =>
    initialCards(attacks),
  )
  // One controller for the whole audit, including retries, so unmount aborts everything.
  const controllerRef = useRef<AbortController | null>(null)

  const requestAttack = useCallback(
    (attack: Attack) => {
      const controller = controllerRef.current

      if (!controller || controller.signal.aborted) {
        return
      }

      runAudit({ systemPrompt, attackId: attack.id }, controller.signal)
        .then((result) => {
          if (!controller.signal.aborted) {
            setCards((current) => ({ ...current, [attack.id]: { status: 'done', result } }))
          }
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) {
            return
          }

          const kind = error instanceof AuditRequestError ? error.kind : 'unexpected'
          setCards((current) => ({ ...current, [attack.id]: { status: 'error', kind } }))
        })
    },
    [systemPrompt],
  )

  useEffect(() => {
    const controller = new AbortController()
    controllerRef.current = controller

    // One request per attack: each card fills as soon as its own answer arrives.
    for (const attack of attacks) {
      requestAttack(attack)
    }

    return () => {
      controller.abort()
      controllerRef.current = null
    }
  }, [attacks, requestAttack])

  const retry = useCallback(
    (attackId: string) => {
      const attack = attacks.find((item) => item.id === attackId)

      if (!attack) {
        return
      }

      setCards((current) => ({ ...current, [attackId]: { status: 'pending' } }))
      requestAttack(attack)
    },
    [attacks, requestAttack],
  )

  const isComplete = attacks.every((attack) => cards[attack.id]?.status !== 'pending')

  const score = useMemo(() => {
    if (!isComplete) {
      return null
    }

    const evaluated: ScoredAttack[] = attacks.map((attack) => {
      const card = cards[attack.id]

      return card?.status === 'done'
        ? { verdict: card.result.verdict, severity: card.result.severity }
        : { verdict: 'not_evaluated', severity: attack.severity }
    })

    const wasEvaluated = evaluated.some((attack) => attack.verdict !== 'not_evaluated')
    return wasEvaluated ? calculateRiskScore(evaluated) : null
  }, [attacks, cards, isComplete])

  return { cards, isComplete, score, retry }
}
