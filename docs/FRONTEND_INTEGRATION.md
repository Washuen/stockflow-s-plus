# Integração do Frontend com o Backend — StockFlow

## Objetivo

Substituir os arrays em memória do frontend por chamadas HTTP para a API real.

---

## Base URL

```js
const API_URL = "http://localhost:3333/api";
```

---

## Produtos

### Antes
Dados em array `products`.

### Depois

```js
async function fetchProducts() {
  const response = await fetch(`${API_URL}/products`);
  return response.json();
}
```

### Criar produto

```js
async function createProduct(data) {
  const response = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  return response.json();
}
```

---

## Estoque

```js
async function createStockMovement(data) {
  const response = await fetch(`${API_URL}/stock-movements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  return response.json();
}
```

---

## Vendas

```js
async function createSale(data) {
  const response = await fetch(`${API_URL}/sales`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  return response.json();
}
```

---

## Financeiro

```js
async function fetchExpenses() {
  const response = await fetch(`${API_URL}/expenses`);
  return response.json();
}
```

---

## Dashboard

```js
async function fetchDashboardSummary() {
  const response = await fetch(`${API_URL}/dashboard/summary`);
  return response.json();
}
```

---

## Relatórios

```js
async function fetchReports() {
  const response = await fetch(`${API_URL}/reports`);
  return response.json();
}
```

---

## Próximo passo ideal

Converter o frontend HTML/CSS/JS para:

- React;
- Next.js;
- TypeScript;
- componentes reutilizáveis;
- hooks para API;
- loading/error states.
