"use client";

import { Check } from "@phosphor-icons/react";
import type { Attack } from "@/lib/types";

export const MAX_ATTACKS = 6;

export function AttackSelection({
  attacks,
  selectedIds,
  onToggle,
}: {
  attacks: Attack[];
  selectedIds: number[];
  onToggle: (id: number) => void;
}) {
  const atMax = selectedIds.length >= MAX_ATTACKS;

  return (
    <div className="flex flex-col gap-stack-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink-600">Ataques selecionados</p>
        <span
          className="font-mono text-xs text-ink-500"
          aria-live="polite"
        >
          {selectedIds.length}/{MAX_ATTACKS}
        </span>
      </div>

      <ul className="flex max-h-[28rem] flex-col divide-y divide-line overflow-y-auto rounded-md border border-line bg-base-900">
        {attacks.map((attack) => {
          const checked = selectedIds.includes(attack.id);
          const disabled = !checked && atMax;
          return (
            <li key={attack.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                aria-label={`${attack.title} - ${attack.description}`}
                disabled={disabled}
                onClick={() => onToggle(attack.id)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left text-xs leading-relaxed transition-colors ${
                  checked
                    ? "bg-base-850 text-ink-900"
                    : "bg-base-900 text-ink-600 hover:bg-base-850/50"
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                <span
                  className={[
                    "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-sm border",
                    checked
                      ? "bg-accent-400 text-base-950 border-accent-400"
                      : "border-line text-transparent",
                  ].join(" ")}
                >
                  <Check size={14} weight="bold" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-ink-900">
                    {attack.title}
                  </span>
                  <span className="mt-0.5 block text-ink-500">
                    {attack.description}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {selectedIds.length === 0 && (
        <p className="text-xs text-danger-400" role="status">
          Selecione ao menos um ataque.
        </p>
      )}
    </div>
  );
}