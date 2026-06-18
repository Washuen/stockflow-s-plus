# StockFlow 4.3.1 — Stability Rescue

## Objetivo

Corrigir a instabilidade causada na 4.3 e preservar a base funcional.

## Correções

- Corrige erro `renderSelects is not defined`.
- Corrige cancelamento financeiro sem usar coluna `canceledAt`.
- Mantém dados vindo do backend sem quebrar renderização.
- Adiciona reativação para produtos, vendas e despesas.
- Mantém Auditoria sem quebrar o carregamento das páginas.
- Adiciona cargo `OWNER` no schema/permissões.
- Mantém histórico e auditoria em `AuditLog.metadata`.

## Comandos após aplicar

```bash
taskkill /IM node.exe /F
npx prisma@6.19.3 generate
npx prisma@6.19.3 db push
npm run db:seed
npm run dev
```

## Login demo esperado

```txt
admin@stockflow.dev
123456
```

Depois do seed, esse usuário deve virar `OWNER` se o seed estiver atualizado.
