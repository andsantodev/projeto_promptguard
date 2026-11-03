# Session Handoff

**Estado atual:** F001 a F017 concluídas. Produto no ar em `https://projeto-promptguard.vercel.app`, com front Vite e FastAPI na mesma origem, headers de segurança, catálogo, modal acessível, auditoria paralela, cartões com evidência e retry, cota atômica e biblioteca calibrada.
**Última feature concluída:** F016 — Deployment (evidência em `docs/feature_list.json`)
**Próxima feature sugerida:** nenhuma. Projeto concluído.
**Bloqueios conhecidos:** a implantação antiga em `promptguard-coral.vercel.app` está pausada; o README aponta para a URL nova. O deploy depende de `[project].dependencies` no `pyproject.toml` para instalar os pacotes Python.
**Comando para retomar:** `npm run verify`
