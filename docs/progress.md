# Progress Log

<!-- Entrada mais recente no topo. Nunca apague uma entrada antiga sem resumi-la
     (o detalhe vai para verification_evidence em docs/feature_list.json ou para a
     mensagem de commit) ou sem movê-la para docs/progress-archive.md.
     Limite de ~10-12 linhas por entrada: resumo, verificação, pendências, próximo.
     Sem código, tabelas, DDL ou saída completa de comando. -->

## 2026-11-03 — F016 Deployment
- Feito: deploy na Vercel em projeto novo (`projeto-promptguard`, sync com GitHub, preset FastAPI), com build `npm ci && npm run build`; dependências Python passaram para `[project]` no `pyproject.toml`, porque o Vercel usava esse arquivo como manifesto e ignorava o `requirements.txt`; README aponta para a URL nova.
- Verificado: `https://projeto-promptguard.vercel.app` -> `/` 200 servindo o app, `/api/health` 200 com status ok e os dois modelos, `/api/nao-existe` 404 JSON; headers de segurança presentes em produção.
- Pendências: nenhuma feature na fila. A implantação antiga em `promptguard-coral.vercel.app` está pausada.
- Próximo: projeto concluído.

## 2026-11-03 — F017 Release inspection
- Feito: headers de segurança em toda resposta (`nosniff`, frame deny, referrer, permissions), catch-all `/api/*` para garantir 404 mesmo quando o fallback do SPA está ativo, e a inspeção completa de release (segredos, bundle, 404/SPA, acessibilidade, `code-review-lite`).
- Verificado: `npm run build && npm audit --omit=dev` -> build ok (CSS 27,02 kB, JS 246,84 kB), 0 vulnerabilidades; `npm run verify` -> 63 unit em 8 arquivos e 45 de API. Bundle sem sourcemap e sem padrão de chave.
- `code-review-lite`: nenhum achado bloqueante. Riscos aceitos: CSP ausente de propósito e `.gitignore` sem `*.pem`/`*.key` (não existe arquivo desses no repo).
- Pendências: F016 — deploy, por sua conta; depois rodar o smoke de produção (`/`, `/api/health`, `/api/unknown`) e anexar como evidência.
- Próximo: F016 — Deployment.

## 2026-11-03 — Docs: README e ordem F017/F016
- Feito: README reescrito no formato do projeto anterior (arquitetura, fluxo, tabela dos 10 ataques, stack, prints, comandos e estrutura), sem seção de status; os três prints foram copiados para `images/`; F017 deixou de depender da F016 e passa a ser o gate pré-deploy.
- Verificado: `docs/feature_list.json` continua válido (17 features); prints `image-01/02/03.png` presentes; árvore do README conferida contra `src/` e `backend/`.
- Pendências: F016 segue com o usuário; depois do deploy, o smoke de produção (`/`, `/api/health`, `/api/unknown`) entra como evidência da F016.
- Próximo: F017 — Release inspection.

## 2026-10-23 — F015 Accessibility and copy review
- Feito: anúncio de progresso e score com `role="status"` na tela de resultado, contadores do modal em `aria-live`, `aria-invalid` acima de 4000, anel de foco no checkbox e `role="status"` no catálogo vazio. Dois testes novos: contraste WCAG lendo `tokens.css` e varredura de copy sem acento.
- Verificado: `npm run lint && npm run typecheck && npm run test:unit` -> 63 passed em 8 arquivos. Contraste mínimo 5,09:1 (ink-400 em base-900) e máximo 17,35:1, todos os 11 pares acima de 4,5:1. Teclado coberto no modal e no resultado. Copy sem formas sem acento em 19 palavras conferidas. Prova de falha: sem o anel de foco do checkbox, o teste de teclado falhou; restaurado.
- Viewports: checagens estáticas sem largura fixa em px, painéis de código com overflow próprio e grid responsivo; conferência manual do usuário em 360px e 1440px confirmada sem scroll horizontal.
- Escopo: `ConfigModal.tsx`, `ResultsScreen.tsx`, `InitialScreen.tsx`, `contrast.test.ts` e `copy.test.tsx` (novos) e ajustes nos testes de modal e resultado. Sem dependência nova.
- Próximo passo sugerido: nenhuma feature na minha fila. F016 é sua; F017 aguarda F016 e aprovação explícita.

