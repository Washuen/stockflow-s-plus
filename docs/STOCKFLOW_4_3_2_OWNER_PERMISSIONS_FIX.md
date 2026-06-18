# StockFlow 4.3.2 — Owner Permissions Fix

## Objetivo

Corrigir a falha onde o sistema reconhecia o usuário como `Owner / Criador`, mas ainda bloqueava as ações como se o cargo não tivesse permissões.

## Correções

- Frontend agora considera `OWNER` como acesso total.
- Backend agora considera `OWNER` como acesso total.
- `ROLE_PERMISSIONS.OWNER = ['*']`.
- `hasPermission` e/ou `can` agora aceitam wildcard `*`.
- Criado script para promover o usuário demo para Owner sem resetar o banco.

## Como aplicar

Depois de copiar o patch por cima da pasta atual:

```bash
taskkill /IM node.exe /F
npx prisma@6.19.3 generate
npx prisma@6.19.3 db push
npm run promote:owner
npm run dev
```

## Login esperado

```txt
admin@stockflow.dev
123456
```

## Como testar

1. Login como Owner/Criador.
2. Dashboard deve mostrar permissões liberadas.
3. Produtos, estoque, vendas, financeiro, relatórios, usuários e auditoria devem funcionar.
4. Se os dados estiverem vazios, rode:

```bash
npm run db:seed
npm run promote:owner
npm run dev
```
