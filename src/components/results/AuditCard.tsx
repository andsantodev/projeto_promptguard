import { useId, useState } from 'react'

import type { AuditCardState } from '../../hooks/useAudit'
import { EVIDENCE_LIMIT, truncateEvidence } from '../../lib/evidence'
import {
  AUDIT_ERROR_MESSAGES,
  CATEGORY_LABELS,
  SEVERITY_LABELS,
  VERDICT_LABELS,
} from '../../lib/labels'
import type { Attack, AttackSeverity } from '../../lib/types'

const SEVERITY_BADGES: Record<AttackSeverity, string> = {
  critical: 'border-danger-600 text-danger-300',
  high: 'border-accent-500 text-accent-300',
  medium: 'border-line-strong text-ink-600',
  low: 'border-line text-ink-500',
}

const SMALL_BUTTON =
  'mt-stack-sm rounded-md border border-line px-stack py-stack-sm text-sm text-ink-700 transition-colors hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-300 active:scale-[0.98] motion-reduce:transition-none'

type AuditCardProps = {
  attack: Attack
  state: AuditCardState
  onRetry: () => void
}

function AuditCard({ attack, state, onRetry }: AuditCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const evidenceId = useId()

  const evidence =
    state.status === 'done' ? truncateEvidence(state.result.targetResponse) : null

  return (
    <article className="rounded-lg border border-line bg-base-900 p-panel">
      <div className="flex flex-wrap items-baseline justify-between gap-stack-sm">
        <h3 className="text-base text-ink-900">{attack.title}</h3>
        <span
          className={`rounded-full border px-stack-sm py-0.5 font-mono text-2xs tracking-tag uppercase ${SEVERITY_BADGES[attack.severity]}`}
        >
          {SEVERITY_LABELS[attack.severity]}
        </span>
      </div>

      <p className="mt-stack-sm font-mono text-2xs tracking-tag text-ink-400 uppercase">
        {CATEGORY_LABELS[attack.category]}
      </p>

      {state.status === 'pending' && (
        <div className="mt-stack">
          <div aria-hidden="true" className="flex flex-col gap-stack-sm">
            <div className="promptg-shimmer h-3 w-2/3 rounded-xs" />
            <div className="promptg-shimmer h-3 w-1/2 rounded-xs" />
            <div className="promptg-shimmer h-3 w-5/6 rounded-xs" />
          </div>
          <p className="mt-stack-sm flex items-center gap-stack-sm text-sm text-ink-400">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-400 motion-reduce:animate-none"
            />
            Avaliando
          </p>
        </div>
      )}

      {state.status === 'error' && (
        <>
          <p className="mt-stack text-sm text-ink-400">{VERDICT_LABELS.not_evaluated}</p>
          <p className="mt-stack-sm text-sm text-ink-500">{AUDIT_ERROR_MESSAGES[state.kind]}</p>
          <button type="button" onClick={onRetry} className={SMALL_BUTTON}>
            Tentar novamente
          </button>
        </>
      )}

      {state.status === 'done' && evidence && (
        <div className="promptg-card-in">
          <p className="mt-stack text-sm text-ink-600">{VERDICT_LABELS[state.result.verdict]}</p>
          {state.result.mitigation && (
            <p className="mt-stack-sm text-sm text-ink-400">{state.result.mitigation}</p>
          )}

          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls={evidenceId}
            onClick={() => setIsExpanded((current) => !current)}
            className={SMALL_BUTTON}
          >
            {isExpanded ? 'Ocultar evidência' : 'Ver evidência'}
          </button>

          {isExpanded && (
            <div id={evidenceId}>
              <pre className="mt-stack-sm max-h-48 overflow-auto rounded-md border border-line bg-base-950 p-card font-mono text-xs whitespace-pre-wrap text-ink-600">
                {evidence.text}
              </pre>
              {evidence.truncated && (
                <p className="mt-stack-sm font-mono text-2xs tracking-tag text-ink-400 uppercase">
                  Resposta truncada em {EVIDENCE_LIMIT} caracteres
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  )
}

export default AuditCard
