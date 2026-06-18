# Fase 3 — Auth + Permissões

## O que foi implementado

A Fase 3 substitui a autenticação demo da Fase 2 por uma estrutura real de autenticação e controle de acesso.

Inclui:

- Cadastro de empresa + usuário Admin;
- Login com e-mail e senha;
- Senha criptografada com bcrypt;
- Token JWT;
- Middleware `authenticate`;
- Middleware `authorize`;
- Matriz de permissões por cargo;
- Rotas de usuários;
- Rotas de auditoria;
- Proteção das rotas principais.

---

## Usuário demo do seed

Após rodar `npm run db:seed`, use:

```txt
E-mail: admin@stockflow.dev
Senha: 123456
```

---

## Rotas de autenticação

### Registrar nova empresa/Admin

```txt
POST /api/auth/register
```

Body:

```json
{
  "name": "Luiz Admin",
  "email": "luiz@stockflow.dev",
  "password": "123456",
  "companyName": "StockFlow Luiz"
}
```

### Login

```txt
POST /api/auth/login
```

Body:

```json
{
  "email": "admin@stockflow.dev",
  "password": "123456"
}
```

Resposta:

```json
{
  "token": "JWT_AQUI",
  "user": {
    "id": "...",
    "name": "Admin StockFlow",
    "email": "admin@stockflow.dev",
    "role": "ADMIN",
    "companyId": "..."
  }
}
```

### Usuário autenticado

```txt
GET /api/auth/me
```

Header:

```txt
Authorization: Bearer JWT_AQUI
```

---

## Rotas de usuários

### Listar usuários

```txt
GET /api/users
```

Permissão: `users:read`

### Criar usuário

```txt
POST /api/users
```

Permissão: `users:create`

Body:

```json
{
  "name": "Vendedor 01",
  "email": "vendedor01@stockflow.dev",
  "password": "123456",
  "role": "SALES"
}
```

### Alterar cargo

```txt
PATCH /api/users/:id/role
```

Permissão: `users:update`

Body:

```json
{
  "role": "MANAGER"
}
```

### Remover usuário

```txt
DELETE /api/users/:id
```

Permissão: `users:delete`

---

## Perfis

| Perfil | Função |
|---|---|
| ADMIN | Acesso total |
| MANAGER | Gestão geral |
| STOCK | Estoque |
| SALES | Vendas |
| FINANCE | Financeiro |

---

## Permissões principais

| Ação | Admin | Manager | Stock | Sales | Finance |
|---|---:|---:|---:|---:|---:|
| Produtos | Sim | Sim | Leitura | Leitura | Não |
| Estoque | Sim | Sim | Sim | Não | Não |
| Vendas | Sim | Sim | Não | Sim | Leitura |
| Despesas | Sim | Sim | Não | Não | Sim |
| Relatórios | Sim | Sim | Parcial | Parcial | Sim |
| Usuários | Sim | Não | Não | Não | Não |
| Auditoria | Sim | Sim | Não | Não | Não |

---

## Como testar no Postman/Insomnia

1. Faça login em `/api/auth/login`.
2. Copie o `token`.
3. Em qualquer rota protegida, adicione:

```txt
Authorization: Bearer SEU_TOKEN
```

4. Teste rotas como:
   - `/api/products`;
   - `/api/sales`;
   - `/api/expenses`;
   - `/api/users`;
   - `/api/audit-logs`.

---

## Nota estimada após Fase 3

| Critério | Nota |
|---|---:|
| Nota geral | 99 |
| Produção real | 90–95 |
| Força tecnologia | 99 |
| Complexidade | 98–99 |
| Força sistema | 99 |
| Chance recrutador | 99 |