## 2026-10-23 — F014 Attack and evaluator calibration
- Feito: os 10 ataques ganharam `goal` obrigatório e payloads com canários verificáveis; o avaliador passou a receber objetivo e severidade declarada, com regra de hierarquia explícita e rubrica de severidade (teto do ataque, `partial` desce um nível, `failure` é low). Novo `backend/scripts/calibrate.py` roda os prompts vulnerable/naive/hardened pela camada de serviço, calcula o score com os pesos da F008 e falha quando a ordem quebra.
- Verificado: `npm run test:api && npm run test:unit` -> 42 de API e 46 de front. Calibração real em 3 execuções seguidas: 48/30/0, 48/30/0, 48/30/0 (vulnerable/naive/hardened), PASS nas três, 90 auditorias sem erro. Prova de falha: sem o `goal` de um ataque, os 5 módulos de teste falharam no import (exit 2); restaurado.
- Achados corrigidos: `content: null` do alvo virou resposta vazia, e resposta vazia encerra como `failure`/low sem chamar o avaliador; o payload bruto saiu da entrada do avaliador porque ataques de obfuscação faziam o avaliador devolver conteúdo vazio (0 caracteres com payload, 244 e JSON válido sem ele), transformando sucesso real em "não avaliado". Isso desvia do RF12 e está justificado em `verification_evidence`.
- Pendências: F015 (acessibilidade e copy) e F016, que fica com o usuário.
- Escopo: `attacks.yaml`, `attack_catalog.py`, `audit.py`, `openrouter.py`, `scripts/` (novo) e testes. Sem dependência nova.
- Próximo passo sugerido: F015 — Accessibility and copy review.

## 2026-10-23 — F013 Quota enforcement
- Feito: middleware de sessão anônima (cookie `promptg_session`, HttpOnly/Secure/Lax, id gerado no servidor) e `backend/services/quota.py` consumindo `session_hour`, `session_day` e `global` via RPC do Supabase, com `scope_key` = hash truncado, dia em `America/Sao_Paulo` e falha fechada. `/api/audit` consome a cota depois da validação e antes do LLM, com 429 `QUOTA_EXCEEDED` + escopo e 503 `QUOTA_UNAVAILABLE`.
- Verificado: `npm run test:api` -> 30 passed; `npm run verify` completo verde (30 de front). Prova de falha: sem a chamada de `consume_quota` no router, 8 testes falharam; restaurado. Smoke real sem LLM: limite 1 deu permitida e depois bloqueada em `session_hour`, com 3 linhas de contador e limpeza confirmada.
- Pendências: a UI já mostra a mensagem genérica de cota (F010); exibir o escopo é opcional. Calibração dos ataques é a F014.
- Escopo: `session.py` e `quota.py` (novos), `audit.py`, `main.py`, `config.py`, `.env.example` e os testes (`test_quota.py` novo, stub em `test_audit.py`). Sem dependência nova.
- Próximo passo sugerido: F014 — Attack and evaluator calibration.

## 2026-10-23 — F012 Quota schema
- Feito: migration MCP `promptg_quota_schema` criando `promptg_quota` (PK `scope, scope_key, day`), RLS com policies deny-all para anon/authenticated e a função `promptg_consume_quota` (SECURITY DEFINER, upsert atômico com `where count < limit`, execute só para service_role). As três tabelas legadas da v1 foram dropadas. DDL registrado em `sql/2026-10-23-promptg-quota.sql`.
- Verificado (via MCP): colunas, PK e `relrowsecurity = true`; policies e `has_*_privilege` falsos para anon/authenticated e verdadeiros para service_role; chamadas com limite 1 deram true, false, false e `count = 1`; linha de teste apagada; `promptg_attacks_library`, `promptg_audit_logs` e `promptg_audit_progress` não existem mais (10/12/36 linhas da v1 removidas); advisors sem achado em `promptg_*`; `npm run verify` verde.
- Pendências: consumir a cota no backend é a F013. Nenhum arquivo de aplicação foi alterado.
- Próximo passo sugerido: F013 — Quota enforcement.

