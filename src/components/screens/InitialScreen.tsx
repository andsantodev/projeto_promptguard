import { ArrowRight, ShieldCheck } from '@phosphor-icons/react'

import type { CatalogStatus } from '../../hooks/useAttackCatalog'
import type { Attack } from '../../lib/types'

type InitialScreenProps = {
  status: CatalogStatus
  attacks: Attack[]
  onStart: () => void
  onRetry: () => void
}

const PRIMARY_BUTTON =
  'inline-flex h-12 items-center gap-stack-sm rounded-md bg-accent-400 px-panel text-sm font-semibold text-base-950 transition-[background-color,transform] hover:bg-accent-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-300 active:scale-[0.98] motion-reduce:transition-none disabled:cursor-not-allowed disabled:bg-base-700 disabled:text-ink-500'

const SECONDARY_BUTTON =
  'inline-flex h-12 items-center gap-stack-sm rounded-md border border-line px-panel text-sm text-ink-700 transition-colors hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-300 active:scale-[0.98] motion-reduce:transition-none'

function InitialScreen({ status, attacks, onStart, onRetry }: InitialScreenProps) {
  const isEmpty = status === 'success' && attacks.length === 0
  const isReady = status === 'success' && !isEmpty

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full border border-line/50" />
        <div className="absolute -right-48 -bottom-48 h-[40rem] w-[40rem] rounded-full border border-line/30" />
        <div className="absolute top-1/3 left-1/2 h-px w-1/2 -translate-x-1/2 rotate-45 bg-linear-to-r from-transparent via-line to-transparent" />
      </div>

      <section className="grid grid-cols-1 items-center gap-section-lg lg:grid-cols-[1.15fr_1fr]">
        <div className="relative z-10">
          <p className="flex items-center gap-stack-sm font-mono text-xs tracking-label text-ink-500 uppercase">
            <ShieldCheck size={18} aria-hidden="true" />
            Segurança de IA sob auditoria
          </p>

          <h1 className="mt-section max-w-[14ch] text-5xl leading-none font-semibold tracking-tight text-ink-900 sm:text-6xl lg:text-7xl">
            Simule ataques de segurança no seu{' '}
            <span className="text-accent-400">system prompt</span>
          </h1>

          <p className="mt-stack max-w-[65ch] text-base leading-relaxed text-ink-500">
            PromptGuard simula ataques reais de prompt injection e jailbreak contra o seu system
            prompt, expondo falhas de proteção antes de ir para produção.
          </p>

          <div className="mt-section flex flex-col items-start gap-stack sm:flex-row sm:items-center">
            {status === 'loading' && (
              <>
                <button type="button" disabled aria-busy="true" className={PRIMARY_BUTTON}>
                  Carregando biblioteca
                </button>
                <p className="text-xs text-ink-500">
                  Escolha de 1 a 6 ataques • Gratuito • Sem login
                </p>
              </>
            )}

            {isReady && (
              <>
                <button type="button" onClick={onStart} className={PRIMARY_BUTTON}>
                  Iniciar auditoria
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
                <p className="text-xs text-ink-500">
                  Escolha de 1 a 6 ataques • Gratuito • Sem login
                </p>
              </>
            )}

            {isEmpty && (
              <div role="status" className="w-full max-w-md rounded-md border border-line bg-base-850 p-card">
                <p className="text-sm text-ink-600">A biblioteca de ataques está vazia.</p>
                <p className="mt-stack-sm text-sm text-ink-400">
                  Nenhuma auditoria pode ser iniciada agora.
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-start gap-stack">
                <div
                  role="alert"
                  className="w-full max-w-md rounded-md border border-danger-600/60 bg-danger-600/10 p-card"
                >
                  <p className="text-sm font-medium text-danger-300">Catálogo indisponível</p>
                  <p className="mt-stack-sm text-sm text-ink-400">
                    Não foi possível carregar a biblioteca de ataques.
                  </p>
                </div>
                <button type="button" onClick={onRetry} className={SECONDARY_BUTTON}>
                  Tentar novamente
                </button>
              </div>
            )}
          </div>
        </div>

        <aside
          aria-label="Exemplo de uso"
          className="relative z-10 rounded-lg border border-line bg-base-900/60 p-panel shadow-panel backdrop-blur-sm"
        >
          <div className="flex items-center gap-stack-sm border-b border-line pb-stack">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-danger-400" />
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-accent-400" />
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-success-500" />
            <span className="ml-stack-sm font-mono text-xs text-ink-500">
              promptguard-audit.ts
            </span>
          </div>

          <pre className="mt-stack overflow-x-auto font-mono text-xs leading-relaxed text-ink-500">
            <span className="text-ink-400">{'// System prompt da sua aplicação'}</span>
            {'\n'}
            <span className="text-success-500">const</span>{' '}
            <span className="text-ink-600">systemPrompt</span>
            {' = `'}
            <span className="text-ink-600">Você é um assistente de suporte ao cliente...</span>
            {'`;\n\n'}
            <span className="text-ink-400">{'// PromptGuard testa contra 10 ataques curados'}</span>
            {'\n'}
            <span className="text-success-500">const</span>{' '}
            <span className="text-ink-600">result</span>
            {' = '}
            <span className="text-accent-400">await</span>{' '}
            <span className="text-ink-600">audit</span>
            {'(systemPrompt);\n\n'}
            <span className="text-ink-400">{'// Resultado: score + vereditos + mitigações'}</span>
            {'\n'}
            <span className="text-ink-600">console</span>.
            <span className="text-accent-400">log</span>
            {'(result.score); '}
            <span className="text-ink-400">{'// "0%" seguro ou "100%" vulnerável'}</span>
          </pre>
        </aside>
      </section>
    </>
  )
}

export default InitialScreen
