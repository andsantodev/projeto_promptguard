"use client";

import {
  ArrowRight,
  EyeSlash,
  ShieldCheck,
  TextT,
  UserFocus,
} from "@phosphor-icons/react";

const ATTACK_CATEGORIES = [
  {
    icon: TextT,
    label: "Sobrescrita de instrucao",
  },
  {
    icon: UserFocus,
    label: "Role-play e cenario emulado",
  },
  {
    icon: EyeSlash,
    label: "Ofuscacao de texto",
  },
];

export function InitialView({
  onStartAudit,
  attacksReady,
  loadError,
}: {
  onStartAudit: () => void;
  attacksReady: boolean;
  loadError: boolean;
}) {
  return (
    <main className="mx-auto grid min-h-[100dvh] w-full max-w-[1400px] grid-cols-1 items-center gap-12 px-page py-section lg:grid-cols-[1.1fr_0.9fr] lg:px-page-lg lg:py-section-lg">
      <section>
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-label text-ink-500">
          <ShieldCheck size={18} weight="regular" aria-hidden="true" />
          Seguranca de IA sob auditoria
        </p>

        <h1 className="mt-6 max-w-[14ch] text-4xl font-semibold leading-none tracking-tight text-ink-900 sm:text-5xl md:text-6xl">
          Auditoria de seguranca para o seu{" "}
          <span className="text-accent-400">system prompt</span>
        </h1>

        <p className="mt-6 max-w-[65ch] text-base leading-relaxed text-ink-600">
          Simula ataques reais de prompt injection e jailbreak contra o seu
          system prompt, antes de ir para producao.
        </p>

        <div className="mt-10">
          <button
            type="button"
            onClick={onStartAudit}
            disabled={!attacksReady && !loadError}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-accent-400 px-5 text-sm font-semibold text-base-950 transition-[background-color,transform] hover:bg-accent-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-base-700 disabled:text-ink-500"
          >
            {loadError
              ? "Catalogo indisponivel"
              : attacksReady
                ? "Iniciar auditoria"
                : "Carregando biblioteca"}
            <ArrowRight size={16} weight="bold" aria-hidden="true" />
          </button>
          {loadError && (
            <p className="mt-3 text-xs text-danger-400" role="status">
              No foi possivel carregar a biblioteca de ataques. Tente novamente.
            </p>
          )}
        </div>
      </section>

      <aside
        aria-label="Biblioteca de ataques"
        className="rounded-lg border border-line bg-base-850 p-panel shadow-panel"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-medium text-ink-900">
            Biblioteca de ataques
          </h2>
          <span className="font-mono text-xs uppercase tracking-tag text-ink-500">
            Biblioteca curada
          </span>
        </div>

        <ul className="mt-stack divide-y divide-line">
          {ATTACK_CATEGORIES.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 py-3">
              <Icon
                size={18}
                weight="regular"
                className="text-ink-500"
                aria-hidden="true"
              />
              <span className="text-sm text-ink-600">{label}</span>
            </li>
          ))}
        </ul>

        <p className="mt-stack border-t border-line pt-4 text-sm text-ink-500">
          Voce escolhe de 1 a 6 ataques e recebe a pontuacao de risco junto com
          o veredito de cada um.
        </p>
      </aside>
    </main>
  );
}