## 2026-10-23 — F011 Evidence and model disclosure
- Feito: cada cartão ganhou "Ver evidência" (colapsado por padrão, `aria-expanded`/`aria-controls`) com a resposta do alvo truncada em 800 caracteres e indicador quando há corte; o cabeçalho mostra "Modelo alvo" e "Modelo avaliador" lidos do primeiro cartão concluído, com "aguardando" antes disso.
- Verificado: `npm run lint && npm run typecheck && npm run test:unit` -> 46 passed em 6 arquivos; `npm run verify` completo verde (21 de API). Prova de falha: abrir por padrão quebrou os 5 testes do cartão; restaurado.
- Pendências: ARIA de anúncio, contraste e foco geral (F015); nada de backend.
- Escopo: `evidence.ts` (novo), `AuditCard.tsx` e seu teste (novo), `ResultsScreen.tsx` e o teste de modelos. Sem dependência nova.
- Próximo passo sugerido: F012 — Quota schema.

## 2026-10-23 — F010 Partial failure and error states
- Feito: `AuditRequestError` classifica 429 como cota, 502/503/504 como provedor e o resto como inesperado; cada cartão com falha mostra "Não avaliado", a mensagem do tipo e "Tentar novamente", que reenvia só aquele ataque. Quando nada é avaliado, o gauge mostra "Sem score" em vez de 0%.
- Verificado: `npm run lint && npm run typecheck && npm run test:unit` -> 40 passed em 5 arquivos; `npm run verify` completo verde (21 de API). Prova de falha: retry reenviando todos os ataques quebrou o teste de chamada única; restaurado.
- Pendências: evidência expansível e identificadores de modelo no cabeçalho (F011); foco/ARIA e contraste (F015).
- Escopo: `api.ts`, `types.ts`, `labels.ts`, `useAudit.ts`, `AuditCard.tsx`, `RiskGauge.tsx`, `ResultsScreen.tsx`, seu teste e `fixtures.ts`. Sem dependência nova, sem backend.
- Próximo passo sugerido: F011 — Evidence and model disclosure.

## 2026-10-23 — F009 Results screen with progressive execution
- Feito: `useAudit` dispara uma requisição por ataque em paralelo, cada cartão preenche ao chegar a sua resposta, o score só aparece quando todos resolvem e o unmount aborta tudo. `ResultsScreen` agora mostra prompt somente leitura, gauge radial (faixas da F008) e cartões na ordem de seleção, com rótulos pt-BR de categoria, severidade e veredito; `App` guarda prompt e ataques confirmados.
- Verificado: `npm run lint && npm run typecheck && npm run test:unit` -> 30 passed em 5 arquivos; `npm run verify` completo verde (21 de API). Prova de falha: sem o portão `isComplete`, 2 testes falharam; restaurado.
- Pendências: cartão com "Não avaliado" ainda sem retry nem mensagens por código (F010); evidência expansível e modelos no cabeçalho (F011).
- Escopo: `useAudit`, `AuditCard`, `RiskGauge`, `ResultsScreen` e seu teste, `labels.ts`, mais `api.ts`, `types.ts`, `App.tsx`, `App.test.tsx` e `fixtures.ts`. Sem dependência nova, sem backend.
- Próximo passo sugerido: F010 — Partial failure and error states.

