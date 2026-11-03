import { scoreBand } from '../../lib/scoring'

const RADIUS = 46
const STROKE = 10
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const BAND_STROKES = {
  success: 'text-success-500',
  accent: 'text-accent-400',
  danger: 'text-danger-400',
} as const

type RiskGaugeProps = {
  score: number | null
  isComplete: boolean
}

function RiskGauge({ score, isComplete }: RiskGaugeProps) {
  const band = score === null ? 'success' : scoreBand(score)

  const label = !isComplete
    ? 'Score de risco ainda não disponível'
    : score === null
      ? 'Nenhum ataque pôde ser avaliado'
      : `Score de risco ${score} de 100`

  return (
    <div className="flex flex-col items-center gap-stack-sm">
      <div role="img" aria-label={label} className="relative h-48 w-48">
        <svg viewBox="0 0 110 110" className="h-full w-full -rotate-90">
          <circle
            cx="55"
            cy="55"
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            className={
              isComplete
                ? 'stroke-base-800'
                : 'animate-pulse stroke-base-800 motion-reduce:animate-none'
            }
          />
          {score !== null && (
            <circle
              cx="55"
              cy="55"
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              strokeLinecap="round"
              stroke="currentColor"
              strokeDasharray={`${(score / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              className={`promptg-card-in transition-[stroke-dasharray] motion-reduce:transition-none ${BAND_STROKES[band]}`}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {!isComplete ? (
            <span
              aria-hidden="true"
              className="promptg-shimmer h-6 w-10 rounded-xs"
            />
          ) : (
            <span className="font-mono text-3xl text-ink-900">
              {score === null ? '--' : score}
            </span>
          )}
          <span className="mt-stack-sm font-mono text-2xs tracking-tag text-ink-400 uppercase">
            Risco
          </span>
        </div>
      </div>

      <p className="text-sm text-ink-500">
        {!isComplete ? 'Calculando score' : score === null ? 'Sem score' : `${score}% de risco`}
      </p>
    </div>
  )
}

export default RiskGauge
