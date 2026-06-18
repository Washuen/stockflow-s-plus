# StockFlow 4.3.7 — Owner, Audit & Auth Stabilizer

## Problemas corrigidos

Esta versão corrige os pontos reportados após o login funcionar:

- login só refletia depois de atualizar a página;
- logout só refletia depois de atualizar;
- Owner aparecia duplicado;
- conta `admin@stockflow.dev` ainda aparecia como Owner legado;
- Owner logado ainda era tratado como cargo sem permissão em algumas áreas;
- rota `/api/audit` retornava 404;
- auditoria não carregava registros;
- botão de atualizar auditoria chamava rota inexistente.

## Estratégia da correção

### 1. Login/logout imediato e estável

Foi criado o arquivo externo:

```txt
public/stockflow-auth-stabilizer.js
```

Ele não usa script inline, então não é bloqueado por CSP.

Ele:

- captura Entrar;
- faz `POST /api/auth/login`;
- salva token/user;
- recarrega a página automaticamente depois do login;
- captura Sair;
- limpa token/user;
- recarrega a página automaticamente depois do logout.

### 2. Auditoria

Foram adicionados/garantidos:

```txt
src/routes/audit.routes.js
src/services/audit.service.js
app.use('/api/audit', authenticate, auditRoutes)
```

### 3. Owner

O backend e frontend passam a tratar `OWNER` como acesso total.

### 4. Duplicidade de Owner

Foi criado:

```bash
npm run consolidate:owner
```

Esse comando:

- mantém `owner@stockflow.dev` ativo como Owner oficial;
- desativa `admin@stockflow.dev` como conta legada;
- registra evento de auditoria `OWNER_CONSOLIDATED`.

## Comandos recomendados

Após aplicar o patch:

```bash
npm install
npx prisma@6.19.3 generate
npx prisma@6.19.3 db push
npm run consolidate:owner
npm run dev
```

Depois no navegador:

```txt
Ctrl + Shift + R
```

## Login oficial

```txt
owner@stockflow.dev
123456
```

## Testes

1. Entrar.
2. Confirmar recarregamento automático.
3. Ver topo como `Owner StockFlow • Owner / Criador`.
4. Sair.
5. Confirmar recarregamento automático para login.
6. Entrar novamente.
7. Abrir Usuários e verificar apenas `owner@stockflow.dev` como Owner ativo.
8. Abrir Auditoria.
9. Clicar Atualizar auditoria.
10. Ver rota `/api/audit` sem erro 404.
