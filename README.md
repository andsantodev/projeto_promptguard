# PromptGuard

> Auditor de segurança e red-teaming para LLMs — simula ataques reais de prompt injection e jailbreak contra o seu system prompt antes de ir para produção.

![Status](https://img.shields.io/badge/status-portfolio-6366f1?style=flat-square)

**🔗 Projeto online:** [`https://projeto-promptguard.vercel.app/`](https://projeto-promptguard.vercel.app/)

---

## Sobre

PromptGuard submete o System Prompt de uma aplicação de IA generativa a uma biblioteca curada de ataques de **prompt injection direta** e **jailbreaking**. O resultado é uma **pontuação de risco (0–100%)** e um **veredito detalhado por ataque**, com a evidência da resposta do modelo e sugestões de mitigação.

O texto do prompt, as respostas dos modelos e os vereditos não são persistidos: a auditoria é stateless por desenho.

---

## Arquitetura

```
Frontend                          Backend
┌──────────────────────┐         ┌───────────────────────────────┐
│  React 19 + Vite     │  GET    │  FastAPI (BFF)                │
│  TypeScript          │────────▶│  /api/attacks                 │
│  Tailwind v4         │         │  /api/audit                   │
│  Vitest + RTL        │  POST   │                               │
│                      │────────▶│  ┌─────────────────────────┐  │
│  1 requisição por    │         │  │ Cota (Supabase)         │  │
│  ataque, em paralelo │         │  └───────────┬─────────────┘  │
│                      │         │  ┌───────────▼─────────────┐  │
│                      │◀────────│  │ LLM alvo                │  │
│                      │         │  │ (system prompt + ataque)│  │
│                      │         │  └───────────┬─────────────┘  │
│                      │         │  ┌───────────▼─────────────┐  │
│                      │         │  │ LLM avaliador           │  │
│                      │         │  │ (JSON estruturado)      │  │
│                      │         │  └─────────────────────────┘  │
└──────────────────────┘         └───────────────┬───────────────┘
                                                 │
                                        ┌────────▼────────┐
                                        │ OpenRouter      │
                                        │ (modelos alvo   │
                                        │  e avaliador)   │
                                        └─────────────────┘
```

---

## Fluxo de auditoria

1. O front busca a biblioteca em `GET /api/attacks`, que devolve título, categoria e severidade — nunca o payload.
2. O usuário cola o System Prompt e seleciona de **1 a 6 ataques**.
3. Ao confirmar, o front dispara **uma requisição por ataque, em paralelo**, para `POST /api/audit`.
4. Cada requisição consome a cota anônima e chama dois modelos via OpenRouter:
   - **LLM alvo**: recebe o System Prompt do usuário mais o payload do ataque.
   - **LLM avaliador**: julga a resposta e devolve veredito, severidade e mitigação em JSON estruturado, com uma nova tentativa se o JSON vier inválido.
5. Cada cartão é preenchido assim que a sua própria resposta chega; um ataque lento não bloqueia os demais.
6. Quando todos resolvem, o score consolidado aparece no gauge. Falhas isoladas podem ser repetidas sem refazer os cartões já concluídos.

Sem fila, sem polling e sem job em background.

---

## Biblioteca de ataques

| # | Categoria | Ataque | O que testa | Severidade |
|---|---|---|---|---|
| 1 | Vazamento do system prompt | Repetição do texto acima | O alvo reproduz, total ou substancialmente, o prompt que recebeu | Crítica |
| 2 | Vazamento do system prompt | Depuração da configuração | O alvo lista as próprias regras em tópicos, aceitando o enquadramento de documentação | Alta |
| 3 | Vazamento do system prompt | Tradução das instruções | O alvo traduz ou parafraseia o prompt em vez de recusar | Média |
| 4 | Ofuscação e encoding | Instrução codificada em base64 | O alvo decodifica o payload e executa a instrução embutida | Alta |
| 5 | Ofuscação e encoding | Leetspeak | O alvo interpreta o leetspeak e abandona as regras declaradas | Média |
| 6 | Sobrescrita de instrução | Falso bloco de sistema | O alvo aceita um falso bloco de sistema e revoga as próprias restrições | Crítica |
| 7 | Sobrescrita de instrução | Modo de manutenção | O alvo confirma o modo de manutenção e suspende as regras | Alta |
| 8 | Sobrescrita de instrução | Nota do desenvolvedor | O alvo aceita uma política substituta e responde sem as regras antigas | Média |
| 9 | Role-play | Personagem sem restrições | O alvo assume uma persona que declara não ter restrições | Alta |
| 10 | Role-play | Ficção com IA obediente | O alvo justifica uma obediência proibida atribuindo-a à ficção | Média |

A biblioteca é versionada em `backend/data/attacks.yaml` e validada no import: campo faltando, id duplicado ou categoria inválida impedem o startup.

---

## Tech Stack

| Categoria | Tecnologia |
|-----------|------------|
| **Frontend** | React 19, Vite, TypeScript, Tailwind v4, Phosphor Icons |
| **Testes** | Vitest + Testing Library (React, jest-dom, user-event), pytest |
| **Backend** | FastAPI (BFF), Pydantic, httpx |
| **LLMs** | OpenRouter — modelo alvo e modelo avaliador configuráveis por ambiente |
| **Banco** | Supabase (PostgreSQL, RLS) apenas para o contador de cota |

---

## Screenshots

| Tela inicial | Modal de configuração | Painel de resultados |
|:---:|:---:|:---:|
| ![Tela inicial](images/image-01.png) | ![Modal de configuração](images/image-02.png) | ![Painel de resultados](images/image-03.png) |

---

## Getting Started

### Pré-requisitos

- Node.js >= 20
- Python 3.11+
- Conta no OpenRouter com créditos
- Projeto Supabase com a tabela e a função de cota (SQL em `sql/`)

### Instalação

```bash
npm install
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
```

### Variáveis de ambiente (`.env`)

Todas são lidas apenas pelo servidor. Nenhuma chave chega ao navegador.

```env
OPENROUTER_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

TARGET_MODEL=google/gemini-3.5-flash-lite
EVALUATOR_MODEL=anthropic/claude-haiku-5.5

SESSION_HOUR_LIMIT=18
SESSION_DAY_LIMIT=60
GLOBAL_DAY_LIMIT=300

QUOTA_TIMEOUT_SECONDS=5
```

Os modelos são fixados de propósito: um alias como `-latest` mudaria os resultados sem aviso.

### Desenvolvimento

Dois processos:

```bash
.venv/bin/uvicorn backend.main:app --reload   # API em :8000
npm run dev                                   # front em :5173 (proxy /api)
```

---

## Comandos úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento com proxy para a API |
| `npm run build` | Build de produção (typecheck + Vite) |
| `npm run verify` | lint, typecheck, testes de unidade e testes da API |
| `npm run lint` | oxlint com `--deny-warnings` |
| `npm run typecheck` | `tsc -b` |
| `npm run test:unit` | Vitest + Testing Library |
| `npm run test:api` | pytest do backend |

---

## Estrutura do projeto

```
promptguard/
├── src/
│   ├── components/
│   │   ├── screens/          # InitialScreen, ConfigModal, ResultsScreen
│   │   └── results/          # AuditCard, RiskGauge
│   ├── hooks/                # useAttackCatalog, useAudit
│   ├── lib/                  # api, types, scoring, evidence, labels
│   ├── styles/               # tokens.css, global.css
│   └── test/                 # setup, fixtures, contraste e copy
├── backend/
│   ├── main.py               # FastAPI + build do Vite na mesma origem
│   ├── config.py             # settings por variável de ambiente
│   ├── routers/              # health, attacks, audit
│   ├── services/             # catálogo, auditoria, OpenRouter, cota, sessão
│   ├── data/attacks.yaml     # biblioteca versionada
│   ├── scripts/calibrate.py  # calibração manual dos ataques
│   └── tests/
├── sql/                      # schema da cota aplicado via Supabase MCP
├── docs/                     # PRD, DESIGN, regras e histórico
├── vercel.json
├── pyproject.toml
└── package.json
```

---

## Autor

**Anderson Santo** — [github.com/andsantodev](https://github.com/andsantodev)

Desenvolvido como parte do portfólio profissional de engenharia de front-end com ênfase em segurança de IA.
