# StockFlow S Plus

Sistema fullstack de **estoque, vendas, financeiro, auditoria, relatórios e controle de usuários** desenvolvido como projeto profissional de portfólio.

A versão atual é a **StockFlow 4.4.8 — Documentation & Deploy Prep**, preparada para GitHub e deploy com backend Node/Express, PostgreSQL, Prisma e frontend servido pelo próprio backend.

---

## Visão geral

O StockFlow foi criado para simular um sistema empresarial real, com foco em operações internas de uma empresa que precisa controlar produtos, movimentações de estoque, vendas, despesas, usuários, permissões e auditoria.

O projeto demonstra competências importantes para vagas de estágio e júnior:

- Desenvolvimento fullstack;
- Integração frontend/backend;
- Autenticação com JWT;
- Banco relacional com PostgreSQL;
- ORM Prisma;
- Controle de permissões por cargo;
- Auditoria operacional;
- Design SaaS corporativo;
- Documentação e preparação para deploy.

---

## Funcionalidades

### Autenticação

- Login com JWT;
- Sessão persistida;
- Logout;
- Usuário Owner/Criador para acesso total.

### Dashboard

- Receita;
- Lucro;
- Produtos ativos;
- Estoque crítico;
- Vendas;
- Ticket médio;
- Despesas;
- Eventos de auditoria;
- Últimas operações;
- Saúde operacional;
- Recomendações executivas.

### Produtos

- Cadastro de produtos;
- Listagem de produtos;
- Gerenciamento de produtos;
- Busca;
- Filtros por status;
- Ordenação;
- Detalhes;
- Inativar/Reativar mantendo histórico.

### Estoque

- Entrada;
- Saída;
- Ajuste;
- Histórico de movimentações;
- Filtros;
- Detalhes;
- Marcar movimentação para revisão;
- Rastreabilidade sem exclusão física.

### Vendas

- Registro de vendas;
- Cancelamento de venda;
- Reativação de venda;
- Baixa/controle de estoque integrado;
- Histórico de vendas.

### Financeiro

- Cadastro de despesas;
- Cancelamento de despesa;
- Reativação de despesa;
- Indicadores financeiros;
- Receita, despesas, lucro e margem.

### Auditoria

- Histórico de eventos;
- Usuário responsável;
- Cargo;
- Módulo;
- Ação;
- Detalhes técnicos;
- Registro de ações sensíveis.

### Usuários e permissões

- Criação de usuários;
- Gerenciamento por Owner/Admin;
- Troca de cargo;
- Desativação/Reativação;
- Preservação do Owner principal.

### Relatórios

- Resumo executivo;
- Documentação automática para README/portfólio;
- Análise operacional;
- Exportação CSV executiva;
- Recomendações automáticas.

---

## Tecnologias

### Backend

- Node.js;
- Express;
- Prisma ORM;
- PostgreSQL;
- JWT;
- Bcrypt;
- Zod;
- Nodemon.

### Frontend

- HTML;
- CSS;
- JavaScript;
- Design responsivo;
- Interface SaaS corporativa;
- Modais customizados;
- Toasts;
- Dashboard operacional.

---

## Estrutura do projeto

```txt
stockflow-s-plus
├─ prisma
│  ├─ schema.prisma
│  └─ seed.js
├─ public
│  ├─ index.html
│  ├─ styles.css
│  ├─ app.js
│  └─ favicon.svg
├─ src
│  ├─ config
│  ├─ middlewares
│  ├─ routes
│  ├─ services
│  ├─ utils
│  └─ server.js
├─ docs
├─ scripts
├─ .env.example
├─ .gitignore
├─ package.json
└─ README.md
```

---

## Como rodar localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Criar o arquivo `.env`

Copie o `.env.example`:

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

### 3. Configurar o banco

Defina sua `DATABASE_URL` no `.env`.

Exemplo local:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stockflow?schema=public"
```

### 4. Gerar Prisma Client

```bash
npx prisma generate
```

### 5. Sincronizar o banco

```bash
npx prisma db push
```

### 6. Popular dados demo

```bash
npm run db:seed
```

### 7. Rodar o projeto

```bash
npm run dev
```

Acesse:

```txt
http://localhost:3333
```

---

## Credenciais demo

```txt
E-mail: owner@stockflow.dev
Senha: 123456
Cargo: Owner / Criador
```

---

## Scripts úteis

```bash
npm run dev
npm run start
npm run db:seed
npm run prisma:generate
npm run prisma:push
npm run check:env
```

---

## Deploy 

Production URL:

https://stockflow-s-plus.onrender.com

This project is deployed on Render with a production PostgreSQL database, Prisma ORM and a Node/Express backend.

Este projeto pode ser publicado em plataformas que suportam Node.js + PostgreSQL, como:

- Render;
- Railway;
- Fly.io;
- VPS própria.

A recomendação inicial é usar **Render + PostgreSQL** ou **Railway**, porque ambos permitem backend Node e banco externo.

Veja o guia completo em:

```txt
docs/DEPLOY_GUIDE.md
```

---

## Segurança

Antes de subir para o GitHub:

- Não subir `.env`;
- Não subir `node_modules`;
- Usar `.env.example`;
- Trocar `JWT_SECRET` em produção;
- Usar banco PostgreSQL externo;
- Evitar credenciais reais no código;
- Revisar arquivos temporários e backups.

---

## Status da versão

```txt
StockFlow 4.4.8 — Documentation & Deploy Prep
Status: estável para preparação de GitHub/deploy
```

---

## Próximos passos

- Subir para GitHub;
- Configurar PostgreSQL externo;
- Fazer deploy;
- Testar login em produção;
- Validar módulos principais;
- Adicionar prints ao README;
- Opcional: testes automatizados e CI/CD.
