# Dashboard Email Marketing — Next.js

Base migrada do HTML original para Next.js com foco em:

- home protegida por login próprio
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
DASHBOARD_VIEWER_USERS_JSON=[{"user":"viewer","password":"change-me"}]
PORT=3000
```

`DASHBOARD_VIEWER_USERS_JSON` deve ser um JSON válido em formato de array:

```json
[{"user":"viewer","password":"secret"},{"user":"analista","password":"secret-2"}]
```

## Rodando localmente

```bash
npm install
cp .env.example .env
npm run dev
```

## Fluxo

- `/` exige login próprio do dashboard antes de mostrar os dados
- `/admin/upload` é a área restrita
- ao subir um novo CSV/XLSX/XLS, o backend processa e mantém o estado em memória
- arquivos adicionais gerados podem ser mantidos na mesma store em memória

## Persistência

O estado agora é em memória. Isso evita dependência de filesystem local, mas significa que reinício do processo ou troca de pod limpa a base carregada.
