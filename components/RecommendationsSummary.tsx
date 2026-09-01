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
      className="rounded-lg border border-accent-400/20 bg-accent-400/5 px-4 py-3"
    >
      <h2 className="text-sm font-semibold text-accent-400">
        Recomendacoes
      </h2>
      <p className="mt-1 text-xs text-ink-500">
        Mitigacoes sugeridas para os ataques que comprometeram o system prompt:
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {mitigations.map((r) => (
          <li
            key={r.attackId}
            className="border-l-2 border-accent-400/40 pl-3"
          >
            <span className="text-xs font-medium text-ink-700">
              {r.title}
            </span>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-500">
              {r.mitigation}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}