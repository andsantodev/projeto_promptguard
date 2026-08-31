import type { AuditResult, Attack } from "@/lib/types";

export interface StartAuditResponse {
  auditId: string;
}

export interface AuditProgressRow {
  attackId: number;
  verdict: "success" | "failure" | "not_evaluated";
  severity?: string;
  mitigation?: string;
}

export interface AuditProgress {
  auditId: string;
  blocked: boolean;
  reason?: string | null;
  verdicts: AuditProgressRow[];
}

export const POLL_INTERVAL_MS = 2000;
export const MAX_POLL_ATTEMPTS = 120;

export async function startAudit(
  systemPrompt: string,
  attacks: Attack[]
): Promise<string> {
  const res = await fetch("/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemPrompt,
      attacks: attacks.map((a) => ({ id: a.id, title: a.title, payload: a.payload })),
    }),
  });

  if (!res.ok) {
    let detail = `Erro ao iniciar a auditoria (HTTP ${res.status}).`;
    try {
      const json = (await res.json()) as { error?: string };
      if (json.error) detail = json.error;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }

  const data = (await res.json()) as StartAuditResponse;
  return data.auditId;
}

export async function fetchProgress(auditId: string): Promise<AuditProgress> {
  const res = await fetch(`/api/audit/status?auditId=${encodeURIComponent(auditId)}`);
  if (!res.ok) {
    throw new Error(`Erro ao consultar o progresso (HTTP ${res.status}).`);
  }
  return (await res.json()) as AuditProgress;
}

function hydrateVerdicts(
  progress: AuditProgress,
  attacksById: Map<number, Attack>
): { results: AuditResult[]; done: boolean } {
  const results: AuditResult[] = progress.verdicts.flatMap((v) => {
    const atk = attacksById.get(v.attackId);
    if (!atk) return [];
    return [
      {
        attackId: v.attackId,
        title: atk.title,
        description: atk.description,
        verdict: v.verdict,
        severity: (v.severity as AuditResult["severity"]) ?? undefined,
        mitigation: v.mitigation ?? "",
      },
    ];
  });

  const known = results.length;
  const done = progress.blocked || known >= attacksById.size;

  return { results, done };
}

export async function pollAudit(
  auditId: string,
  selectedAttacks: Attack[],
  {
    onProgress,
    intervalMs = POLL_INTERVAL_MS,
    maxAttempts = MAX_POLL_ATTEMPTS,
  }: {
    onProgress: (results: AuditResult[], done: boolean, blocked?: string | null) => void;
    intervalMs?: number;
    maxAttempts?: number;
  }
): Promise<void> {
  const attacksById = new Map(selectedAttacks.map((a) => [a.id, a]));
  const seen = new Set<number>();
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts += 1;
    let progress: AuditProgress;
    try {
      progress = await fetchProgress(auditId);
    } catch {
      await delay(intervalMs);
      continue;
    }

    const { results, done } = hydrateVerdicts(progress, attacksById);
    results.forEach((r) => seen.add(r.attackId));
    onProgress(results, done, progress.reason ?? null);

    if (done) return;
    await delay(intervalMs);
  }

  try {
    const { results: finalResults } = hydrateVerdicts(
      await fetchProgress(auditId),
      attacksById
    );
    onProgress(finalResults, true, null);
  } catch {
    onProgress([], true, null);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}