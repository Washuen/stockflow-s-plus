# StockFlow S Plus — Fase 4: Testes + Deploy Fullstack

## Objetivo

A Fase 4 prepara o StockFlow para ser validado, testado e publicado como projeto fullstack.

Esta fase adiciona:

- Testes unitários;
- Testes de integração;
- Teste E2E/API;
- Configuração Vitest;
- Configuração Playwright;
- Supertest para API;
- Scripts de verificação;
- Dockerfile;
- Docker Compose com PostgreSQL;
- GitHub Actions CI;
- Documentação de deploy;
- Checklist final de publicação.

---

## O que foi adicionado

```txt
tests/
├── unit/
│   ├── money.test.js
│   └── permissions.test.js
├── integration/
│   ├── auth.test.js
│   ├── products.test.js
│   ├── sales.test.js
│   └── dashboard.test.js
└── e2e/
    └── api-flow.spec.js

.github/workflows/
└── ci.yml

scripts/
├── check-env.js
└── verify-api.js

Dockerfile
docker-compose.yml
vitest.config.js
playwright.config.js
```

---

## Como testar localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar `.env`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stockflow?schema=public"
JWT_SECRET="stockflow-dev-secret"
JWT_EXPIRES_IN="7d"
PORT=3333
```

### 3. Rodar PostgreSQL

Opção com Docker:

```bash
docker compose up -d postgres
```

Ou use PostgreSQL local/nuvem.

### 4. Rodar Prisma

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run db:seed
```

### 5. Rodar testes

```bash
npm run test
```

### 6. Rodar API

```bash
npm run dev
```

### 7. Verificar API

```bash
npm run verify:api
```

---

## Como testar com Docker

```bash
docker compose up -d
```

Depois, em outro terminal:

```bash
docker compose exec api npm run prisma:deploy
docker compose exec api npm run db:seed
```

A API ficará em:

```txt
http://localhost:3333
```

---

## Como testar login

```txt
POST http://localhost:3333/api/auth/login
```

Body:

```json
{
  "email": "admin@stockflow.dev",
  "password": "123456"
}
```

Use o token em:

```txt
Authorization: Bearer TOKEN
```

---

## Nota estimada após Fase 4

| Critério | Nota |
|---|---:|
| Nota geral | 99–100 |
| Produção real | 95–98 |
| Força tecnologia | 99–100 |
| Complexidade | 99 |
| GitHub | 99 |
| Currículo | 99–100 |
| Chance recrutador | 99–100 |

---

## Próxima fase

Fase 5 — Polimento Final + Documentação Profissional.

Essa fase vai fechar:

- README final definitivo;
- apresentação para currículo;
- texto para LinkedIn;
- documentação final da API;
- prints e guia de portfólio;
- checklist final Super S+.
