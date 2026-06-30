# StockFlow S Plus

Sistema fullstack de **estoque, vendas, financeiro, auditoria, relatórios, controle de usuários e analytics operacional** desenvolvido como projeto profissional de portfólio.

A versão atual é a **v1.1.0 — Camada Analytics + Power BI**, com backend Node/Express, PostgreSQL, Prisma, autenticação JWT, permissões por perfil, auditoria, testes automatizados e camada analítica preparada para Business Intelligence.

---

## Visão geral

O StockFlow S Plus foi criado para simular um sistema empresarial real, com foco em operações internas de uma empresa que precisa controlar produtos, movimentações de estoque, vendas, despesas, usuários, permissões, auditoria, relatórios e indicadores estratégicos.

O projeto demonstra competências importantes para vagas de estágio e júnior:

- Desenvolvimento fullstack;
- Integração frontend/backend;
- Autenticação com JWT;
- Banco relacional com PostgreSQL;
- ORM Prisma;
- Controle de permissões por cargo;
- Auditoria operacional;
- Testes automatizados;
- Camada analítica interna;
- Dataset estruturado para Power BI;
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

### Analytics + Power BI

- KPIs executivos;
- Analytics de vendas;
- Analytics de estoque;
- Analytics financeiro;
- Dataset operacional estruturado para Power BI;
- Filtros por período;
- Dados organizados por tabelas analíticas.

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

### Qualidade e testes

- Vitest;
- Supertest;
- Testes unitários;
- Testes de integração/API;
- Testes de middlewares;
- Testes de regras de negócio;
- Cobertura automatizada.

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
│  ├─ analytics-architecture.md
│  └─ power-bi.md
├─ scripts
├─ tests
├─ .env.example
├─ .gitignore
├─ CHANGELOG.md
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
npm test
npm run test:coverage
```

---

## Deploy

URL de produção:

```txt
https://stockflow-s-plus.onrender.com
```

O projeto está preparado para deploy em plataformas que suportam Node.js + PostgreSQL, como:

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

Antes de subir para o GitHub ou ambiente público:

- Não subir `.env`;
- Não subir `node_modules`;
- Usar `.env.example`;
- Trocar `JWT_SECRET` em produção;
- Usar banco PostgreSQL externo;
- Evitar credenciais reais no código;
- Revisar arquivos temporários e backups.

---

## Camada Analytics + Power BI

O StockFlow S Plus possui uma camada analítica interna preparada para apoiar indicadores de negócio, relatórios executivos e consumo estruturado por ferramentas de Business Intelligence.

Essa camada transforma dados operacionais de estoque, vendas, despesas, usuários, fornecedores, auditoria e movimentações em respostas analíticas organizadas.

### Endpoints analíticos

```txt
GET /api/analytics/kpis
GET /api/analytics/sales
GET /api/analytics/stock
GET /api/analytics/finance
GET /api/analytics/powerbi
```

### Principais indicadores

A camada Analytics calcula e expõe indicadores como:

- Receita total;
- Total de despesas;
- Custo dos produtos vendidos;
- Lucro bruto;
- Lucro líquido estimado;
- Margem;
- Ticket médio;
- Valor em estoque;
- Produtos críticos;
- Vendas válidas e canceladas;
- Movimentações de estoque;
- Despesas por categoria;
- Logs de auditoria.

### Filtros por período

Os endpoints analíticos suportam filtros opcionais por período:

```txt
startDate
endDate
```

Exemplo:

```txt
GET /api/analytics/kpis?startDate=2026-06-01&endDate=2026-06-30
```

Os filtros são aplicados a vendas, despesas, movimentações de estoque e logs de auditoria no dataset Power BI.

### Dataset Power BI

O endpoint abaixo retorna um dataset operacional estruturado:

```txt
GET /api/analytics/powerbi
```

Esse dataset contém:

```txt
metadata
kpis
salesAnalytics
stockAnalytics
financeAnalytics
tables
```

Tabelas disponíveis:

```txt
products
sales
saleItems
expenses
stockMovements
auditLogs
```

Essa estrutura foi pensada para facilitar a criação de dashboards no Power BI, com dados normalizados e organizados por domínio.

### Segurança da camada analítica

Todos os endpoints analíticos são protegidos por:

- Autenticação JWT;
- Isolamento por empresa via `companyId`;
- Autorização baseada em permissões;
- Permissão obrigatória `reports:read`.

### Testes da camada Analytics

A camada Analytics + Power BI possui cobertura automatizada validando:

- Bloqueio de acesso sem autenticação;
- KPIs analíticos;
- Analytics de vendas;
- Analytics de estoque;
- Analytics financeiro;
- Dataset Power BI;
- Filtros por período;
- Datas inválidas;
- Intervalos de data inválidos.

Status atual da suíte:

```txt
178 testes automatizados passando
95%+ de cobertura geral
analytics.routes.js com 100% de cobertura
analytics.service.js com 100% de cobertura em linhas
```

### Limitações atuais

A camada atual prepara o backend para Business Intelligence, mas ainda não representa uma integração corporativa completa com Power BI em produção.

Limitações conhecidas:

- Ainda não possui conector customizado do Power BI;
- Ainda não possui refresh automático configurado no Power BI Service;
- Ainda não possui exportação CSV ou Excel;
- Ainda não possui arquivo `.pbix` versionado no repositório;
- Ainda não possui dashboard visual analítico no frontend.

Esses pontos fazem parte do roadmap futuro do projeto.

### Valor estratégico

Com essa camada, o StockFlow S Plus deixa de ser apenas um sistema de estoque e passa a demonstrar também visão de dados, métricas de negócio, arquitetura analítica e preparação para BI.

Isso posiciona o projeto como um:

```txt
Business & Analytics Flagship
Production Grade Candidate Elite
Near Production Grade Demonstrable
```

---

## Status da versão

```txt
Versão atual: v1.1.0 — Camada Analytics + Power BI
Status: estável como sistema demonstrável avançado de portfólio
Categoria: Business & Analytics Flagship / Production Grade Candidate Elite
```

---

## Próximos passos

- Criar endpoint de exportação CSV;
- Criar endpoint de exportação Excel;
- Criar dashboard analítico visual no frontend;
- Criar arquivo `.pbix` demonstrativo;
- Criar prints da camada Analytics;
- Adicionar métricas mensais;
- Adicionar curva ABC de produtos;
- Adicionar giro de estoque;
- Adicionar testes E2E com Playwright;
- Atualizar portfólio, currículo, GitHub e LinkedIn com a versão v1.1.0.

---

## Versão atual

**v1.1.0 — Camada Analytics + Power BI**

A versão atual adiciona uma camada analítica interna com endpoints de KPIs, vendas, estoque, financeiro e dataset Power BI, além de filtros por período e testes automatizados dedicados.

Status técnico atual:

```txt
178 testes automatizados passando
95%+ de cobertura geral
```

Para detalhes completos, consulte:

- `CHANGELOG.md`
- `docs/analytics-architecture.md`
- `docs/power-bi.md`
