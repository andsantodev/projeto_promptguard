# PRD — PromptGuard

*Auditor de Segurança e Red Teaming para LLMs*

## 1. Resumo executivo

PromptGuard é uma ferramenta pública que submete o System Prompt de uma aplicação de IA generativa a uma biblioteca curada de ataques de prompt injection direta e jailbreaking, produzindo uma pontuação de risco (0-100%) e um veredito detalhado por ataque. É um projeto de portfólio, sem uso comercial, pensado para demonstrar profundidade técnica a recrutadores e avaliadores de portfólio.

## 2. Problema e motivação

Times que colocam aplicações de IA generativa em produção raramente têm uma forma rápida de auditar se o System Prompt resiste a tentativas comuns de manipulação (sobrescrita de instrução, role-play/cenário hipotético, ofuscação de texto) antes do lançamento. Hoje isso é feito manualmente, de forma ad-hoc, ou não é feito. PromptGuard demonstra — de forma visual e imediata — como seria uma primeira camada automatizada dessa auditoria, servindo como prova de competência técnica em segurança de IA para quem avalia o portfólio do autor.

## 3. Objetivos (Goals)

- Permitir que o usuário cole um System Prompt e rode uma auditoria automatizada contra um subconjunto de ataques conhecidos.
- Produzir uma pontuação de risco (0-100%) e um veredito individual por ataque, com evidência (não "parece que passou").
- Demonstrar, para recrutadores técnicos, domínio de: segurança defensiva de IA, orquestração de fluxos (n8n), integração com múltiplas LLMs, e saída de dados estruturados.
- Funcionar publicamente, sem login, com proteção de custo e de abuso proporcional ao porte de um projeto de portfólio.
- Entregar uma interface com acabamento visual alto — o autor é profissional de front-end/UX e trata isso como parte do critério de sucesso.

## 4. Não-objetivos (Non-goals)

- **Sem modo Webhook/API Externa.** O sistema não dispara ataques contra endpoints de terceiros, não coleta URLs de serviços externos nem credenciais/API keys de terceiros — decisão explícita para eliminar o maior risco técnico e de abuso do projeto original.
- **Sem prompt injection indireta.** Fora de escopo por construção: não há canal de ingestão de conteúdo externo (documento, página web) no MVP.
- **Sem geração dinâmica de ataques via LLM na v1.** A `attacks_library` é curada e estática; geração dinâmica fica como possível v2.
- **Sem tela de histórico de auditorias.** MVP tem só duas telas: configuração/entrada e resultado.
- **Sem contas de usuário/login.** Acesso público e anônimo, protegido por rate limiting em camadas em vez de autenticação.
- **Não é uma solução de segurança validada para uso real de terceiros** — é uma demonstração técnica de portfólio.

## 5. Usuários e jornada

**Público principal:** recrutadores técnicos e avaliadores de portfólio (LinkedIn e sites de recrutamento). **Público secundário:** desenvolvedores testando informalmente os próprios System Prompts.

**Fluxo principal:**
1. Usuário acessa a página única do PromptGuard.
2. Clica em um botão de ação principal, que abre uma modal.
3. Na modal, cola o System Prompt e seleciona entre 1 e 6 ataques numa lista lateral (título + descrição breve de cada um, sempre visível — sem depender de hover), a partir das 10 opções da `attacks_library`. Confirma.
4. A modal permanece aberta durante o processamento (estado de carregamento visível), enquanto o backend (n8n) roda a auditoria.
5. Ao concluir, a modal fecha e a tela principal muda para o painel de resultado: coluna esquerda com o System Prompt (somente leitura) e o gauge de risco (0-100%); coluna direita com os cartões de cada ataque selecionado (título, descrição breve, badge de severidade, veredito e, quando o ataque teve sucesso, uma sugestão breve de mitigação).
6. Se algum ataque falhar/der timeout, o cartão correspondente mostra "não avaliado" (não conta no score) com um botão manual de nova tentativa só daquele ataque.

Não há uso contínuo/recorrente esperado — é uma ferramenta de demonstração de execução única por sessão, não um produto de uso habitual.

## 6. Requisitos funcionais