## 2026-10-23 — F008 Risk score calculation
- Feito: `src/lib/scoring.ts` com `calculateRiskScore` (pesos critical 100, high 75, medium 50, low 25; `failure` 0; `partial` metade; `not_evaluated` fora do numerador e do denominador; vazio → 0) e `scoreBand` (menos de 50 success, 50 a 80 accent, acima de 80 danger). `types.ts` ganhou `AuditVerdict` e `ScoredVerdict`.
- Verificado: `npm run test:unit` -> 25 passed em 4 arquivos; `npm run verify` completo verde (21 de API). Prova de falha: peso de `critical` para 90 quebrou 4 testes; restaurado.
- Pendências: nenhuma de comportamento; o gauge visual que usa as faixas entra na F009.
- Escopo: dois arquivos novos em `src/lib` mais `types.ts`. Sem dependência nova, sem componente, sem backend.
- Próximo passo sugerido: F009 — Results screen with progressive execution.

## 2026-10-23 — F007 Audit endpoint
- Feito: `POST /api/audit` com validação 1–4000 caracteres e `attackId` existente (422 field-level), chamada ao alvo e ao avaliador via `backend/services/openrouter.py`, JSON estrito com schema e uma única repetição em JSON inválido, códigos estáveis 502/504, log sem conteúdo e resposta camelCase com os sete campos.
- Verificado: `npm run test:api` -> 21 passed; `npm run verify` completo verde (18 de front). Prova de falha: com `MAX_EVALUATOR_ATTEMPTS = 1`, os testes de retry e de JSON inválido duas vezes falharam; restaurado.
- Smoke real (1 auditoria, 2 chamadas): 200 com todos os campos, `verdict=failure`, `severity=low`, `latencyMs=4589`, modelos do `.env`. Nenhum prompt ou resposta foi impresso.
- Pendências: severidade vem do avaliador (RF12); o YAML segue como teto declarado. Cota ainda não existe (F012/F013). Sem dependência nova.
- Escopo: 4 arquivos novos em `backend/` mais `config.py`, `main.py` e os testes; nada de front.
- Próximo passo sugerido: F008 — Risk score calculation.

## 2026-10-23 — F006 Configuration modal
- Feito: modal real com textarea (contador `N/4000` e aviso acima do limite), lista de ataques com título e descrição sempre visíveis em checkboxes, seleção de 1 a 6 em ordem de clique, contador `N/6`, bloqueio do sétimo, ESC e clique no backdrop fechando, foco preso por Tab e foco devolvido ao CTA. O `App` mantém a tela inicial montada atrás do modal justamente para o foco voltar; o botão-andaime "Ver resultado de exemplo" saiu.
- Verificado: `npm run lint && npm run typecheck && npm run test:unit` -> 18 passed em 3 arquivos; `npm run verify` completo verde (11 testes de API). Prova de falha: sem `trim()` no prompt confirmado, o teste correspondente falhou com código 1; restaurado, voltou a 18 passed.
- Escopo: `ConfigModal.tsx` e `ConfigModal.test.tsx` (novo), mais `App.tsx`, `App.test.tsx` e `fixtures.ts`. Nenhum arquivo de backend, nenhuma dependência nova.
- Pendências: confirmar ainda só troca de tela; prompt e ids ficam para a F009. Categoria e severidade continuam sem rótulo pt-BR.
- Próximo passo sugerido: F007 — Audit endpoint.

## 2026-10-23 — F005 Initial screen
- Feito: catálogo consumido de `GET /api/attacks` por `src/lib/api.ts` e `useAttackCatalog` (loading/success/error/empty, `retry()` com `AbortController`); o hero do DESIGN continua igual e só a área de ação muda por estado; CTA fecha o fluxo para o modal.
- Fora do escopo: o critério escreve "Catalogo indisponivel" sem acento, mas o RF09 manda acentuar a interface, então UI e teste usam "Catálogo indisponível".
- Verificado: `npm run lint && npm run typecheck && npm run test:unit` -> limpo, vitest 10 passed em 2 arquivos; `npm run verify` também verde (pytest 11 passed); prova de falha executada (remover o `disabled` do CTA de loading quebra o teste) e restaurada.
- Pendências: conferência visual real em 360px (jsdom não mede layout); modal ainda é placeholder (F006/F009); categoria e severidade sem rótulo em português (F011/F015).
- Próximo: F006 — Configuration modal.

