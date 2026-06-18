# Checklist de Produção — StockFlow S Plus

## Antes do GitHub

- [ ] Fazer backup da versão estável;
- [ ] Remover `node_modules`;
- [ ] Remover zips/backups de dentro do projeto;
- [ ] Confirmar `.env` no `.gitignore`;
- [ ] Confirmar `.env.example`;
- [ ] Revisar README;
- [ ] Revisar package.json;
- [ ] Testar `npm install`;
- [ ] Testar `npm run dev`;
- [ ] Testar login Owner.

---

## Antes do Deploy

- [ ] Criar banco PostgreSQL externo;
- [ ] Configurar `DATABASE_URL`;
- [ ] Configurar `JWT_SECRET`;
- [ ] Configurar `NODE_ENV=production`;
- [ ] Rodar `npx prisma generate`;
- [ ] Rodar `npx prisma db push`;
- [ ] Rodar seed ou criar Owner;
- [ ] Validar start command.

---

## Pós-deploy

- [ ] Abrir URL pública;
- [ ] Login;
- [ ] Dashboard;
- [ ] Produtos;
- [ ] Estoque;
- [ ] Vendas;
- [ ] Financeiro;
- [ ] Auditoria;
- [ ] Relatórios;
- [ ] Usuários;
- [ ] Logout.

---

## Critérios de sucesso

O deploy é considerado bem-sucedido quando:

- O site abre publicamente;
- Login Owner funciona;
- API responde;
- Banco está persistindo dados;
- Auditoria registra eventos;
- Módulos principais funcionam.
