"use client";

import { CircleNotch, ShieldCheck } from "@phosphor-icons/react";
import { calculateRiskScore } from "@/lib/scoreCalculation";
import type { AuditResult, AttackSeverity } from "@/lib/types";
import { RecommendationsSummary } from "@/components/RecommendationsSummary";

const severityConfig: Record<
  AttackSeverity,
  { bg: string; text: string; label: string }
> = {
  critical: {
    bg: "bg-danger-400/15",
    text: "text-danger-400",
    label: "Critico",
  },
  high: { bg: "bg-danger-400/8", text: "text-danger-300", label: "Alto" },
  medium: {
    bg: "bg-accent-400/10",
    text: "text-accent-400",
    label: "Medio",
  },
  low: {
    bg: "bg-success-500/10",
    text: "text-success-500",
    label: "Baixo",
  },
};

function RiskGauge({ value, running }: { value: number; running: boolean }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, value));
  const dashOffset = circumference * (1 - progress / 100);

  let strokeColor = "var(--color-success-500)";
  if (progress > 50) strokeColor = "var(--color-accent-400)";
  if (progress > 80) strokeColor = "var(--color-danger-400)";

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative size-40"
        role="img"
        aria-label={`Risco ${progress}%`}
      >
        <svg viewBox="0 0 120 120" className="size-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="var(--color-base-700)"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-2xl font-semibold text-ink-900">
            {progress}%
          </span>
        </div>
      </div>
      <p className="text-xs uppercase tracking-tag text-ink-500">
        {running ? "Avaliando..." : "Risco estimado"}
      </p>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: AttackSeverity }) {
  const cfg = severityConfig[severity];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      {cfg.label}
    </span>
  );
}

function LoadingCard() {
  return (
    <li className="rounded-lg border border-line bg-base-900 p-card">
      <div className="flex items-start justify-between gap-4">
        <div className="h-4 w-40 animate-pulse rounded bg-base-700" />
        <div className="h-4 w-12 animate-pulse rounded-full bg-base-700" />
      </div>
      <div className="mt-3 h-3 w-full animate-pulse rounded bg-base-700" />
      <div className="mt-1.5 h-3 w-2/3 animate-pulse rounded bg-base-700" />
      <div className="mt-4 flex items-center gap-2">
        <CircleNotch
          size={14}
          className="animate-spin text-accent-400 motion-reduce:animate-none"
          aria-hidden="true"
        />
        <span className="text-xs font-medium text-ink-500">
          Avaliando este ataque...
        </span>
      </div>
    </li>
  );
}

function AttackCard({
  result,
  onRetry,
}: {
  result: AuditResult;
  onRetry: (attackId: number) => void;
}) {
  const isSuccess = result.verdict === "success";
  const isNotEvaluated = result.verdict === "not_evaluated";

  if (isNotEvaluated) {
    return (
      <li className="rounded-lg border border-line bg-base-900 p-card">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-sm font-medium text-ink-900">{result.title}</h3>
          <span className="inline-flex items-center rounded-full bg-base-800 px-2.5 py-1 text-xs font-medium text-ink-500">
            Nao avaliado
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink-500">
          {result.description}
        </p>
        <div className="mt-3 flex items-start gap-2">
          <span className="mt-px shrink-0 text-xs font-medium text-ink-500">
            Veredito:
          </span>
          <span className="text-xs font-medium text-ink-500">
            A avaliacao falhou ou expirou. Este ataque nao conta para o score.
          </span>
        </div>
        <button
          type="button"
          onClick={() => onRetry(result.attackId)}
          className="mt-4 inline-flex h-9 items-center rounded-md border border-line px-3 text-xs font-medium text-ink-600 transition-colors hover:bg-base-800 active:scale-[0.98]"
        >
          Tentar novamente
        </button>
      </li>
    );
  }

  return (
    <li className="rounded-lg border border-line bg-base-900 p-card">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-sm font-medium text-ink-900">{result.title}</h3>
        {result.severity ? <SeverityBadge severity={result.severity} /> : null}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ink-500">
        {result.description}
      </p>
      <div className="mt-3 flex items-start gap-2">
        <span className="mt-px shrink-0 text-xs font-medium text-ink-500">
          Veredito:
        </span>
        <span
          className={`text-xs font-medium ${
            isSuccess ? "text-danger-400" : "text-success-500"
          }`}
        >
          {isSuccess
            ? "Ataque bem-sucedido — o system prompt foi comprometido"
            : "Ataque falhou — o system prompt permaneceu intacto"}
        </span>
      </div>
      {isSuccess && result.mitigation.trim() !== "" && (
        <div className="mt-3 flex items-start gap-2 rounded-md bg-base-800/50 px-3 py-2">
          <span className="mt-px shrink-0 text-xs font-medium text-ink-500">
            Mitigacao:
          </span>
          <p className="text-xs leading-relaxed text-ink-600">
            {result.mitigation}
          </p>
        </div>
      )}
    </li>
  );
}

