import AuditCard from '../results/AuditCard'
import RiskGauge from '../results/RiskGauge'
import { useAudit } from '../../hooks/useAudit'
import type { Attack, AuditResult } from '../../lib/types'

const SECONDARY_BUTTON =
  'rounded-md border border-line px-stack py-stack-sm text-sm text-ink-700 transition-colors hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-300 active:scale-[0.98] motion-reduce:transition-none'

type ResultsScreenProps = {
  systemPrompt: string
  attacks: Attack[]
  onRestart: () => void
}

function ResultsScreen({ systemPrompt, attacks, onRestart }: ResultsScreenProps) {
  const { cards, isComplete, score, retry } = useAudit({ systemPrompt, attacks })

  // The models are read from the first answer: every audit response carries them.
  const firstResult = attacks
    .map((attack) => cards[attack.id])
    .find((card): card is { status: 'done'; result: AuditResult } => card?.status === 'done')

  const targetModel = firstResult?.result.targetModel ?? 'aguardando'
  const evaluatorModel = firstResult?.result.evaluatorModel ?? 'aguardando'

  const evaluatedCount = attacks.filter(
    (attack) => cards[attack.id]?.status === 'done',
  ).length
  const statusText = !isComplete
    ? `Avaliando ${evaluatedCount} de ${attacks.length} ataques`
    : score === null
      ? 'Nenhum ataque pôde ser avaliado'
      : `Auditoria concluída. Score ${score} de 100`

  return (
    <section className="flex flex-col gap-section-lg">
      <div className="flex flex-wrap items-end justify-between gap-stack">
        <div className="flex flex-col gap-stack-sm">
          <h2 className="text-3xl font-semibold tracking-tight text-ink-900">
            Resultado da auditoria
          </h2>
          <dl className="flex flex-wrap gap-section">
            <div className="flex items-baseline gap-stack-sm">
              <dt className="font-mono text-2xs tracking-tag text-ink-400 uppercase">
                Modelo alvo
              </dt>
              <dd className="font-mono text-xs text-ink-600">{targetModel}</dd>
            </div>
            <div className="flex items-baseline gap-stack-sm">
              <dt className="font-mono text-2xs tracking-tag text-ink-400 uppercase">
                Modelo avaliador
              </dt>
              <dd className="font-mono text-xs text-ink-600">{evaluatorModel}</dd>
            </div>
          </dl>
          <p
            role="status"
            aria-live="polite"
            className="font-mono text-2xs tracking-tag text-ink-400 uppercase"
          >
            {statusText}
          </p>
        </div>
        <button type="button" onClick={onRestart} className={SECONDARY_BUTTON}>
          Nova auditoria
        </button>
      </div>

      <div className="grid gap-section-lg lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-panel">
          <RiskGauge score={score} isComplete={isComplete} />

          <div className="min-w-0">
            <p className="font-mono text-2xs tracking-tag text-ink-400 uppercase">
              System prompt auditado
            </p>
            <pre className="mt-stack-sm max-h-[22rem] overflow-auto rounded-md border border-line bg-base-950 p-card font-mono text-sm whitespace-pre-wrap text-ink-600">
              {systemPrompt}
            </pre>
          </div>
        </div>

        <ul className="flex flex-col gap-stack">
          {attacks.map((attack) => (
            <li key={attack.id}>
              <AuditCard
                attack={attack}
                state={cards[attack.id] ?? { status: 'pending' }}
                onRetry={() => retry(attack.id)}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default ResultsScreen
