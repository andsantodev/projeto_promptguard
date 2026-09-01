"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AuditModal } from "@/components/AuditModal";
import { InitialView } from "@/components/InitialView";
import { ResultsView } from "@/components/ResultsView";
import { fetchAttacks } from "@/lib/attacks";
import { checkRateLimit, recordAudit } from "@/lib/rateLimiter";
import { pollAudit, startAudit } from "@/lib/auditClient";
import type { Attack, AuditResult } from "@/lib/types";

export const AUDIT_SIM_DELAY_MS = 900;
export const RETRY_SIM_DELAY_MS = 450;

type ViewState = "input" | "results";

interface AuditInput {
  systemPrompt: string;
  selectedIds: number[];
}

export function PromptGuardApp() {
  const [view, setView] = useState<ViewState>("input");
  const [modalOpen, setModalOpen] = useState(false);
  const [attacks, setAttacks] = useState<Attack[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [audit, setAudit] = useState<AuditInput | null>(null);
  const [results, setResults] = useState<AuditResult[]>([]);
  const [running, setRunning] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [modalKey, setModalKey] = useState(0);
  const pollAbort = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAttacks()
      .then((data) => {
        if (!cancelled) setAttacks(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
      pollAbort.current?.abort();
    };
  }, []);

  const openModal = useCallback(() => {
    setRateLimitError(null);
    setModalKey((k) => k + 1);
    setModalOpen(true);
  }, []);

  const runAudit = useCallback(
    (systemPrompt: string, selectedIds: number[]) => {
      const status = checkRateLimit(window.localStorage, Date.now());
      if (!status.allowed) {
        setRateLimitError(
          status.reason === "day"
            ? "Limite diario de 10 auditorias atingido. Tente novamente amanha."
            : "Limite de 3 auditorias por hora atingido. Tente novamente em alguns minutos."
        );
        return;
      }

      const selectedAttacks = attacks.filter((a) => selectedIds.includes(a.id));

      setAudit({ systemPrompt, selectedIds });
      setResults([]);
      setRunning(true);
      setRuntimeError(null);
      setBlockedReason(null);
      setModalOpen(false);
      setView("results");

      const controller = new AbortController();
      pollAbort.current = controller;

      startAudit(systemPrompt, selectedAttacks)
        .then((auditId) =>
          pollAudit(auditId, selectedAttacks, {
            onProgress: (partialResults, done, blocked) => {
              setResults(partialResults);
              if (blocked) setBlockedReason(blocked);
              if (done) {
                setRunning(false);
                recordAudit(window.localStorage, Date.now());
              }
            },
          })
        )
        .catch((err: Error) => {
          if (controller.signal.aborted) return;
          setRunning(false);
          setRuntimeError(err.message || "Falha ao rodar a auditoria.");
        });
    },
    [attacks]
  );

  const resetAudit = useCallback(() => {
    pollAbort.current?.abort();
    setView("input");
    setModalOpen(false);
    setAudit(null);
    setResults([]);
    setRunning(false);
    setRuntimeError(null);
    setBlockedReason(null);
  }, []);

  const retryAttack = useCallback(
    (attackId: number) => {
      const atk = attacks.find((a) => a.id === attackId);
      if (!atk || !audit) return;
      startAudit(audit.systemPrompt, [atk])
        .then((auditId) =>
          pollAudit(auditId, [atk], {
            onProgress: (partialResults, done) => {
              if (partialResults.length > 0) {
                setResults((prev) => {
                  const kept = prev.filter((r) => r.attackId !== attackId);
                  return [...kept, ...partialResults];
                });
              }
              if (done) setRunning(false);
            },
          })
        )
        .catch((err: Error) => {
          setRuntimeError(err.message || "Falha ao tentar novamente.");
        });
    },
    [attacks, audit]
  );

  const renderResults = () => {
    if (!audit) return null;
    return (
      <ResultsView
        systemPrompt={audit.systemPrompt}
        results={results}
        expectedAttackIds={audit.selectedIds}
        running={running}
        blockedReason={blockedReason}
        runtimeError={runtimeError}
        onNewAudit={resetAudit}
        onRetryAttack={retryAttack}
      />
    );
  };

  return (
    <div className="min-h-[100dvh] w-full bg-base-950 text-ink-600">
      {view === "input" ? (
        <InitialView
          onStartAudit={openModal}
          attacksReady={attacks.length > 0}
          loadError={loadError}
        />
      ) : (
        renderResults()
      )}
      <AuditModal
        key={modalKey}
        open={modalOpen}
        processing={false}
        attacks={attacks}
        rateLimitError={rateLimitError}
        onClose={() => setModalOpen(false)}
        onConfirm={runAudit}
      />
    </div>
  );
}