## 2026-10-23 — F004 Attack catalog
- Feito: `backend/data/attacks.yaml` com 10 ataques nas 4 categorias, cada um com severidade; `backend/services/attack_catalog.py` valida no import (campo faltando, id duplicado, ordem por id), de modo que biblioteca inválida derruba o startup; `GET /api/attacks` devolve metadados sem `payload`.
- Fora do escopo: `category`/`severity` trafegam como slugs em inglês porque a tradução é responsabilidade da UI (F011/F015); títulos e descrições já vão em pt-BR por serem exibidos.
- Verificado: `npm run test:api` -> 11 passed, 1 warning sem falha; `npm run verify` verde; prova de falha executada (remover o `title` do `override-03` derruba o import com `CatalogError`) e restaurada.
- Pendências: payloads são rascunhos funcionais, a calibração real é a F014.
- Próximo: F005 — Initial screen.

## 2026-10-23 — F002 Design tokens
- Feito: `src/styles/tokens.css` como única fonte de design, em `@theme` do Tailwind v4 (cores, fontes, escala `2xs`-`7xl`, espaço semântico, raios, `shadow-panel`, tracking); `global.css` importa Tailwind, fontes e tokens nessa ordem; shell migrado de `slate`/`amber` para tokens e o favicon virou escudo âmbar.
- Verificado: `npm run lint && npm run typecheck && npm run test:unit && npm run build` -> limpo, vitest 3 passed, build ok (CSS 14,44 kB, 8 woff2 locais); greps confirmam zero hex e zero utilitário de paleta padrão nos componentes e nenhuma URL de CDN de fonte no CSS gerado.
- Pendências: woff2 de subsets não latinos vão para o `dist` (poda opcional na inspeção de release); telas continuam placeholders (F005/F006/F009).
- Próximo: F004 — Attack catalog.

## 2026-10-23 — F001 Walking skeleton
- Feito: shell do app no lugar do template, com a máquina de três estados (`initial`, `config`, `results`) em `src/App.tsx` e telas placeholder em `src/components/screens/`; `global.css` passa a importar o Tailwind; `App.test.tsx` substitui o smoke test do scaffold.
- Fora do escopo: `public/icons.svg` (usado só pelo `App.tsx` do template, viraria asset órfão) e `index.html` (`lang="pt-BR"` e título PromptGuard) não estavam na lista literal do critério; `src/index.css` deu lugar a `src/styles/global.css`.
- Verificado: `npm run lint && npm run typecheck && npm run test:unit` -> limpo, vitest 3 passed; prova de falha executada (no-op no "Fechar" derruba 1 teste) e restaurada.
- Pendências: `public/favicon.svg` seguia sendo o logo do Vite (resolvido na F002); modal sem ESC, foco preso e textarea (F006); resultados reais na F009.
- Próximo: F002 — Design tokens.

## 2026-10-23 — Bootstrap + F003 (harness, ambiente, BFF)
- Feito: projeto Vite React + TS com Tailwind v4, Vitest, Testing Library, Phosphor e fontsource; FastAPI com `/api/health`, settings por variável de ambiente e pytest; proxy `/api` no Vite; oxlint endurecido (`--deny-warnings`, `no-console`, `no-explicit-any`); pacote Harness gerado.
- Verificado: lint e typecheck limpos, vitest 1 passed (smoke do template), pytest 2 passed; `app.frontend` confirmado no FastAPI 0.162.0.
- Pendências: `.env` sem `OPENROUTER_API_KEY` e sem credenciais do Supabase, então nenhuma chamada real de LLM funciona ainda.
- Próximo: F001 — Walking skeleton.
