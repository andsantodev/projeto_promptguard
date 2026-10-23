# PRD — PromptGuard v2

**Status:** aprovado em 2026-10-23
**Repositório:** `projeto_promptguard_v2` (novo; a v1 fica arquivada)

---

## 1. Resumo executivo

PromptGuard submete o system prompt de uma aplicação de IA a uma biblioteca curada de ataques de prompt injection e jailbreak, e devolve um score de risco de 0 a 100% com o veredito de cada ataque, a evidência da resposta do modelo e uma sugestão de mitigação. A v2 é uma reescrita completa do v1: React + Vite no front, FastAPI como BFF, OpenRouter para os LLMs e Supabase apenas para cota. Mantém proposta, layout e biblioteca de ataques, e corrige três falhas do v1: resultado quase sempre 0%, orçamento furado em rajada e auditoria sem estado terminal.

## 2. Problema e motivação

**Produto.** Quem escreve um system prompt (suporte, extração de dados, atendimento) não tem como saber se ele resiste a tentativa de sobrescrita, role-play ou vazamento antes de ir para produção. Testar manualmente exige montar payloads e julgar respostas, o que ninguém faz de forma sistemática.

**Técnico (o que a v1 ensinou).** A v1 cumpriu o papel de aprendizado, mas os dados mostram três defeitos: 8 das 10 últimas auditorias registraram score `0.00`, porque a biblioteca de 2023 não fere modelos de 2026 e o avaliador é binário; o teto diário contava linhas de log de auditorias já concluídas, então disparos simultâneos o furavam; e o polling não tinha estado terminal, deixando a tela girando por até 4 minutos quando o servidor parava de responder.

## 3. Objetivos

1. Reimplementar a jornada completa da v1 (entrada, configuração, resultado) em React + Vite, com paridade visual.
2. Ter um BFF em FastAPI que seja a única porta para OpenRouter e Supabase, com toda a lógica de LLM versionada no repositório.
3. Eliminar a persistência de conteúdo do usuário: nenhum system prompt, resposta de modelo ou veredito é gravado.
4. Fazer a biblioteca de ataques e o avaliador produzirem resultados discriminantes: prompts frágeis pontuam alto, prompts endurecidos pontuam baixo.
5. Garantir que cada execução termine em estado terminal (resultado, erro ou cota excedida) sem polling e sem job órfão.
6. Manter custo operacional próximo de zero: Vercel Hobby, Supabase free e OpenRouter, com monitoramento manual de gasto.

## 4. Não-objetivos

- Login, contas, histórico de auditorias ou dashboard do usuário.
- Persistência de resultados, link compartilhável ou relatório exportável.
- Multiusuário, multitenancy, cobrança ou plano pago.
- Auditoria multi-turno, ataques contra ferramentas/RAG ou análise de código.
- n8n, fila, worker ou processamento em background.
- Escolha do modelo alvo pelo usuário na interface.
- i18n: interface apenas em pt-BR.

## 5. Usuários e jornada

**Público primário:** recrutadores técnicos e avaliadores de portfólio. **Secundário:** desenvolvedores testando informalmente o próprio prompt.

Jornada de uso único, sem retorno recorrente (não é um app de assinatura):

1. Chega na página, entende a proposta em uma leitura, clica em "Iniciar auditoria".
2. No modal, cola o system prompt e escolhe de 1 a 6 ataques.
3. Confirma. O modal fecha e a tela de resultado abre com um cartão vazio por ataque.
4. Os cartões preenchem sozinhos, cada um quando a sua resposta chega.
5. Lê o score, os vereditos e, quando quiser, a evidência da resposta do modelo.
6. Recarrega a página ou clica em "Nova auditoria" e o estado some. É o comportamento esperado, não uma falha.

## 6. Requisitos funcionais

### Interface

