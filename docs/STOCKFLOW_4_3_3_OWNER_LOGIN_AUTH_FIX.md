# StockFlow 4.3.3 — Owner Login & Auth Fix

## Objetivo

Corrigir login, usuário oficial Owner e botão Sair.

## Correções

- Login demo oficial alterado para `owner@stockflow.dev`.
- Senha demo continua `123456`.
- `admin@stockflow.dev` continua ativo como compatibilidade, mas também vira OWNER.
- Seed cria/atualiza `owner@stockflow.dev`.
- Script `npm run promote:owner` cria/promove Owner sem resetar banco.
- Frontend e backend tratam `OWNER` como acesso total.
- Botão Sair limpa sessão mesmo quando o usuário não está autenticado.

## Comandos recomendados

Após aplicar o patch:

```bash
taskkill /IM node.exe /F
npm install
npx prisma@6.19.3 generate
npx prisma@6.19.3 db push
npm run db:seed
npm run promote:owner
npm run dev
```

## Login

```txt
owner@stockflow.dev
123456
```

Login legado ainda aceito:

```txt
admin@stockflow.dev
123456
```

## Observação

Se o comando `taskkill /IM node.exe /F` disser que o processo não foi encontrado, isso é normal: significa que não havia Node rodando.
