# Pacote 3.4 — Fix Final de Status de Usuários

## Objetivo

Corrigir de forma definitiva a desativação e reativação de usuários.

## O que mudou

Este pacote adiciona uma rota direta e mais confiável:

```txt
PATCH /api/users/:id/status
```

Body:

```json
{ "isActive": false }
```

ou

```json
{ "isActive": true }
```

Além disso, o frontend usa fallback:

1. tenta `/status`;
2. se falhar, tenta `/deactivate` ou `/reactivate`;
3. para desativação, se necessário, tenta `DELETE /users/:id`.

## Por que isso resolve melhor?

A ação de desativar usuário não fica dependente de `DELETE`, que pode ser confundido com exclusão física. Agora o status do usuário é alterado diretamente via `isActive`.

## Regras

- Apenas ADMIN gerencia status de usuários.
- ADMIN não pode desativar a própria conta logada.
- Usuário desativado não consegue login.
- Histórico continua preservado.
- Usuário desativado pode ser reativado.

## Arquivos alterados

- src/routes/users.routes.js
- src/services/user.service.js
- public/app.js
- public/styles.css
- docs/PACOTE_3_4_FIX_FINAL_STATUS_USUARIOS.md

## Como aplicar

Rode:

```bash
npm run prisma:generate
npx prisma db push
npm run dev
```

Se o banco estiver vazio:

```bash
npm run db:seed
```

## Como testar

1. Login como Admin.
2. Vá em Usuários.
3. Crie usuário teste.
4. Clique em Desativar.
5. Confirme que ele fica marcado como Desativado.
6. Tente login com ele.
7. Reative e teste login novamente.
