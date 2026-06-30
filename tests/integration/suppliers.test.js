import crypto from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { app, request, loginAsAdmin, authHeader } from '../helpers.js';

async function createSupplier(token, overrides = {}) {
  const unique = crypto.randomUUID();

  const response = await request(app)
    .post('/api/suppliers')
    .set(authHeader(token))
    .send({
      name: `Fornecedor Teste ${unique}`,
      email: `fornecedor-${unique}@stockflow.dev`,
      phone: '(11) 99999-9999',
      document: `DOC-${unique.slice(0, 8)}`,
      ...overrides
    });

  expect(response.status).toBe(201);

  return response.body;
}

describe('Suppliers API', () => {
  it('deve listar fornecedores autenticado', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .get('/api/suppliers')
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('deve criar fornecedor autenticado', async () => {
    const token = await loginAsAdmin();
    const unique = crypto.randomUUID();

    const response = await request(app)
      .post('/api/suppliers')
      .set(authHeader(token))
      .send({
        name: `Fornecedor Criar ${unique}`,
        email: `criar-${unique}@stockflow.dev`,
        phone: '(21) 98888-8888',
        document: `DOC-${unique.slice(0, 8)}`
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toContain('Fornecedor Criar');
    expect(response.body.email).toContain('criar-');
  });

  it('deve bloquear criação de fornecedor sem token', async () => {
    const unique = crypto.randomUUID();

    const response = await request(app)
      .post('/api/suppliers')
      .send({
        name: `Fornecedor Sem Token ${unique}`,
        email: `sem-token-${unique}@stockflow.dev`,
        phone: '(31) 97777-7777',
        document: `DOC-${unique.slice(0, 8)}`
      });

    expect(response.status).toBe(401);
  });

  it('deve listar fornecedor criado na listagem', async () => {
    const token = await loginAsAdmin();

    const supplier = await createSupplier(token, {
      name: `Fornecedor Listagem ${crypto.randomUUID()}`
    });

    const response = await request(app)
      .get('/api/suppliers')
      .set(authHeader(token));

    expect(response.status).toBe(200);

    const foundSupplier = response.body.find(
      (item) => item.id === supplier.id
    );

    expect(foundSupplier).toBeTruthy();
    expect(foundSupplier.name).toBe(supplier.name);
  });

  it('deve permitir múltiplos fornecedores válidos', async () => {
    const token = await loginAsAdmin();

    const firstSupplier = await createSupplier(token, {
      name: `Fornecedor A ${crypto.randomUUID()}`
    });

    const secondSupplier = await createSupplier(token, {
      name: `Fornecedor B ${crypto.randomUUID()}`
    });

    expect(firstSupplier.id).toBeTruthy();
    expect(secondSupplier.id).toBeTruthy();
    expect(firstSupplier.id).not.toBe(secondSupplier.id);
  });

  it('deve retornar 404 em rota de fornecedor inexistente por id quando endpoint não existe', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .get('/api/suppliers/supplier-inexistente')
      .set(authHeader(token));

    expect(response.status).toBe(404);
  });
});