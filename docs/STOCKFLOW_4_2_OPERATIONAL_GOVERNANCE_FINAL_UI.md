# StockFlow 4.2 — Operational Governance + Final UI Polish

## Objetivo

Transformar o StockFlow em uma versão mais madura para portfólio e uso real, com foco em governança operacional, auditoria e experiência visual consistente.

## Entregas principais

### Modal customizado

As confirmações nativas do navegador foram substituídas por um modal visual no padrão StockFlow.

Aplicado em ações críticas:

- Inativar produto;
- Cancelar venda;
- Cancelar despesa;
- Desativar usuário;
- Reativar usuário;
- Alterar cargo.

### Cancelamento de vendas

Vendas agora podem ser canceladas sem apagar histórico.

A venda cancelada:

- continua no histórico;
- recebe status `CANCELED`;
- registra `canceledAt`;
- registra `cancelReason`;
- estorna itens ao estoque;
- gera movimentação de ajuste;
- gera log de auditoria;
- deixa de contar como venda ativa nos relatórios.

### Cancelamento de despesas

Despesas agora são canceladas, não removidas fisicamente.

A despesa cancelada:

- continua no histórico;
- recebe status `CANCELED`;
- registra `canceledAt`;
- registra `cancelReason`;
- gera log de auditoria;
- deixa de contar nos totais ativos do financeiro.

### Polimento visual final

- Favicon definitivo em SVG;
- Badges padronizados;
- Linhas históricas com visual atenuado;
- Botões críticos padronizados;
- Modal responsivo;
- Ajustes finos em tabela e UX.

## Comandos obrigatórios após aplicar

Como o schema do Prisma foi alterado:

```bash
taskkill /IM node.exe /F
npx prisma@6.19.3 generate
npx prisma@6.19.3 db push
npm run dev
```

Se o banco estiver vazio:

```bash
npm run db:seed
```

## Testes manuais recomendados

1. Login como Admin.
2. Produtos → Inativar produto.
3. Vendas → Cancelar venda.
4. Conferir venda como Cancelada.
5. Conferir estoque estornado.
6. Financeiro → Cancelar despesa.
7. Conferir despesa como Cancelada.
8. Usuários → Desativar/Reativar.
9. Relatórios → Gerar/exportar.
10. Conferir favicon na aba.

## Decisão profissional

A versão 4.2 evita exclusões destrutivas:

- venda é cancelada;
- despesa é cancelada;
- usuário é desativado;
- produto é inativado;
- estoque mantém histórico.
