# PromptGuard v2

Auditor de segurança e red-teaming para LLMs. Submete o system prompt de uma aplicação de IA a uma biblioteca curada de ataques de prompt injection e jailbreak, e devolve um score de risco de 0 a 100% com o veredito de cada ataque, a evidência da resposta do modelo e uma sugestão de mitigação.

**Stack:** React 19 + Vite + TypeScript + Tailwind v4 no front, FastAPI como BFF, OpenRouter para os LLMs, Supabase apenas para cota anônima.

## Como funciona

Cada ataque é uma requisição HTTP independente:

1. O front pede o catálogo em `GET /api/attacks` (sem os payloads).
2. O usuário escolhe de 1 a 6 ataques e confirma.
3. O front dispara uma requisição por ataque, em paralelo, para `POST /api/audit`.
4. O servidor chama o modelo alvo com o system prompt do usuário, chama o avaliador para julgar a resposta, valida o JSON e devolve o veredito.
5. Cada cartão da tela aparece quando a sua própria resposta chega.

Sem fila, sem polling, sem job em background, sem persistência do texto do usuário.

## Desenvolvimento

```bash
npm install
python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
cp .env.example .env   # preencha as chaves
```

Dois processos:

```bash
.venv/bin/uvicorn backend.main:app --reload   # API em :8000
npm run dev                                   # front em :5173 (proxy /api)
```

## Comandos

| Comando | O que faz |
|---|---|
| `npm run verify` | lint, typecheck, testes de unidade e da API |
| `npm run build` | build de produção |
| `npm run test:api` | pytest do backend |

## Estado do projeto

Reescrita em andamento. O progresso real está em [`docs/feature_list.json`](docs/feature_list.json) e [`docs/progress.md`](docs/progress.md). O produto, as decisões e os riscos estão em [`docs/PRD.md`](docs/PRD.md).

A v1 (Next.js + n8n) está arquivada em `andsantodev/projeto_promptguard`.
