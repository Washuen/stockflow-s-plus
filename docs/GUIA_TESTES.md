# Guia de Testes — StockFlow S Plus

## Rodar testes

```bash
npm run test
```

## Rodar cobertura

```bash
npm run test:coverage
```

## Áreas testadas

- Regras financeiras.
- Permissões.
- Login.
- Dashboard.
- Produtos.
- Vendas.
- Bloqueio de estoque insuficiente.

## Resultado esperado

```txt
Test Files  6 passed
Tests       15 passed
```

## Problemas comuns

### Vitest com require/import

Se aparecer erro de CommonJS, garanta que os testes estão usando `import`.

### Prisma Client não inicializado

Rode:

```bash
npx prisma@6.19.3 generate
```

### DATABASE_URL não encontrada

Confira se existe `.env` na pasta atual.

### Porta 3333 ocupada

```powershell
netstat -ano | findstr :3333
taskkill /PID NUMERO_DO_PID /F
```

Ou:

```powershell
taskkill /IM node.exe /F
```