export function ResultsView({
  systemPrompt,
  results,
  expectedAttackIds,
  running,
  blockedReason,
  runtimeError,
  onNewAudit,
  onRetryAttack,
}: {
  systemPrompt: string;
  results: AuditResult[];
  expectedAttackIds: number[];
  running: boolean;
  blockedReason?: string | null;
  runtimeError?: string | null;
  onNewAudit: () => void;
  onRetryAttack: (attackId: number) => void;
}) {
  const score = calculateRiskScore(results);
  const resultByAttackId = new Map(results.map((r) => [r.attackId, r]));
  const cards = expectedAttackIds.map((id) => {
    const r = resultByAttackId.get(id);
    if (r) return { kind: "result" as const, id, result: r };
    if (running) return { kind: "loading" as const, id };
    return { kind: "not_evaluated" as const, id, result: null };
  });

  const allDone = !running && cards.every((c) => c.kind !== "loading");

  return (
    <main className="mx-auto w-full max-w-[1400px] px-page py-section lg:px-page-lg lg:py-section-lg">
      <div className="flex items-center justify-between gap-4">
        <p className="flex items-center gap-2 text-sm font-medium text-ink-900">
          <ShieldCheck size={18} aria-hidden="true" />
          Resultado da auditoria
        </p>
        <button
          type="button"
          onClick={onNewAudit}
          className="inline-flex h-10 items-center rounded-md border border-line px-4 text-sm font-medium text-ink-600 transition-colors hover:bg-base-850 active:scale-[0.98]"
        >
          Nova auditoria
        </button>
      </div>

      {blockedReason && (
        <div
          role="status"
          className="mt-6 rounded-md border border-danger-400/30 bg-danger-400/10 px-3 py-2.5 text-xs font-medium text-danger-400"
        >
          A auditoria nao pode ser executada (motivo: {blockedReason}). Verifique o
          system prompt e tente novamente.
        </div>
      )}
      {runtimeError && (
        <div
          role="status"
          className="mt-6 rounded-md border border-danger-400/30 bg-danger-400/10 px-3 py-2.5 text-xs font-medium text-danger-400"
        >
          {runtimeError}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <aside className="flex flex-col gap-8 lg:col-span-5">
          <section
            aria-label="System prompt em leitura"
            className="rounded-lg border border-line bg-base-850 p-panel"
          >
            <h2 className="text-sm font-medium text-ink-900">System prompt</h2>
            <p className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-line bg-base-900 px-4 py-5 font-mono text-xs leading-relaxed text-ink-500">
              {systemPrompt.trim() !== ""
                ? systemPrompt
                : "O system prompt avaliado aparece aqui em modo somente leitura depois que a auditoria roda."}
            </p>
          </section>

          <section
            aria-label="Pontuacao de risco"
            className="rounded-lg border border-line bg-base-850 p-panel"
          >
            <RiskGauge value={score} running={running} />
          </section>
        </aside>

        <div className="flex flex-col gap-6 lg:col-span-7">
          <section aria-label="Cartoes de ataque" className="flex flex-col gap-stack">
            <h2 className="text-sm font-medium text-ink-900">
              {running ? "Auditoria em andamento" : "Veredito por ataque"}
            </h2>
            <ul className="flex flex-col gap-stack">
              {cards.map((c) =>
                c.kind === "loading" ? (
                  <LoadingCard key={c.id} />
                ) : c.kind === "result" ? (
                  <AttackCard key={c.id} result={c.result} onRetry={onRetryAttack} />
                ) : (
                  <li
                    key={c.id}
                    className="rounded-lg border border-line bg-base-900 p-card"
                  >
                    <h3 className="text-sm font-medium text-ink-900">
                      Ataque #{c.id}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-ink-500">
                      Este ataque terminou sem um resultado avaliado.
                    </p>
                  </li>
                )
              )}
            </ul>
          </section>

          {allDone && results.some((r) => r.verdict === "success") && (
            <RecommendationsSummary results={results} />
          )}
        </div>
      </div>
    </main>
  );
}