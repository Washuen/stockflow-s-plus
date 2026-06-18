# Deploy Fullstack — StockFlow S Plus

## Opção recomendada

### Backend/API
- Render
- Railway
- Fly.io
- Vercel Serverless, se adaptar para Next.js

### Banco
- Supabase
- Neon
- Railway PostgreSQL

### Frontend demonstrável
- Vercel
- Netlify
- GitHub Pages, caso mantenha HTML/CSS/JS estático

---

## Deploy do backend no Render

1. Suba este projeto no GitHub.
2. Acesse Render.
3. Crie um novo Web Service.
4. Conecte o repositório.
5. Configure:

```txt
Build Command: npm install && npx prisma generate
Start Command: npm start
```

6. Adicione variáveis:

```env
DATABASE_URL="sua-url-postgresql"
JWT_SECRET="segredo-forte"
JWT_EXPIRES_IN="7d"
NODE_ENV="production"
```

7. Após deploy, rode migration:

```bash
npx prisma migrate deploy
```

8. Opcionalmente rode seed:

```bash
npm run db:seed
```

---

## Deploy do banco no Supabase

1. Crie projeto no Supabase.
2. Vá em Project Settings > Database.
3. Copie a connection string.
4. Coloque em `DATABASE_URL`.
5. Rode:

```bash
npx prisma migrate deploy
```

---

## Deploy do frontend na Vercel

1. Suba a versão frontend no GitHub.
2. Importe na Vercel.
3. Configure variável:

```env
NEXT_PUBLIC_API_URL="https://sua-api.onrender.com/api"
```

4. Ajuste chamadas fetch para usar essa URL.

---

## Checklist de produção

- [ ] Backend publicado.
- [ ] Banco PostgreSQL em nuvem.
- [ ] Migrations aplicadas.
- [ ] Seed opcional rodado.
- [ ] JWT_SECRET forte.
- [ ] CORS ajustado.
- [ ] Healthcheck funcionando.
- [ ] Login funcionando.
- [ ] Produtos funcionando.
- [ ] Vendas baixando estoque.
- [ ] Dashboard carregando dados reais.
- [ ] Testes passando.
- [ ] README atualizado com link do deploy.
