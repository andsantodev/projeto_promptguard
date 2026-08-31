#!/usr/bin/env bash
set -e

echo "Instalando dependências..."
npm install

echo "Rodando build..."
npm run build

echo "Rodando testes..."
npm test # confirmar comando exato assim que o projeto Next.js for inicializado

echo "Rodando lint/typecheck..."
npm run lint # confirmar
npx tsc --noEmit # confirmar

echo "Ambiente OK."
