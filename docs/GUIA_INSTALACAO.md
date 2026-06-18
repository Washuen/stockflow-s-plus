# Guia de Instalação — StockFlow S Plus

## Requisitos

- Node.js 20+
- npm
- Docker Desktop
- PostgreSQL via Docker
- Git

## Instalação

```bash
npm install
```

## Variáveis de ambiente

Crie o arquivo `.env` com base no `.env.example`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/stockflow?schema=public"

PORT=3333
NODE_ENV=development

JWT_SECRET="stockflow-dev-secret"
JWT_EXPIRES_IN="7d"
```

## Banco com Docker

```bash
docker compose up -d postgres
```

Se o container já existir:

```bash
docker start stockflow_postgres
```

## Prisma

Use a versão 6.19.3:

```bash
npm install prisma@6.19.3 @prisma/client@6.19.3 --save-dev
npx prisma@6.19.3 generate
npx prisma@6.19.3 db push
```

## Seed

```bash
npm run db:seed
```

## Rodar aplicação

```bash
npm run dev
```

Acesse:

```txt
http://localhost:3333
```

## Login

```txt
admin@stockflow.dev
123456
```