- **RF01.** Tela inicial com nome, tagline, explicação curta e botão de ação, preservando a identidade visual da v1.
- **RF02.** Modal de configuração com textarea do system prompt, lista dos ataques com título e descrição sempre visíveis, seleção de 1 a 6, contador `N/6` e confirmação desabilitada enquanto prompt vazio ou nenhum ataque selecionado.
- **RF03.** Ao confirmar, o modal fecha imediatamente e a tela de resultado mostra um cartão por ataque selecionado, em estado de carregamento.
- **RF04.** Cada cartão exibe título, categoria, severidade, veredito legível e, quando houver, mitigação. Um ataque com falha de execução mostra "não avaliado" com botão de tentar novamente, que reenvia somente aquele ataque.
- **RF05.** Cada cartão permite expandir a evidência: a resposta que o modelo alvo devolveu ao ataque, truncada em 800 caracteres.
- **RF06.** A tela de resultado informa qual modelo foi auditado e qual avaliou, lidos do BFF.
- **RF07.** O score de 0 a 100% é calculado no cliente a partir dos vereditos, ponderando severidade (crítico 100, alto 75, médio 50, baixo 25), normalizado pelos ataques efetivamente avaliados; ataques "não avaliado" ficam fora do denominador.
- **RF08.** Mensagens de erro distinguem cota excedida (429), falha do provedor de LLM (502/503) e erro inesperado, sem derrubar os cartões que já concluíram.
- **RF09.** Corrigir a acentuação de todos os textos da interface, hoje escritos sem acentos no v1.

### Backend

- **RF10.** `GET /api/attacks` devolve id, categoria, título, descrição e severidade máxima da biblioteca, lido de arquivo versionado no repositório. O payload do ataque nunca é enviado ao navegador.
- **RF11.** `POST /api/audit` recebe `{ systemPrompt, attackId }`, valida tamanho (1 a 4000 caracteres) e existência do ataque, consome cota e executa o ataque contra o modelo alvo.
- **RF12.** O ataque consiste em duas chamadas: o **modelo alvo** recebe o system prompt do usuário e o payload como mensagem; o **avaliador** recebe prompt, payload e resposta do alvo, e devolve veredito, severidade e mitigação.
- **RF13.** A resposta do avaliador é obtida com JSON estruturado, validada por schema e reenviada uma vez em caso de JSON inválido; nunca é interpretada por regex.
- **RF14.** O endpoint é sem estado: não cria registro, não guarda o prompt, não gera identificador de auditoria. Repetir a mesma chamada simplesmente executa de novo.
- **RF15.** `GET /api/health` devolve estado do serviço e a versão dos modelos configurados.
- **RF16.** Cota anônima por sessão e teto global diário, consumidos de forma atômica, sem registrar o conteúdo do prompt. Limites iniciais: 18 ataques por hora por sessão, 60 por dia por sessão, 300 por dia global (equivalentes a 3 auditorias/hora, 10/dia e 50/dia). Valores configuráveis por variável de ambiente.

### Calibração

- **RF17.** A biblioteca passa a conter ataques eficazes contra modelos atuais, cobrindo quatro categorias: sobrescrita de instrução, role-play, vazamento do system prompt e ofuscação/encoding. Conteúdo final definido na feature de calibração.
- **RF18.** O avaliador reconhece obediência parcial, além de sucesso e falha, e considera o grau de violação ao atribuir severidade.

### Organização de pastas

Até 15 telas, organização por responsabilidade: `src/` com `components/`, `hooks/`, `lib/` (cliente de API, tipos, cálculo de score) e `styles/`; `backend/` com `routers/`, `services/`, `data/` e `tests/`. O app tem uma única página e três estados de tela (inicial, modal, resultado), então não existe roteador.

## 7. Requisitos não-funcionais

