# PromptGuard

> Auditor de segurança e red-teaming para LLMs — simula ataques reais de prompt injection e jailbreak contra seu system prompt antes de ir para produção.

![Status](https://img.shields.io/badge/status-portfolio-6366f1?style=flat-square)

**🔗 Projeto online:** [https://promptguard-coral.vercel.app/](https://promptguard-coral.vercel.app/)

---

## Sobre

PromptGuard é uma ferramenta pública que submete o System Prompt de uma aplicação de IA generativa a uma biblioteca curada de ataques de **prompt injection direta** e **jailbreaking**. O resultado é uma **pontuação de risco (0–100%)** e um **veredito detalhado por ataque**, com sugestões de mitigação quando aplicável.

Projeto de portfólio desenvolvido para demonstrar domínio em segurança defensiva de IA, orquestração de fluxos (n8n), integração com LLMs via OpenRouter e engenharia de front-end com acabamento visual alto.

---

## Arquitetura

```
Frontend                         Backend
┌──────────────────────┐        ┌──────────────────────────────┐
│  Next.js 16          │  POST  │  n8n Workflow                │
│  (App Router)        │───────▶│  ┌──────────────────┐       │
│  Tailwind v4         │        │  │ Guardrails        │       │
│  Vitest + RTL        │        │  │ (valida entrada)  │       │
│                      │        │  └────────┬─────────┘       │
│  /api/audit ────────│────────│  ┌─────────▼─────────┐       │
│  (proxy → n8n)       │        │  │ Budget Check       │       │
│                      │        │  └─────────┬─────────┘       │
│  /api/audit/status   │        │  ┌─────────▼─────────┐       │
│  (polling 2s)       │◀───────│  │ splitInBatches     │       │
└──────────────────────┘        │  │ (1 ataque/loop)   │       │
                                │  └──┬──────────────┬──┘       │
                                │  ┌──▼──┐      ┌───▼───┐      │
                                │  │LLM  │ ...  │LLM    │      │
                                │  │Alvo │      │Aval.  │      │
                                │  └──┬──┘      └───┬───┘      │
                                │     │              │          │
                                │     └──OpenRouter──┘          │
                                │     (deepseek/deepseek-       │
                                │      v4-flash-0731)           │
                                │              │                │
                                │     ┌────────▼───────┐        │
                                │     │ Supabase       │        │
                                │     │ (audit_logs,   │        │
                                │     │  audit_progress)│        │
                                │     └────────────────┘        │
                                └──────────────────────────────┘
```

---

## Fluxo de auditoria

1. Usuário cola o System Prompt e seleciona de **1 a 6 ataques** na biblioteca disponível
2. Frontend gera um `auditId` e envia ao webhook do n8n via proxy assíncrono
3. **Guardrails** validam entrada (vazio, oversized, manipulação) antes de qualquer chamada paga
4. **Budget check** verifica o teto diário global (50 auditorias/dia)
5. n8n processa **1 ataque por iteração** (splitInBatches):
   - **LLM Alvo**: recebe System Prompt + payload do ataque
   - **LLM Avaliadora**: julga se o ataque teve sucesso + severidade + mitigação
   - Progresso é gravado em `audit_progress` a cada ataque concluído
6. Frontend **polla a cada 2s** e os cartões surgem **1 a 1** com loading nos pendentes
7. Ao final: score consolidado (0–100%) + bloco de recomendações de mitigação

---

## Biblioteca de ataques

| # | Categoria | Título | Descrição |
|---|-----------|--------|-----------|
| 1 | Sobrescrita de instrução | Ignorar instruções anteriores | Pede que o modelo desconsidere o system prompt |
| 2 | Sobrescrita de instrução | Nova diretiva do sistema | Finge atualização legítima do sistema |
| 3 | Sobrescrita de instrução | Instrução aninhada em dados | Esconde instrução maliciosa em dado comum |
| 4 | Cenário hipotético / role-play | Simulação sem regras | Personagem "DAN" sem restrições |
| 5 | Cenário hipotético / role-play | Contexto ficcional protetor | Diário fictício que revela o prompt |
| 6 | Ofuscação / encoding | Instrução em Base64 | Payload codificado para escapar de filtros |
| 7 | Ofuscação / encoding | Divisão de palavras-gatilho | Palavras quebradas para bypass |
| 8 | Vazamento de prompt | Solicitação direta do system prompt | Pede que o modelo se repita |
| 9 | Autoridade falsa | Personificação do desenvolvedor | "Modo debug" do desenvolvedor |
| 10 | Confusão de contexto | Fim de conversa falso | Sinaliza falsa nova conversa |

---

## Tech Stack

| Categoria | Tecnologia |
|-----------|------------|
| **Frontend** | Next.js 16 (App Router), TypeScript, Tailwind v4, Phosphor Icons |
| **Testes** | Vitest + Testing Library (React, jest-dom, user-event) |
| **Orquestração** | n8n (self-hosted, workflow com splitInBatches) |
| **LLMs** | OpenRouter — deepseek/deepseek-v4-flash-0731 (Target + Evaluator) |
| **Banco** | Supabase (PostgreSQL, RLS) |
| **Container** | Docker + n8n |

---

## Screenshots

| Tela inicial | Modal de configuração | Painel de resultados |
|:---:|:---:|:---:|
| ![Tela inicial](images/image-01.png) | ![Modal de configuração](images/image-02.png) | ![Painel de resultados](images/image-03.png) |

---

## Getting Started

### Pré-requisitos

- Node.js >= 20
- n8n self-hosted com webhook acessível publicamente
- Projeto Supabase com as tabelas `promptg_attacks_library`, `promptg_audit_logs` e `promptg_audit_progress`
- Conta no OpenRouter com créditos

### Instalação

```bash
npm install
```

### Variáveis de ambiente (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=chave_anon_publica
```

### Desenvolvimento

```bash
npm run dev
```

---

## Comandos úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run test:unit` | Testes unitários (Vitest) |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | TypeScript type checking |

---

## Estrutura do projeto

```
promptguard/
├── app/
│   ├── page.tsx              # Página principal
│   ├── layout.tsx            # Layout global
│   └── api/
│       ├── audit/route.ts    # Proxy POST → n8n
│       └── audit/status/     # Polling de progresso
├── components/
│   ├── PromptGuardApp.tsx    # Máquina de estados
│   ├── InitialView.tsx       # Tela inicial
│   ├── AuditModal.tsx        # Modal de configuração
│   ├── SystemPromptInput.tsx # Textarea do prompt
│   ├── AttackSelection.tsx   # Seleção de ataques
│   ├── ResultsView.tsx       # Painel de resultado
│   └── RecommendationsSummary.tsx
├── lib/
│   ├── types.ts              # Tipos compartilhados
│   ├── attacks.ts            # Cliente Supabase (catálogo)
│   ├── auditClient.ts        # Cliente de auditoria
│   ├── scoreCalculation.ts   # Cálculo do score
│   ├── rateLimiter.ts        # Rate limiting por sessão
│   └── supabase.ts           # Cliente anon Supabase
└── docs/
    ├── PRD.md                # Product Requirements Document
    ├── design-brief.md       # Referência de design
    ├── attacks-library-seed.md
    ├── progress.md           # Histórico de desenvolvimento
    └── session-handoff.md    # Estado atual para retomada
```

---

## Status do projeto

PromptGuard é um **projeto de portfólio** — sem uso comercial, pensado para demonstrar profundidade técnica a recrutadores e avaliadores.

- ✅ 16/16 features implementadas (ver `feature_list.json`)
- 🚀 Fluxo frontend → n8n → Supabase completo e integrado
- 📋 Documentação completa em `docs/` (PRD, design brief, progresso)

---

## Autor

**Anderson Santo** — [github.com/andsantodev](https://github.com/andsantodev)

Desenvolvido como parte do portfólio profissional de engenharia de front-end com ênfase em segurança de IA.
