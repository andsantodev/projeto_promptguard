# Notas de verificação e bootstrap

Par deste documento: `init.sh` na raiz. Um explica, o outro executa.

## Passo 0 — criação do projeto (já executado em 2026-10-23)

```bash
npm create vite@latest . -- --template react-ts
```

O template atual (create-vite 9.x) gera React 19, Vite 8, TypeScript 6 e **oxlint** no lugar do ESLint. Por isso não existe `eslint.config.mjs`: o lint vive em `.oxlintrc.json`.

Depois do scaffold, foram adicionados:

```bash
npm install tailwindcss @tailwindcss/vite @phosphor-icons/react \
  @fontsource-variable/dm-sans @fontsource-variable/geist-mono
npm install -D vitest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event jsdom
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
```

## Comandos

| Comando | O que faz | Onde roda |
|---|---|---|
| `npm run lint` | oxlint com `--deny-warnings` | front + configs |
| `npm run typecheck` | `tsc -b` (project references) | front |
| `npm run test:unit` | vitest, jsdom | front |
| `npm run test:api` | pytest via `.venv/bin/python` | backend |
| `npm run verify` | os quatro acima em sequência | tudo |
| `npm run build` | `tsc -b && vite build` | release |

Desenvolvimento local exige dois processos:

```bash
.venv/bin/uvicorn backend.main:app --reload   # porta 8000
npm run dev                                   # porta 5173, proxy /api
```

## Faça a verificação falhar de verdade

Verificação que nunca falha não verifica nada. Pontos já tratados e pontos a conferir:

- **`tsc` não proíbe `any`.** Por isso `typescript/no-explicit-any` está como `error` no `.oxlintrc.json`.
- **Warnings não quebram build.** Por isso o script de lint usa `--deny-warnings`.
- **`console.log` esquecido** vai para produção sem aviso. `no-console` está como `error`.
- **Teste o caminho de falha.** Uma vez por feature, quebre algo de propósito e confirme que o comando retorna código diferente de zero. Se não retornar, a evidência daquela feature não vale.
- **Cuidado com teste que não pode falhar.** Um teste que só confere o que ele mesmo simulou continua verde com o código quebrado. Ele precisa observar o resultado real da unidade.
- **Cuidado com teste acoplado à implementação.** Se o teste quebra ao renomear uma função interna sem mudar comportamento, ele testa a implementação, não a feature.
- **oxlint ignora `dist` e `.venv`** por `ignorePatterns`. Se o lint começar a reclamar de arquivo de dependência, o padrão está errado, não o código.

## Verificação de falha em pontos específicos

- **Endpoint de auditoria:** mockar httpx com `respx` e afirmar que a chamada ao modelo acontece uma única vez por ataque, e zero vezes quando a cota estoura.
- **Score:** testar os casos-limite (todos críticos, nenhum sucesso, lista vazia, `not_evaluated`).
- **UI assíncrona:** quatro estados por tela que carrega dado (loading, success, error, empty), cada um com asserção própria.
- **Sem persistência:** após uma auditoria completa, confirmar que nenhuma tabela recebeu texto do prompt. O único write permitido é o contador de cota, com dia e hash de sessão.

## Deploy (Vercel Hobby)

- Um único projeto serve o build do Vite e a API. O FastAPI é resolvido por `[tool.vercel] entrypoint` no `pyproject.toml`.
- O build do front roda na Vercel via `buildCommand` do `vercel.json`.
- Limite de função no Hobby com Fluid compute: 300s. `vercel.json` fixa 60s, folgado para duas chamadas de LLM.
- Sem CORS: front e API compartilham a origem.
- `GET /api/health` é o smoke test de produção.
