# Testes manuais da API — StockFlow

Use Insomnia, Postman ou Thunder Client.

## 1. Health

GET http://localhost:3333/api/health

## 2. Dashboard

GET http://localhost:3333/api/dashboard/summary

## 3. Produtos

GET http://localhost:3333/api/products

POST http://localhost:3333/api/products

Body:

{
  "name": "Webcam Full HD Pro",
  "sku": "WEBCAM-FHD-PRO",
  "price": 249.9,
  "cost": 120,
  "stock": 30,
  "minStock": 8,
  "status": "ACTIVE"
}

## 4. Movimentação de estoque

POST http://localhost:3333/api/stock-movements

Body:

{
  "productId": "COLE_ID_DO_PRODUTO",
  "type": "IN",
  "quantity": 10,
  "reason": "Reposição de fornecedor"
}

## 5. Venda

POST http://localhost:3333/api/sales

Body:

{
  "customerName": "Cliente Teste",
  "discount": 0,
  "items": [
    {
      "productId": "COLE_ID_DO_PRODUTO",
      "quantity": 1
    }
  ]
}

## 6. Despesa

POST http://localhost:3333/api/expenses

Body:

{
  "description": "Compra de embalagens",
  "category": "Operacional",
  "amount": 350,
  "status": "PAID"
}

## 7. Relatórios

GET http://localhost:3333/api/reports
