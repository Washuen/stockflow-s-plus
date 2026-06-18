# StockFlow 4.3.4 — Seed & Owner Schema Compatibility Fix

## Problema corrigido

O schema real desta versão usa:

```txt
User.passwordHash
```

e não:

```txt
User.password
```

Além disso, `Company.document` não é campo único para `upsert`.

Por isso os comandos anteriores falhavam com:

```txt
Argument `where` of type CompanyWhereUniqueInput needs at least one of `id`
Argument `passwordHash` is missing
```

## Correção

Esta versão altera apenas:

- `prisma/seed.js`;
- `scripts/promote-owner.js`;
- scripts do `package.json`.

## Login oficial

```txt
owner@stockflow.dev
123456
```

Compatibilidade mantida:

```txt
admin@stockflow.dev
123456
```

## Comandos recomendados

Depois de aplicar o patch:

```bash
npm install
npx prisma@6.19.3 generate
npx prisma@6.19.3 db push
npm run db:seed
npm run promote:owner
npm run dev
```

Se o banco estiver com drift ou dados antigos demais e você aceitar resetar o banco de desenvolvimento:

```bash
npx prisma@6.19.3 migrate reset
npm run promote:owner
npm run dev
```

Use reset apenas se não se importar em recriar dados demo.
