# Guia de Preparação para Deploy — StockFlow S Plus

## Opções comuns

- Banco: Supabase, Neon ou Railway.
- Aplicação: Render, Railway ou VPS.

## Variáveis necessárias

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

PORT=3333
NODE_ENV=production

JWT_SECRET="segredo-forte-de-producao"
JWT_EXPIRES_IN="7d"
```

## Comandos comuns no ambiente de deploy

```bash
npm install
npx prisma@6.19.3 generate
npx prisma@6.19.3 db push
npm start
```

## Atenção

- Nunca suba `.env` para o GitHub.
- Use um `JWT_SECRET` forte em produção.
- Configure o banco de produção antes de iniciar a aplicação.
- Teste login, relatórios e usuários depois do deploy.
