"use client";

import type { AuditResult } from "@/lib/types";

export function RecommendationsSummary({
  results,
}: {
  results: AuditResult[];
}) {
  const mitigations = results.filter(
    (r) => r.verdict === "success" && r.mitigation.trim() !== ""
  );

  if (mitigations.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Recomendacoes"
      className="rounded-lg border border-line bg-base-850 p-panel"
    >
      <h2 className="text-sm font-medium text-ink-900">Recomendacoes</h2>
      <p className="mt-1 text-xs text-ink-500">
        Mitigacoes sugeridas para os ataques que comprometeram o system prompt:
      </p>
      <ul className="mt-4 flex flex-col gap-stack-sm">
        {mitigations.map((r) => (
          <li
            key={r.attackId}
            className="rounded-md border border-line bg-base-900 px-3 py-2"
          >
            <span className="text-xs font-medium text-ink-700">
              {r.title}
            </span>
            <p className="mt-1 text-xs leading-relaxed text-ink-500">
              {r.mitigation}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}