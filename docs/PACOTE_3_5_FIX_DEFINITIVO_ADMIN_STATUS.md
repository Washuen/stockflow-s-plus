# Pacote 3.5 — Fix Definitivo Admin Status

## Objetivo

Resolver definitivamente o problema de desativar/reativar usuários.

## Mudança principal

Foi criada uma rota administrativa direta:

```txt
PATCH /api/users/:id/admin-status
```

Body:

```json
{ "isActive": false }
```

ou

```json
{ "isActive": true }
```

Essa rota:
- exige ADMIN;
- bloqueia desativar a própria conta;
- atualiza diretamente `User.isActive`;
- não depende de `DELETE`;
- não apaga histórico;
- não deixa auditoria bloquear a ação;
- retorna erro claro com status HTTP.

## Como aplicar

Na pasta deste pacote:

```bash
taskkill /IM node.exe /F
npm install
npm install prisma@6.19.3 @prisma/client@6.19.3 --save-dev
notepad .env
npx prisma@6.19.3 generate
npx prisma@6.19.3 db push
npm run db:seed
npm run dev
```

`.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/stockflow?schema=public"

PORT=3333
NODE_ENV=development

JWT_SECRET="stockflow-dev-secret"
JWT_EXPIRES_IN="7d"
```

## Como testar diretamente pelo navegador/terminal

1. Faça login como Admin no sistema.
2. Vá em Usuários.
3. Crie um usuário teste.
4. Clique em Desativar.

Se ainda falhar, abra o terminal do backend. Agora a mensagem deve indicar exatamente:
- HTTP 400;
- HTTP 403;
- HTTP 404;
- ou erro de banco.

## Arquivos alterados

- src/routes/users.routes.js
- public/app.js
- public/styles.css
- prisma/schema.prisma
