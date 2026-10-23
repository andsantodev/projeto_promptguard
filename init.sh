#!/usr/bin/env bash
set -e

echo "Verificando dependências do Node..."
npm install

echo "Verificando ambiente Python..."
if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
.venv/bin/pip install -q -r requirements-dev.txt

echo "Rodando lint..."
npm run lint

echo "Rodando typecheck..."
npm run typecheck

echo "Rodando testes de unidade..."
npm run test:unit

echo "Rodando testes da API..."
npm run test:api

echo "Ambiente OK."
