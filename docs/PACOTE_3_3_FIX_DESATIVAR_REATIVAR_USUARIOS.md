# Pacote 3.3 — Fix Definitivo de Desativar/Reativar Usuários

## Problema corrigido

A desativação de usuários ainda podia falhar ou ficar pouco clara porque estava usando a rota `DELETE /users/:id`.

Neste pacote, a gestão ficou mais explícita e profissional:

- `PATCH /api/users/:id/deactivate`
- `PATCH /api/users/:id/reactivate`

## Entregas

- Nova rota para desativar usuário.
- Nova rota para reativar usuário.
- Frontend agora chama diretamente `/deactivate` e `/reactivate`.
- Botão "Desativar" para usuários ativos.
- Botão "Reativar" para usuários inativos.
- Admin continua bloqueado para desativar a própria conta.
- Histórico continua preservado.
- A rota antiga `DELETE /users/:id` continua existindo, mas agora chama a mesma lógica de desativação.
- Mensagens de erro mais claras.

## Arquivos alterados

- src/routes/users.routes.js
- src/services/user.service.js
- src/utils/permissions.js
- public/app.js
- public/styles.css
- docs/PACOTE_3_3_FIX_DESATIVAR_REATIVAR_USUARIOS.md

## Como aplicar

Se você já aplicou o Pacote 3.2 e rodou o schema com `isActive` e `deletedAt`, não precisa criar nova migration.

Rode:

```bash
npm run prisma:generate
npm run dev
```

Se ainda não aplicou o schema do Pacote 3.2, rode antes:

```bash
npx prisma db push
npm run db:seed
npm run dev
```

## Como testar

1. Faça login como Admin:

```txt
admin@stockflow.dev / 123456
```

2. Vá em Usuários.

3. Crie um usuário de teste.

4. Clique em Desativar.

5. Confirme que:
- o usuário aparece como desativado;
- ele não consegue fazer login;
- aparece botão Reativar;
- ao reativar, ele volta a conseguir login;
- a conta atual do Admin não pode ser desativada.
