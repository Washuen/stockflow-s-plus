# API Reference — StockFlow S Plus

> Esta documentação resume as principais rotas usadas pelo frontend.

A API usa prefixo:

```txt
/api
```

Rotas protegidas exigem token JWT no header:

```txt
Authorization: Bearer TOKEN
```

---

## Auth

### POST `/api/auth/login`

Realiza login.

Body:

```json
{
  "email": "owner@stockflow.dev",
  "password": "123456"
}
```

### GET `/api/auth/me`

Retorna o usuário autenticado.

---

## Dashboard

### GET `/api/dashboard/summary`

Retorna resumo executivo.

---

## Products

### GET `/api/products`

Lista produtos.

### POST `/api/products`

Cria produto.

### PATCH `/api/products/:id/deactivate`

Inativa produto.

### PATCH `/api/products/:id/reactivate`

Reativa produto.

---

## Stock Movements

### GET `/api/stock-movements`

Lista movimentações.

### POST `/api/stock-movements`

Cria movimentação.

Tipos comuns:

```txt
IN
OUT
ADJUSTMENT
SALE
```

---

## Sales

### GET `/api/sales`

Lista vendas.

### POST `/api/sales`

Cria venda.

### PATCH `/api/sales/:id/cancel`

Cancela venda.

### PATCH `/api/sales/:id/reactivate`

Reativa venda.

---

## Expenses

### GET `/api/expenses`

Lista despesas.

### POST `/api/expenses`

Cria despesa.

### PATCH `/api/expenses/:id/cancel`

Cancela despesa.

### PATCH `/api/expenses/:id/reactivate`

Reativa despesa.

---

## Users

### GET `/api/users`

Lista usuários.

### POST `/api/users`

Cria usuário.

### PATCH `/api/users/:id/role`

Altera cargo.

### PATCH `/api/users/:id/deactivate`

Desativa usuário.

### PATCH `/api/users/:id/reactivate`

Reativa usuário.

---

## Audit

### GET `/api/audit`

Lista eventos de auditoria.

### GET `/api/audit/summary`

Resumo de auditoria.

---

## Reports

### GET `/api/reports`

Retorna dados para relatórios.
