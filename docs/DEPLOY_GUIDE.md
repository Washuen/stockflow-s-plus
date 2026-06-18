# Guia de Deploy — StockFlow S Plus

Este guia prepara o StockFlow para deploy em plataformas com suporte a Node.js e PostgreSQL.

---

## Requisitos

- Projeto funcionando localmente;
- Repositório no GitHub;
- Banco PostgreSQL externo;
- Variáveis de ambiente configuradas;
- Node.js 20+ recomendado.

---

## Variáveis necessárias

```env
NODE_ENV=production
PORT=3333
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
JWT_SECRET="use-a-strong-random-secret"
JWT_EXPIRES_IN="7d"
```

---

## Deploy no Render

### 1. Subir o projeto para GitHub

Crie um repositório, por exemplo:

```txt
stockflow-s-plus
```

Depois envie o projeto com Git.

### 2. Criar PostgreSQL no Render

No Render:

1. New;
2. PostgreSQL;
3. Escolha nome, região e plano;
4. Copie a Internal/External Database URL.

### 3. Criar Web Service

No Render:

1. New;
2. Web Service;
3. Conecte o repositório GitHub;
4. Configure:

```txt
Environment: Node
Build Command: npm install && npx prisma generate
Start Command: npm run start
```

### 4. Configurar variáveis

Adicione:

```txt
DATABASE_URL
JWT_SECRET
JWT_EXPIRES_IN
NODE_ENV
PORT
```

### 5. Rodar Prisma no deploy

Depois do primeiro deploy, execute no Shell do Render, se disponível:

```bash
npx prisma db push
npm run db:seed
```

Se não houver shell no plano usado, rode localmente apontando para o banco externo com cuidado.

---

## Deploy no Railway

### 1. Criar projeto

1. New Project;
2. Deploy from GitHub repo;
3. Add PostgreSQL plugin;
4. Configure variáveis.

### 2. Variáveis

Use a URL do PostgreSQL do Railway:

```env
DATABASE_URL="${{Postgres.DATABASE_URL}}"
JWT_SECRET="strong-secret"
JWT_EXPIRES_IN="7d"
NODE_ENV=production
```

### 3. Comandos

Build:

```bash
npm install && npx prisma generate
```

Start:

```bash
npm run start
```

---

## Checklist pós-deploy

- Abrir URL pública;
- Testar login Owner;
- Abrir Dashboard;
- Criar produto de teste;
- Registrar movimentação;
- Registrar venda;
- Criar despesa;
- Ver auditoria;
- Gerar relatório;
- Confirmar logout.

---

## Problemas comuns

### Erro de conexão com banco

Verifique:

- `DATABASE_URL`;
- SSL;
- usuário/senha;
- se o banco está ativo.

### Prisma Client não gerado

Rode:

```bash
npx prisma generate
```

### Tabelas não existem

Rode:

```bash
npx prisma db push
```

### Login demo não funciona

Rode:

```bash
npm run db:seed
```

Ou verifique se o Owner foi criado no banco.

---

## Observação importante

Em produção, use um `JWT_SECRET` forte e único. Nunca use o valor do `.env.example`.
