# Pacote 3.2 — Correção de Exclusão/Admin de Usuários

## Problema corrigido

A exclusão física de usuários podia falhar quando o usuário possuía registros vinculados, como:

- vendas;
- despesas;
- movimentações de estoque;
- logs de auditoria.

Isso acontece porque o banco protege a integridade dos dados. Em sistemas reais, normalmente usuários não são apagados fisicamente quando já possuem histórico; eles são **desativados**.

## Solução aplicada

A ação de "excluir usuário" foi transformada em **desativar usuário**.

Agora:

- Admin pode desativar usuários de qualquer cargo;
- Admin não pode desativar a própria conta logada;
- usuários desativados não conseguem fazer login;
- histórico de vendas, despesas, estoque e auditoria permanece preservado;
- o e-mail do usuário desativado é renomeado internamente para liberar o e-mail original para novo cadastro;
- a tabela mostra usuários desativados com status visual;
- ações administrativas são bloqueadas para usuários desativados.

## Alterações técnicas

### Prisma

O model `User` recebeu:

```prisma
isActive  Boolean   @default(true)
deletedAt DateTime?
```

### Backend

- `deleteUser` agora faz soft delete/desativação.
- Login bloqueia usuários desativados.
- Middleware de autenticação bloqueia usuários desativados.
- Auditoria registra `USER_DEACTIVATED`.

### Frontend

- Botão muda de "Excluir" para "Desativar".
- Usuários desativados aparecem como inativos.
- Conta atual não pode ser desativada.
- Mensagens foram ajustadas.

## Passo obrigatório após aplicar

Como o schema do Prisma mudou, rode:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name add-user-soft-delete
```

Depois:

```bash
npm run dev
```

## Como testar

1. Faça login como Admin.
2. Vá em Usuários.
3. Crie um usuário de teste.
4. Desative esse usuário.
5. Tente fazer login com ele.
6. O login deve ser bloqueado.
7. Confirme que o usuário aparece como desativado na lista.
