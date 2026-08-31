"use client";

import { useEffect, useRef, useState } from "react";
import { CircleNotch, X } from "@phosphor-icons/react";
import type { Attack } from "@/lib/types";
import { AttackSelection } from "@/components/AttackSelection";
import { SystemPromptInput } from "@/components/SystemPromptInput";

export function AuditModal({
  open,
  processing,
  attacks,
  rateLimitError,
  onClose,
  onConfirm,
}: {
  open: boolean;
  processing: boolean;
  attacks: Attack[];
  rateLimitError?: string | null;
  onClose: () => void;
  onConfirm: (systemPrompt: string, selectedIds: number[]) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !processing) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    dialogRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open, processing, onClose]);

  if (!open) return null;

  const canConfirm = systemPrompt.trim() !== "" && selectedIds.length > 0;

  const toggleAttack = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const confirm = () => {
    if (canConfirm) {
      onConfirm(systemPrompt, selectedIds);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-overlay p-4 sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !processing) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-modal-title"
        tabIndex={-1}
        className="relative w-full max-w-5xl rounded-lg border border-line bg-base-900 shadow-panel outline-none"
      >
        <header className="flex items-center justify-between gap-4 border-b border-line px-panel py-4">
          <div>
            <h2
              id="audit-modal-title"
              className="text-base font-medium text-ink-900"
            >
              Configurar auditoria
            </h2>
            <p className="mt-0.5 text-xs text-ink-500">
              Cole o system prompt e selecione de 1 a 6 ataques.
            </p>
          </div>
          {!processing && (
            <button
              type="button"
              aria-label="Fechar"
              onClick={onClose}
              className="inline-flex size-9 items-center justify-center rounded-md border border-line text-ink-600 transition-colors hover:bg-base-800 active:scale-[0.98]"
            >
              <X size={16} weight="bold" aria-hidden="true" />
            </button>
          )}
        </header>

        {processing ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4 px-panel py-10 text-center">
            <CircleNotch
              size={28}
              weight="regular"
              className="animate-spin text-accent-400 motion-reduce:animate-none"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-medium text-ink-900">
                Rodando auditoria de seguranca
              </p>
              <p className="mt-1 text-xs text-ink-500">
                Avaliando o system prompt contra a biblioteca de ataques.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 p-panel lg:grid-cols-[0.9fr_1.1fr]">
            <SystemPromptInput value={systemPrompt} onChange={setSystemPrompt} />
            <AttackSelection
              attacks={attacks}
              selectedIds={selectedIds}
              onToggle={toggleAttack}
            />
          </div>
        )}

        {rateLimitError && (
          <div
            role="status"
            className="mx-panel mt-4 rounded-md border border-danger-400/30 bg-danger-400/10 px-3 py-2.5 text-xs font-medium text-danger-400"
          >
            {rateLimitError}
          </div>
        )}

        {!processing && (
          <footer className="flex items-center justify-end gap-3 border-t border-line px-panel py-4">
            <button
              type="button"
              onClick={confirm}
              disabled={!canConfirm}
              className="inline-flex h-10 items-center rounded-md bg-accent-400 px-4 text-sm font-semibold text-base-950 transition-colors hover:bg-accent-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-base-700 disabled:text-ink-500"
            >
              Rodar auditoria
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}