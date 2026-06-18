# Arquitetura — StockFlow S Plus

## Visão geral

O StockFlow é uma aplicação fullstack em que o backend Node/Express serve tanto a API quanto os arquivos estáticos do frontend.

```txt
Navegador
   ↓
Frontend público em /public
   ↓
API Express em /api
   ↓
Services
   ↓
Prisma ORM
   ↓
PostgreSQL
```

---

## Camadas

### Frontend

Arquivos:

```txt
public/index.html
public/styles.css
public/app.js
```

Responsável por:

- Interface;
- Navegação;
- Consumo da API;
- Toasts;
- Modais;
- Dashboard;
- Relatórios.

### Backend

Pasta:

```txt
src
```

Responsável por:

- Rotas;
- Middlewares;
- Autenticação;
- Regras de negócio;
- Integração com Prisma.

### Banco

Pasta:

```txt
prisma
```

Responsável por:

- Schema;
- Modelos;
- Relacionamentos;
- Seed.

---

## Principais módulos

- Auth;
- Users;
- Products;
- Stock Movements;
- Sales;
- Expenses;
- Dashboard;
- Reports;
- Audit.

---

## Autenticação

O sistema usa JWT. Após login, o frontend armazena o token e envia nas requisições protegidas.

---

## Permissões

O sistema possui cargos como:

- OWNER;
- ADMIN;
- MANAGER;
- STOCK;
- SALES;
- FINANCE.

O Owner representa o criador/dono do sistema e possui acesso total.

---

## Auditoria

A auditoria registra eventos sensíveis, como:

- Criação;
- Cancelamento;
- Reativação;
- Alteração de cargo;
- Movimentações;
- Ações financeiras;
- Consolidação de Owner.

---

## Estratégia de preservação histórica

O StockFlow evita exclusão destrutiva em pontos críticos. Em vez de deletar, o sistema usa:

- Cancelamento;
- Inativação;
- Reativação;
- Auditoria.

Isso melhora rastreabilidade e aproxima o projeto de sistemas empresariais reais.
