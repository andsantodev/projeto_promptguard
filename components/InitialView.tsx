"use client";

import { ArrowRight, ShieldCheck } from "@phosphor-icons/react";

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
    <main className="relative mx-auto grid min-h-[100dvh] w-full max-w-[1400px] grid-cols-1 items-center gap-16 overflow-hidden px-page py-section lg:grid-cols-[1.15fr_1fr] lg:px-page-lg lg:py-section-lg">
      {/* Decorative background geometry */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -left-32 -top-32 size-96 rounded-full border border-line/50" />
        <div className="absolute -bottom-48 -right-48 size-[40rem] rounded-full border border-line/30" />
        <div className="absolute left-1/2 top-1/3 h-px w-1/2 -translate-x-1/2 rotate-45 bg-gradient-to-r from-transparent via-line to-transparent" />
      </div>

      <section className="relative z-10">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-label text-ink-500">
          <ShieldCheck size={18} weight="regular" aria-hidden="true" />
          Seguranca de IA sob auditoria
        </p>

        <h1 className="mt-8 max-w-[14ch] text-5xl font-semibold leading-none tracking-tight text-ink-900 sm:text-6xl lg:text-7xl">
          Simule ataques de seguranca no seu{" "}
          <span className="text-accent-400">system prompt</span>
        </h1>

        <p className="mt-6 max-w-[65ch] text-base leading-relaxed text-ink-500">
          PromptGuard simula ataques reais de prompt injection e jailbreak
          contra o seu system prompt, expondo falhas de protecao antes de ir
          para producao.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onStartAudit}
            disabled={!attacksReady && !loadError}
            className="inline-flex h-12 items-center gap-2 rounded-md bg-accent-400 px-6 text-sm font-semibold text-base-950 transition-[background-color,transform] hover:bg-accent-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-base-700 disabled:text-ink-500"
          >
            {loadError
              ? "Catalogo indisponivel"
              : attacksReady
                ? "Iniciar auditoria"
                : "Carregando biblioteca"}
            <ArrowRight size={16} weight="bold" aria-hidden="true" />
          </button>
          <span className="text-xs text-ink-500">
            Escolha de 1 a 6 ataques • Gratuito • Sem login
          </span>
        </div>

        {loadError && (
          <p className="mt-3 text-xs text-danger-400" role="status">
            No foi possivel carregar a biblioteca de ataques. Tente novamente.
          </p>
        )}
      </section>

      {/* Supabase-style code preview panel */}
      <aside
        aria-label="Exemplo de uso"
        className="relative z-10 rounded-xl border border-line bg-base-900/60 p-6 shadow-panel backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 border-b border-line pb-4">
          <span className="inline-flex size-2.5 rounded-full bg-danger-400" />
          <span className="inline-flex size-2.5 rounded-full bg-accent-400" />
          <span className="inline-flex size-2.5 rounded-full bg-success-500" />
          <span className="ml-2 font-mono text-xs text-ink-500">
            promptguard-audit.ts
          </span>
        </div>
        <pre className="mt-4 overflow-x-auto font-mono text-xs leading-relaxed text-ink-500">
          <span className="text-ink-400">{"// System prompt da sua aplicacao"}</span>
          {"\n"}
          <span className="text-success-500">const</span>{" "}
          <span className="text-ink-600">systemPrompt</span> = `
          <span className="text-ink-600">
            Voce e um assistente de suporte ao cliente...
          </span>
          `;
          {"\n\n"}
          <span className="text-ink-400">
            {"// PromptGuard testa contra 10 ataques curados"}
          </span>
          {"\n"}
          <span className="text-success-500">const</span>{" "}
          <span className="text-ink-600">result</span> ={" "}
          <span className="text-accent-400">await</span>{" "}
          <span className="text-ink-600">audit</span>(systemPrompt);
          {"\n\n"}
          <span className="text-ink-400">
            {"// Resultado: score + vereditos + mitigacoes"}
          </span>
          {"\n"}
          <span className="text-ink-600">console</span>.
          <span className="text-accent-400">log</span>(result.score);{" "}
          <span className="text-ink-400">
            {'// "0%" — seguro ou "100%" — vulneravel'}
          </span>
        </pre>
      </aside>
    </main>
  );
}