1. Modal de entrada para colar o System Prompt, com validação básica de campo não vazio.
2. Node de guardrails no início do fluxo n8n, filtrando payload vazio/excessivo e tentativas de manipular a LLM Avaliadora, antes de qualquer chamada de LLM paga.
3. Lista lateral na tela de configuração com as 10 opções de ataque da `attacks_library` (título + descrição breve, sempre visível — sem depender de hover), permitindo que o usuário selecione entre 1 e 6 ataques para rodar na auditoria.
4. Para cada ataque selecionado: chamada à LLM Alvo, que simula o comportamento do sistema do usuário rodando o System Prompt + o payload de ataque como mensagem do usuário.
5. Para cada resposta da LLM Alvo: chamada à LLM Avaliadora, que julga se o ataque teve sucesso (vazamento do system prompt, obediência a instrução maliciosa, quebra de personagem), retorna veredito + severidade e, quando o ataque teve sucesso, uma sugestão breve de mitigação (mesma chamada, sem custo adicional de LLM).
6. Cálculo da pontuação de risco geral (0-100%) a partir dos veredictos dos ataques selecionados, normalizado pela quantidade rodada — o score é comparável independentemente de o usuário ter escolhido 1 ou 6 ataques.
7. Painel de resultado em duas colunas: System Prompt + gauge de risco (esquerda); cartões de ataque com título, descrição breve, badge de severidade, veredito e sugestão de mitigação quando aplicável (direita).
8. Bloco-resumo consolidado com as principais recomendações de mitigação, reaproveitando as sugestões já geradas pela LLM Avaliadora por ataque (sem chamada de LLM adicional).
9. Tratamento de falha/timeout por ataque individual: marca como "não avaliado" (fora do cálculo do score), com botão manual de nova tentativa só daquele ataque — sem retry automático.
10. Rate limiting por sessão anônima (IP + token de sessão local): 3 auditorias por hora e 10 por dia por sessão.
11. Teto global diário de 50 auditorias completas (até ~600 chamadas de LLM no pior caso, 6 ataques × 2 chamadas), verificado pelo node de guardrails do n8n como proteção final de custo — valor inicial, ajustável por variável de ambiente após observar tráfego real.
12. Registro de cada execução (System Prompt, ataques selecionados, veredictos, score) na tabela `audit_logs` do Supabase.
13. Biblioteca curada de ataques (`attacks_library`) com 10 itens, campos de categoria, título, descrição e payload — conteúdo a ser gerado como documento separado (`docs/attacks-library-seed.md`) após aprovação deste PRD.

## 7. Requisitos não-funcionais

- **Custo:** LLM Alvo via `openai/gpt-oss-120b:free` (tier gratuito) e LLM Avaliadora via `deepseek/deepseek-v4-flash` (custo baixo), ambos roteados pelo OpenRouter; teto de gasto diário como proteção contra abuso.
- **Segurança:** nenhuma credencial de terceiros é coletada ou armazenada; guardrails de entrada no pipeline n8n antes de qualquer chamada de LLM.
- **Acessibilidade/dispositivo:** interface funcional em touch/mobile — os cartões de ataque exibem a descrição diretamente, sem depender de hover.
- **Estética:** tom sério e profissional de segurança da informação, sem clichê de hacker/filme; paleta grafite/slate com acentos contidos (âmbar para alerta, vermelho reservado para falha crítica).
- **Disponibilidade:** ferramenta pública sem autenticação, exposta a tráfego anônimo — protegida por rate limiting em camadas (sessão + teto global).
- **Infraestrutura:** n8n self-hosted na AWS.

## 8. Referências de design

Todas as decisões de layout e visuais são tomadas com a skill `design-taste-frontend` aplicada ao `docs/design-brief.md`: resumo do projeto, especificação de conteúdo por tela (modal de entrada; painel de resultado em duas colunas com gauge e cartões), e a linguagem visual já decidida (paleta grafite/slate, acentos âmbar/vermelho, tom sério sem clichê). As telas não são geradas automaticamente por agente de codificação: implementação e acabamento visual seguem a skill, com revisão manual como etapa final.

## 9. Métricas de sucesso

Critério qualitativo com barra alta, não métrica de produto (tráfego/conversão não se aplicam a portfólio): demo pública funcional, sem bugs visíveis, com qualidade de UX alta o suficiente para ser mostrada e discutida ativamente em entrevista com recrutador. O autor é profissional de front-end/UX design e trata acabamento visual e funcionamento correto como igualmente importantes ("o melhor dos dois mundos").

## 10. Riscos e premissas

- **Risco:** os valores iniciais de rate limiting (3/hora, 10/dia por sessão) e teto global (50 auditorias/dia) são estimativas — podem precisar de ajuste depois de observar tráfego real, especialmente em picos logo após a publicação no LinkedIn.
- **Risco:** a LLM Avaliadora (`deepseek/deepseek-v4-flash`) precisa ser simultaneamente confiável e barata; pode exigir ajuste de modelo depois de testes reais no OpenRouter.
- **Risco:** o n8n self-hosted na AWS precisa estar acessível publicamente para receber o webhook do frontend — domínio/túnel específico ainda não detalhado.
- **Premissa:** o usuário aceita que o PromptGuard é uma ferramenta de demonstração de portfólio, não uma solução de segurança validada para uso real de terceiros.
- **Premissa:** uma biblioteca de ataques estática e bem curada (10 itens, com seleção de até 6 por auditoria) é suficiente para demonstrar profundidade técnica, sem precisar de geração dinâmica via LLM.

## 11. Perguntas em aberto

Todas as decisões críticas foram fechadas nesta rodada. Único item que segue como próximo passo (não bloqueia o restante do Harness): o conteúdo definitivo dos 10 ataques da `attacks_library` será redigido como documento separado (`docs/attacks-library-seed.md`) depois da aprovação deste PRD.

## 12. Fases / Milestones

*(Omitido — a entrevista não trouxe fases ou cronograma explícitos.)*
