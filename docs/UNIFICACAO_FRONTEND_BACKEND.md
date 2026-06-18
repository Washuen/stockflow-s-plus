# Unificação Frontend + Backend

## O que foi feito

O projeto agora funciona como uma aplicação única:

- `public/` contém o frontend.
- `src/app.js` serve os arquivos estáticos.
- `/api/*` continua sendo API.
- `/` abre a interface visual.
- `public/app.js` usa `fetch('/api/...')`.

## Fluxo

1. Usuário abre `http://localhost:3333`.
2. Express entrega `public/index.html`.
3. Usuário faz login.
4. Frontend chama `/api/auth/login`.
5. Backend retorna JWT.
6. Frontend salva token no localStorage.
7. Todas as chamadas seguintes usam `Authorization: Bearer TOKEN`.
8. Backend valida auth e permissões.
9. Frontend renderiza dados reais do PostgreSQL.

## Arquivos importantes

- `public/index.html`
- `public/styles.css`
- `public/app.js`
- `src/app.js`
- `src/routes/auth.routes.js`
- `src/middlewares/authMiddleware.js`
- `prisma/schema.prisma`
