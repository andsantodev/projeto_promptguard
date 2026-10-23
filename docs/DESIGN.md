# DESIGN — PromptGuard

Referência visual e de layout da v2, herdada da v1. Toda decisão de tela é tomada aplicando a skill `design-taste-frontend` a este documento.

## O que é

Auditor de segurança para LLMs: o usuário cola o system prompt de uma aplicação de IA, escolhe quais ataques de prompt injection e jailbreak quer testar, e recebe um score de risco de 0 a 100% com o veredito de cada ataque. Ferramenta pública, sem login, de uso único por sessão.

**Público:** recrutadores técnicos e avaliadores de portfólio. **Secundário:** desenvolvedores testando informalmente os próprios prompts.

**Tagline:** "Simule ataques de segurança no seu system prompt."

## Estrutura de telas

Página única, três estados, sem rotas.

### Estado 1 — Tela inicial
- Nome "PromptGuard" e tagline
- Um parágrafo curto explicando o que a ferramenta faz
- Botão principal "Iniciar auditoria" que abre o modal
- Painel lateral com um exemplo de código ilustrativo (system prompt + chamada de auditoria)
- Geometria decorativa discreta: círculos de borda e uma linha diagonal, sempre em `line/50` ou mais fraca
- Estados do botão: carregando biblioteca (desabilitado), pronto, catálogo indisponível

### Estado 2 — Modal de configuração
- Textarea para colar o system prompt, com contador de caracteres até 4000
- Lista lateral com os ataques da biblioteca: **título e descrição sempre visíveis**, sem depender de hover (uso no celular)
- Seleção de 1 a 6 ataques em cartões clicáveis com estado ativo/inativo, contador `N/6`
- Confirmar desabilitado com prompt vazio, acima de 4000 caracteres ou nenhum ataque selecionado
- Fechamento por ESC e por clique no backdrop; foco preso dentro do modal enquanto aberto

### Estado 3 — Painel de resultado
- **Coluna esquerda:** system prompt em modo somente leitura (rolável) e gauge de risco radial de 0 a 100%
- **Coluna direita:** um cartão por ataque selecionado, na ordem de seleção, com título, categoria, badge de severidade, veredito em texto legível e mitigação quando houver
- Evidência (resposta do modelo alvo) atrás de um botão "Ver evidência", truncada em 800 caracteres
- Ataque que falhou: estado "Não avaliado" com cor neutra e botão "Tentar novamente"
- Faixas de cor do gauge: abaixo de 50 verde, de 50 a 80 âmbar, acima de 80 vermelho

## Linguagem visual

- Tema escuro fixo, sem alternância claro/escuro
- Um único acento (âmbar). Vermelho reservado a falha crítica e a ataque bem-sucedido. Verde acinzentado para sucesso/baixo risco
- Tipografia: DM Sans no texto e nos títulos, Geist Mono em código, contadores e rótulos técnicos
- Superfícies com bordas de 1px em `line`, sombra `shadow-panel` apenas em painéis elevados (modal, cartões)
- Sem travessões (—) na interface; sem emoji; sem gradientes coloridos
- Movimento discreto: transição de cor e `active:scale-[0.98]` em botões; `motion-reduce` respeitado

## Tokens

Tema Tailwind v4 em `src/styles/tokens.css`, obrigatório para qualquer cor, espaçamento, raio ou sombra.

| Grupo | Tokens |
|---|---|
| Base grafite | `base-950 #070c1a`, `base-900 #0e1626`, `base-850 #131f33`, `base-800 #1b2940`, `base-700 #26364f` |
| Texto | `ink-400 #7a89a0`, `ink-500 #93a2b6`, `ink-600 #b7c2d1`, `ink-700 #cdd6e1`, `ink-900 #eef2f7` |
| Acento | `accent-300 #fcd88a`, `accent-400 #f2b63b`, `accent-500 #d69a1a` |
| Perigo | `danger-300 #f3a1a1`, `danger-400 #e5484d`, `danger-600 #b9353c` |
| Sucesso | `success-200 #c5e0cd`, `success-500 #7fae8d`, `success-700 #57876a` |
| Linhas | `line rgb(255 255 255 / .10)`, `line-strong rgb(255 255 255 / .16)`, `overlay rgb(3 7 15 / .70)` |
| Raio | `xs .375rem`, `sm .5rem`, `md .75rem`, `lg 1rem`, `full 9999px` |
| Sombra | `panel 0 1px 0 rgb(0 0 0 / .2), 0 14px 40px rgb(0 0 0 / .35)` |
| Espaço semântico | `page 1.5rem`, `page-lg 2.5rem`, `section 2.5rem`, `section-lg 4rem`, `panel 1.5rem`, `card 1.25rem`, `stack 1rem`, `stack-sm .5rem` |
| Escala de texto | `2xs .6875rem` até `7xl 4.5rem`, com line-height própria por degrau |
| Tracking | `tight -0.04em`, `label 0.18em`, `tag 0.14em` |

Fundo do `body`: `base-950` com grade de pontos de 24px em `base-800` e um halo âmbar de 4% no canto inferior direito.

## Regras de composição

- Máximo de 1400px de largura útil, gutter de página responsivo
- Toda informação crítica visível sem hover ou foco
- Nada de texto sobre imagem; contraste mínimo AA em texto de corpo
- Nunca esconder o veredito atrás de um clique: a evidência pode ser expansível, o veredito não
