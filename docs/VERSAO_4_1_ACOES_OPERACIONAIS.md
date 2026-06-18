# StockFlow Versão 4.1 — Ações Operacionais + Polimento Profissional

## Objetivo

Corrigir e amadurecer ações operacionais importantes do sistema, mantendo a base funcional já validada.

## Melhorias aplicadas

### Produtos

- Correção do clique em **Inativar produto**.
- Ação agora usa `event delegation`, igual à correção feita em usuários.
- Frontend tenta rota explícita `/products/:id/deactivate`.
- Fallback para `DELETE /products/:id`.
- Toasts e confirmação antes da ação.
- Produto inativo permanece preservado para histórico.

### Financeiro

- Correção do clique em **Remover/Excluir despesa**.
- Ação agora usa `event delegation`.
- Frontend tenta rota explícita `/expenses/:id/cancel`.
- Fallback para `DELETE /expenses/:id`.
- Toasts, confirmação e erro mais claro.

### Vendas

- Preparação para ação de **Cancelar venda**, quando suportada pelo backend.
- Se o schema suportar status `CANCELED`, a versão inclui rota de cancelamento.
- A lógica correta para venda é cancelar, não apagar.

### Estoque

- Não foi adicionada ação de apagar movimentações.
- Decisão profissional: movimentações de estoque são histórico operacional e não devem ser removidas.
- Recomendação futura: filtros, exportação e reversão controlada.

### Visual/Favicon

- Adicionado `public/favicon.svg`.
- Favicon condizente com estética SaaS do StockFlow.
- Pequeno polimento em botões de ação e scrollbar de tabelas.

## Como aplicar

Se você já tem a versão 3.6 funcionando, aplique o patch 4.1 sobre ela.

Depois rode:

```bash
taskkill /IM node.exe /F
npm run dev
```

Se estiver usando o projeto completo novo:

```bash
npm install
npx prisma@6.19.3 generate
npx prisma@6.19.3 db push
npm run dev
```

## Como testar

1. Login como Admin.
2. Vá em Produtos.
3. Clique em Inativar produto.
4. Confira se aparece chamada no terminal:
   - `PATCH /api/products/:id/deactivate` ou
   - `DELETE /api/products/:id`

5. Vá em Financeiro.
6. Clique em Remover despesa.
7. Confira se aparece chamada no terminal:
   - `PATCH /api/expenses/:id/cancel` ou
   - `DELETE /api/expenses/:id`

8. Confira o favicon na aba do navegador.

## Observação

A versão prioriza comportamento profissional:
- usuário não é apagado, é desativado;
- produto não é apagado, é inativado;
- venda não deve ser apagada, deve ser cancelada;
- estoque não deve ter histórico apagado.
