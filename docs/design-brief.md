# Design Brief — PromptGuard

*Documento de referência de design dentro do pacote Harness (`docs/`). Toda decisão de layout/visual é tomada aplicando a skill `design-taste-frontend` a este brief.*

## O que é

PromptGuard é um auditor de segurança para LLMs: o usuário cola o System Prompt de uma aplicação de IA, escolhe quais ataques de prompt injection/jailbreak quer testar, e recebe uma pontuação de risco (0-100%) com o veredito de cada ataque. É uma ferramenta pública, sem login, de execução única por sessão (não é um app de uso recorrente).

**Público:** recrutadores técnicos e avaliadores de portfólio (LinkedIn, sites de recrutamento) avaliando a competência do autor em segurança de IA. Público secundário: desenvolvedores testando informalmente os próprios prompts.

**Tagline:** "PromptGuard simula ataques reais de prompt injection e jailbreak contra o seu system prompt, expondo falhas de proteção antes de ir pra produção."

## Estrutura de telas (página única, sem rotas)

### Estado 1 — Tela inicial
- Nome "PromptGuard" + tagline de 2 linhas
- Breve explicação do que a ferramenta faz (1 parágrafo curto)
- Botão de ação principal (ex.: "Iniciar auditoria") que abre a modal

### Estado 2 — Modal de configuração
- Textarea para colar o System Prompt
- Lista lateral com as 10 opções de ataque da biblioteca — cada item com **título + descrição breve sempre visível** (sem depender de hover, pensando em uso por celular)
- Seleção de 1 a 6 ataques (ex.: checkbox ou card clicável com estado ativo/inativo), com contador visível ("3/6 selecionados")
- Botão de confirmar, desabilitado se o prompt estiver vazio ou nenhum ataque selecionado
- Durante o processamento: a modal permanece aberta com um estado de carregamento visível (ex.: "avaliando ataque 3 de 6")

### Estado 3 — Painel de resultado (modal fecha, tela principal muda)
- **Coluna esquerda:** System Prompt em modo somente leitura (rolável) + gauge de risco radial (0-100%)
- **Coluna direita:** um cartão por ataque selecionado, com título, descrição breve, badge de severidade, veredito (passou/falhou) e — quando o ataque teve sucesso — uma sugestão breve de mitigação, visível direto no cartão (nunca só em hover)
- Se um ataque falhar/der timeout: o cartão mostra "não avaliado" (cor neutra, distinta de sucesso/falha) com um botão de nova tentativa manual
- Bloco-resumo consolidado, abaixo ou ao lado dos cartões, reunindo as principais recomendações de mitigação dos ataques que tiveram sucesso

## Linguagem visual

- **Tom:** sério, profissional, "segurança da informação" — pense em painel de compliance/SOC (linha Vanta, Drata, Wiz), não em estética de filme de hacker.
- **Evitar explicitamente:** verde/vermelho neon estilo terminal, tipografia monoespaçada em excesso, código binário caindo, ícones de caveira ou cadeado quebrado — clichês que desvalorizam a seriedade do projeto.
- **Paleta:** fundo grafite/slate escuro, mas não excessivamente dark. Acentos contidos: âmbar para alerta/aviso, vermelho reservado só para falha crítica. Um verde-acinzentado discreto (não neon) para estado de sucesso/baixo risco.
- **Tipografia:** DM Sans (sans-serif geométrico, estilo Supabase) para headlines e UI — presença mais forte em display que o Geist original; Geist Mono mantido para blocos de código/system prompt. Tracking mais agressivo em headlines (-0.04em).
- **Componentes:** cards em vez de tooltips em todo o painel de resultado — decisão explícita para funcionar bem em touch/mobile.
- **Gauge de risco:** variação de cor por faixa (baixo/médio/alto), mantendo a paleta contida acima — não usar vermelho/verde saturados de alerta genérico.
