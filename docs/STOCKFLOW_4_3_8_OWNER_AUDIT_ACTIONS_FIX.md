# StockFlow 4.3.8 — Owner, Audit Rendering & Smart Actions Fix

## Problemas corrigidos

- Auditoria retornava registros no backend, mas a tabela continuava vazia.
- Página de usuários dizia "Apenas administradores gerenciam usuários", mesmo com Owner logado.
- Owner conseguia criar usuários, mas não gerenciar visualmente cargos/status.
- Botões de reativar podiam tentar reativar item já ativo e gerar HTTP 400.
- Owner legado `admin@stockflow.dev` continuava aparecendo como Owner duplicado.

## Correções

### Auditoria

O endpoint `/api/audit` agora retorna:

```json
{
  "total": 26,
  "data": []
}
```

com campos normalizados para o frontend:

- `date`
- `userName`
- `userEmail`
- `userRole`
- `module`
- `action`
- `details`

O arquivo `public/stockflow-auth-stabilizer.js` agora renderiza a tabela de auditoria mesmo se o renderer original falhar.

### Owner/Admin

A UI passa a exibir:

```txt
Owner/Admin gerenciam usuários
```

e desbloqueia ações de gestão para Owner.

### Ações inteligentes

O frontend impede reativar um item que já está ativo, exibindo uma mensagem informativa em vez de chamar a API e gerar HTTP 400.

### Duplicidade de Owner

Rode:

```bash
npm run consolidate:owner
```

para manter `owner@stockflow.dev` como Owner oficial e desativar o legado `admin@stockflow.dev`.

## Como aplicar

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

## Teste

1. Login com `owner@stockflow.dev`.
2. Abrir Usuários.
3. Confirmar texto `Owner/Admin gerenciam usuários`.
4. Confirmar que `admin@stockflow.dev` aparece como desativado ou não interfere.
5. Abrir Auditoria.
6. Clicar Atualizar auditoria.
7. Confirmar linhas na tabela.
8. Cancelar/Reativar venda ou despesa apenas quando o status permitir.
