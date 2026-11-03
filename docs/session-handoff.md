# Session Handoff

**Estado atual:** F001 a F015 e F017 concluídas. Produto completo, com headers de segurança, 404 de API garantido mesmo sob o fallback do SPA, catálogo, modal acessível, auditoria paralela, cartões com evidência e retry, cota atômica e biblioteca calibrada. README reescrito e prints copiados para `images/`.
**Última feature concluída:** F017 — Release inspection (evidência em `docs/feature_list.json`)
**Próxima feature sugerida:** F016 — Deployment, por sua conta. A F017 já rodou como gate pré-deploy.
**Bloqueios conhecidos:** nada commitado até aqui (decisão do usuário). O link do README aponta para a URL publicada da v1 até o deploy da v2. Riscos aceitos na F017: CSP ausente e `.gitignore` sem `*.pem`/`*.key`. Depois do deploy, registrar o smoke de produção (`/`, `/api/health`, `/api/unknown`) como evidência da F016.
**Comando para retomar:** `npm run verify`
