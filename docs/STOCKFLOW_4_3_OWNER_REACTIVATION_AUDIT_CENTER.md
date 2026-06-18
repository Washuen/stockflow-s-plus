# StockFlow 4.3 — Owner, Reactivation & Audit Center

## Objetivo

Corrigir o cancelamento financeiro e adicionar uma camada avançada de governança:

- reativação de registros;
- cargo Owner/Criador;
- central de auditoria;
- histórico detalhado de ações críticas.

## Correção importante

O erro do financeiro foi corrigido removendo a dependência direta de campos `canceledAt` e `cancelReason` na tabela `Expense`.

Agora o cancelamento usa:

- `status = CANCELED`;
- detalhes de cancelamento em `AuditLog.metadata`.

Isso evita erro de Prisma como:

```txt
Unknown argument `canceledAt`
```

## Novidades

### Owner / Criador

Adicionado cargo superior:

```txt
OWNER
```

Uso recomendado:

- Owner/Criador do sistema;
- controle superior ao Admin;
- acesso total;
- acesso à Auditoria.

### Reativação

Agora é possível reativar:

- usuários;
- produtos;
- vendas canceladas;
- despesas canceladas.

### Auditoria

Nova página:

```txt
Auditoria
```

Disponível para:

```txt
OWNER
ADMIN
```

Mostra:

- data;
- usuário;
- cargo;
- módulo;
- ação;
- detalhes técnicos em metadata.

## Comandos após aplicar

Como há alteração de enum no Prisma:

```bash
taskkill /IM node.exe /F
npx prisma@6.19.3 generate
npx prisma@6.19.3 db push
npm run dev
```

Se precisar recriar dados demo:

```bash
npm run db:seed
```

## Testes manuais

1. Login como Owner/Admin.
2. Cancelar despesa.
3. Reativar despesa.
4. Cancelar venda.
5. Reativar venda.
6. Inativar produto.
7. Reativar produto.
8. Desativar usuário.
9. Reativar usuário.
10. Abrir Auditoria e conferir registros.