- **Segurança:** `OPENROUTER_API_KEY` e `SUPABASE_SERVICE_ROLE_KEY` só existem no servidor; o front nunca fala com OpenRouter ou Supabase; a tabela de cota tem RLS habilitada com deny-all para `anon` e `authenticated`; front e API na mesma origem, sem CORS; limite de 4000 caracteres e de 6 ataques por requisição; nenhum conteúdo do usuário gravado em banco, arquivo ou log.
- **Privacidade:** logs estruturados contêm apenas id do ataque, latência, código de status e hash truncado da sessão.
- **Resistência a manipulação:** o system prompt do usuário é dado não confiável para o avaliador, que o recebe delimitado e com instrução explícita de não obedecer ao seu conteúdo; o resultado é validado por schema antes de sair.
- **Desempenho:** cada requisição faz 2 chamadas de LLM, com timeout de 30s cada e no máximo 1 retry no avaliador; limite de função da Vercel configurado em 60s (máximo do plano é 300s); p95 da auditoria completa de 6 ataques abaixo de 90s.
- **Custo:** abaixo de US$ 0,02 por auditoria de 6 ataques com o par de modelos recomendado.
- **Acessibilidade:** modal com foco preso, fechamento por ESC, rótulos ARIA, contraste AA, navegação por teclado e estados de carregamento anunciados.
- **Responsividade:** uso pleno em viewport de 360px, sem dependência de hover.
- **Disponibilidade:** falha do OpenRouter degrada para mensagem clara, nunca para tela em branco.
- **Infra:** um único projeto Vercel serve o build do Vite e a API; o deploy reconecta o projeto existente para preservar o endereço.

## 8. Referências de design

`docs/DESIGN.md` reúne a estrutura de telas, a tagline e os tokens visuais herdados da v1: base grafite, acento âmbar, vermelho reservado a falha crítica, DM Sans e Geist Mono. Toda decisão de layout é tomada aplicando a skill `design-taste-frontend` a esse documento. A v2 preserva a linguagem visual, não os componentes.

## 9. Métricas de sucesso

- Uma auditoria de 6 ataques termina, com todos os cartões preenchidos, em menos de 90s no p95.
- Nos três prompts de controle (vulnerável, ingênuo, endurecido), os scores saem na ordem esperada e ao menos dois são distintos, em 3 execuções consecutivas.
- Zero ocorrências de texto de system prompt em banco, log ou storage após 10 auditorias de teste.
- Um visitante completa a jornada sem instrução em menos de 2 minutos (teste com 2 pessoas).
- Custo por auditoria abaixo de US$ 0,02.

## 10. Riscos e premissas

| Risco | Impacto | Mitigação |
|---|---|---|
| Calibração não gera variação suficiente de score | Alto | Fixtures de controle viram critério de aceite bloqueante da feature de calibração |
| Endpoint público usado para queimar crédito | Alto | Cota por sessão + teto global diário atômico + limite de 4000 caracteres |
| Avaliador manipulado pelo texto do usuário | Médio | Delimitação explícita, validação de schema, severidade conservadora |
| Cold start do Python na Vercel | Baixo | Aceitável para demo; primeira requisição pode levar 1 a 3s |
| Sem persistência, impossível reproduzir um bug reportado | Médio | Logs estruturados sem conteúdo (ataque, latência, código) |
| Limites do free tier (Vercel, Supabase) | Baixo | Cota global torna o consumo previsível |
| Modelo alvo mudar de comportamento sem aviso | Médio | Versão do modelo fixada em variável de ambiente e exibida na UI |

Premissas: conta OpenRouter com crédito ativo; Vercel Hobby com Fluid compute (300s de função); projeto Supabase "Projetos N8N" reaproveitado; as tabelas `promptg_attacks_library`, `promptg_audit_logs` e `promptg_audit_progress` podem ser removidas; o gasto na OpenRouter é acompanhado manualmente pelo autor, sem teto em dólar configurado no produto; o deploy da v2 reconecta o projeto Vercel existente para preservar o endereço `promptguard-coral.vercel.app`.

## 11. Perguntas em aberto

Nenhuma. As três pendências da versão anterior foram resolvidas: teto diário mantido em 300 ataques com monitoramento manual de gasto, deploy no projeto Vercel existente e evidência truncada em 800 caracteres.
