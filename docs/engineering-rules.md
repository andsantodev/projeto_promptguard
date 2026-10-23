# Engineering rules

Regras específicas deste projeto. O `AGENTS.md` aponta para cá; não duplique este conteúdo lá.

## React + Vite

- Variáveis `VITE_*` são públicas: aparecem no bundle e qualquer pessoa consegue ler. Segredo fica no backend. Neste projeto nenhuma variável `VITE_*` deve existir.
- Rota protegida no cliente é só UX. A autorização real é validada no backend, em toda requisição. Aqui a regra vale para a cota: o limite por sessão no navegador é conveniência; quem barra de verdade é o teto global no servidor.
- Existe uma rota 404 de verdade, não só um fallback genérico do roteador. Como o app não tem router, isso significa: rota `/api` desconhecida responde 404 JSON da API, e o SPA não inventa rotas que não existem.

## Backend (FastAPI)

Regras derivadas dos requisitos não-funcionais deste PRD, não de um guia genérico de mercado.

- Toda entrada é validada por schema Pydantic antes de qualquer chamada paga. Prompt vazio, acima de 4000 caracteres ou `attackId` inexistente retorna 422, nunca chega ao OpenRouter.
- Toda saída do LLM é dado não confiável: JSON estruturado, validado por schema, com uma única retentativa. Nunca extraia campo com regex.
- Toda chamada externa tem timeout explícito (30s) e no máximo uma retentativa. Sem timeout, a função da Vercel fica pendurada até o limite e o usuário vê tela vazia.
- A cota é consumida **antes** da chamada ao LLM, de forma atômica no Postgres. Se o contador falhar, a requisição falha fechada (503), não aberta.
- Log é estruturado e sem conteúdo: id do ataque, latência, código de status, hash truncado de sessão. Nunca o system prompt, a resposta do modelo ou a mitigação.
- Erro de provedor vira código estável (`PROVIDER_TIMEOUT`, `EVALUATOR_INVALID_JSON`, `QUOTA_EXCEEDED`), não stack trace vazando para o cliente.

## Testes

- **Teste que não pode falhar:** confere apenas o que ele mesmo simulou e permanece verde com o código quebrado. Exemplo a evitar: mockar o cliente HTTP, afirmar que o mock foi chamado e chamar isso de "integração". O teste precisa afirmar o comportamento observável (status, corpo validado, chamada não feita quando deveria ser bloqueada).
- **Teste acoplado à implementação:** quebra ao refatorar sem mudar comportamento porque espiona detalhe interno em vez do resultado observável. Exemplo a evitar: `expect(createClient).toHaveBeenCalledWith(...)` em vez de `expect(response.status).toBe(201)`. Prefira o que o usuário ou o cliente HTTP enxerga.
