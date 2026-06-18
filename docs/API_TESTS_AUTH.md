# Testes manuais — Fase 3 Auth + Permissões

## 1. Login

POST http://localhost:3333/api/auth/login

Body:

{
  "email": "admin@stockflow.dev",
  "password": "123456"
}

Copie o token da resposta.

---

## 2. Usar token

Em todas as rotas protegidas, envie:

Authorization: Bearer TOKEN

---

## 3. Ver usuário atual

GET http://localhost:3333/api/auth/me

---

## 4. Listar produtos

GET http://localhost:3333/api/products

---

## 5. Criar produto

POST http://localhost:3333/api/products

{
  "name": "Webcam Full HD Pro",
  "sku": "WEBCAM-FHD-PRO",
  "price": 249.9,
  "cost": 120,
  "stock": 30,
  "minStock": 8,
  "status": "ACTIVE"
}

---

## 6. Criar usuário vendedor

POST http://localhost:3333/api/users

{
  "name": "Vendedor 01",
  "email": "vendedor01@stockflow.dev",
  "password": "123456",
  "role": "SALES"
}

---

## 7. Testar permissão

Faça login com o vendedor criado e tente criar produto.

Resultado esperado:

403 — Você não possui permissão para executar esta ação.

---

## 8. Ver auditoria

GET http://localhost:3333/api/audit-logs
