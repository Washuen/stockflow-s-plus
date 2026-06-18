# Plano de Testes — StockFlow S Plus

## Testes unitários

### `tests/unit/money.test.js`
Valida:
- conversão numérica;
- cálculo de margem;
- margem com receita zero.

### `tests/unit/permissions.test.js`
Valida:
- Admin com acesso total;
- Sales criando vendas, mas sem criar produto;
- Stock movimentando estoque, mas sem acessar despesas;
- Finance com acesso financeiro, mas sem alterar estoque.

---

## Testes de integração

### Auth
- Login válido;
- Login com senha incorreta;
- Token retornado;
- Senha não exposta.

### Products
- Listagem autenticada;
- Criação por Admin;
- Bloqueio sem token.

### Sales
- Criação de venda;
- Baixa automática de estoque;
- Bloqueio por estoque insuficiente.

### Dashboard
- Retorno de receita;
- Lucro;
- Estoque crítico.

---

## Teste E2E/API

Fluxo:
1. Login;
2. Listar produtos;
3. Consultar dashboard.

---

## Como rodar

```bash
npm run test
```

Com cobertura:

```bash
npm run test:coverage
```

E2E:

```bash
npm run test:e2e
```
