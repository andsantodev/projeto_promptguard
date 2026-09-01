# Session Handoff

**Estado atual:** PromptGuard completo (fluxo assíncrono + splitInBatches 1-por-vez + frontend integrado + polling progressivo). Workflow n8n **PromptGuard Audit Async** (id `2cq3t7LR9sXJ7HGi`, 19 nós, webhook **onReceived** em `/promptguard/audit`): loop `splitInBatches(batchSize=1)` que processa **1 ataque por iteração**, grava progresso em `promptg_audit_progress` (1 linha por ataque, visível no frontend a cada ~20-30s) e `onDone` executa a persistência final em `promptg_audit_logs`. Frontend: `POST /api/audit` (proxy) + `GET /api/audit/status` (polling 2s) + `LoadingCard` + conclusão no final. `.env.local` com `N8N_WEBHOOK_URL`.

**Últimas features trabalhadas:** Implantação do `splitInBatches` para loop 1-por-vez
- **splitInBatches v3** `batchSize=1` entre `Separar Ataques` e `LLM Alvo`: output 1 (batch) → LLM, output 0 (done) → Finalizar. Loopback: `Progresso` → `Loop 1 por Vez` (input 0). `Extrair` mudado de `$index` para `$('Separar Ataques').item` (pareamento por batch).
- **Bug corrigido:** `$index` não existe dentro do splitInBatches; outputs invertidos resolvidos.
- **Teste (2 ataques):** veredito 1 em ~27s, loopback, veredito 2 em ~52s, log final. Aprovado pelo usuário.
- Workflow final: 19 nós, sem warnings, publicado e ativo.

**Próxima feature sugerida:** Deploy (ajustar env no hosting, publicar frontend, confirmar webhook ativo).

**Bloqueios conhecidos:** F014 (budget cap) sem verificação oficial de env var (sem acesso ao hosting). Mitigation do Avaliador ocasionalmente em idioma imprevisível (modelo vLLM). RLS deny-all em promptg_audit_logs preservado. SELECT anon em promptg_audit_progress (run_id opaco, revisar antes de publicar se necessário).

**Comando para retomar:** `npm run test:unit`