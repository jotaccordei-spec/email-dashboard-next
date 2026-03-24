# Dashboard Email Marketing — Next.js

Base migrada do HTML original para Next.js com foco em:

- home pública sem upload
- rota restrita para upload em `/admin/upload`
- autenticação simples por variáveis de ambiente
- estado mantido em memória no servidor
- leitura automática do dataset salvo, sem pedir upload novamente
- download de arquivos gerados a partir da store em memória

## Variáveis de ambiente

Use o arquivo `.env.example` como base:

```bash
DASHBOARD_ADMIN_USER=admin
DASHBOARD_ADMIN_PASSWORD=change-me
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
- ao subir um novo CSV/XLSX/XLS, o backend processa e mantém o estado em memória
- arquivos adicionais gerados podem ser mantidos na mesma store em memória

## Persistência

O estado agora é em memória. Isso evita dependência de filesystem local, mas significa que reinício do processo ou troca de pod limpa a base carregada.
