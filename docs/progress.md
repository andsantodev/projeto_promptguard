# Progress Log

<!-- Nova entrada sempre no topo. Nunca apague entradas antigas. -->

## 2026-10-23 — Bootstrap (harness + ambiente)
- Feito: projeto Vite criado em React + TS; Tailwind v4, Vitest, Testing Library, Phosphor e fontsource instalados; FastAPI com `/api/health`, settings por variável de ambiente e pytest; proxy `/api` no Vite; oxlint endurecido (`--deny-warnings`, `no-console`, `no-explicit-any`); pacote Harness gerado (AGENTS.md, PRD, DESIGN, feature_list, regras, init.sh).
- Verificado (comando + resultado): `npm run lint` sem saída (limpo); `npm run typecheck` limpo; `npm run test:unit` 1 passed (smoke test do template); `npm run test:api` 2 passed. `app.frontend` confirmado no FastAPI 0.162.0.
- Pendências / quebrado: a interface ainda é a tela de exemplo do Vite; nenhuma feature de produto implementada; `.env` ainda não preenchido (sem chave da OpenRouter no ambiente local).
- Próximo passo sugerido: F001 — walking skeleton.
