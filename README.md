# Dashboard Email Marketing — Next.js

Base migrada do HTML original para Next.js com foco em:

- home pública sem upload
- rota restrita para upload em `/admin/upload`
- autenticação simples por variáveis de ambiente
- estado persistido server-side em arquivo JSON
- leitura automática do dataset salvo, sem pedir upload novamente
- download de arquivos gerados pela pasta `data/generated`

## Variáveis de ambiente

Use o arquivo `.env.example` como base:

```bash
DASHBOARD_ADMIN_USER=admin
DASHBOARD_ADMIN_PASSWORD=change-me
DATA_DIR=/app/data
PORT=3000
```

## Rodando localmente

```bash
npm install
cp .env.example .env
npm run dev
```

## Fluxo

- `/` mostra o dashboard já persistido
- `/admin/upload` é a área restrita
- ao subir um novo CSV/XLSX/XLS, o backend processa e grava `dashboard-state.json`
- os downloads extras podem ser colocados em `data/generated`

## Persistência

A pasta `DATA_DIR` deve ser montada como volume no container para o estado sobreviver a restart.

Exemplo:

```bash
docker run -p 3000:3000 \
  -e DASHBOARD_ADMIN_USER=admin \
  -e DASHBOARD_ADMIN_PASSWORD=secret \
  -e DATA_DIR=/app/data \
  -v $(pwd)/data:/app/data \
  email-dashboard-next
```
