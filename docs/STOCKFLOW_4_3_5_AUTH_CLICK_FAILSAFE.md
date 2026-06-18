# StockFlow 4.3.5 — Auth Click Failsafe

## Problema corrigido

O site abria, mas:

- clicar em Entrar não fazia login;
- clicar em Sair não limpava a sessão;
- o terminal não mostrava `POST /api/auth/login`, indicando que o clique não estava disparando a chamada de autenticação.

## Correção

Esta versão adiciona um fallback de autenticação no frontend:

- captura clique no botão Entrar;
- captura submit do formulário;
- envia `POST /api/auth/login`;
- salva token e usuário no localStorage;
- chama `refreshAll`;
- captura clique no botão Sair;
- limpa sessão corretamente.

## Comandos depois de aplicar

```bash
npm install
npx prisma@6.19.3 generate
npx prisma@6.19.3 db push
npm run promote:owner
npm run dev
```

Se o seed ainda estiver falhando, o login pode funcionar mesmo assim se o Owner já existir.

## Diagnóstico

Com o servidor rodando, teste no terminal:

```bash
npm run check:login
```

Esperado:

```txt
Status: 200
```

Se retornar 401, o problema é usuário/senha no banco.
Se retornar 500, o problema está no backend de autenticação.
Se no navegador não aparecer POST no terminal ao clicar em Entrar, o problema era evento de clique.
