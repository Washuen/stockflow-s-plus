# Arquitetura — StockFlow S Plus

## Visão geral

O StockFlow é uma aplicação fullstack monolítica simples, servida por um backend Express que entrega também os arquivos estáticos do frontend.

```txt
Browser
  ↓
Frontend HTML/CSS/JS
  ↓
API REST Express
  ↓
Services
  ↓
Prisma ORM
  ↓
PostgreSQL
```

## Camadas

### Public

Contém a interface:

```txt
public/index.html
public/styles.css
public/app.js
```

### Routes

Define endpoints da API:

```txt
src/routes/
```

### Services

Contém regras de negócio:

```txt
src/services/
```

### Middlewares

Autenticação, autorização e tratamento de erros:

```txt
src/middlewares/
```

### Validators

Validação de payloads:

```txt
src/validators/
```

### Prisma

Schema e seed:

```txt
prisma/schema.prisma
prisma/seed.js
```

## Segurança

- JWT para autenticação.
- Bcrypt para senhas.
- Middleware `authenticate`.
- Middleware `authorize`.
- Permissões por cargo.
- Bloqueio de usuário inativo.
- Admin não pode desativar a própria conta.

## Banco

Modelos principais:

- Company
- User
- Product
- Category
- Supplier
- StockMovement
- Sale
- SaleItem
- Expense
- AuditLog

## Decisão de soft delete

Usuários não são apagados fisicamente. Eles são desativados via:

```txt
isActive = false
deletedAt = data atual
```

Isso preserva o histórico operacional.
