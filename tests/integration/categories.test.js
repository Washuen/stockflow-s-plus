import crypto from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { app, request, loginAsAdmin, authHeader } from '../helpers.js';

async function createCategory(token, overrides = {}) {
  const unique = crypto.randomUUID();

  const response = await request(app)
    .post('/api/categories')
    .set(authHeader(token))
    .send({
      name: `Categoria Teste ${unique}`,
      description: `Descrição teste ${unique}`,
      ...overrides
    });

  expect(response.status).toBe(201);

  return response.body;
}

describe('Categories API', () => {
  it('deve listar categorias autenticado', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .get('/api/categories')
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('deve criar categoria autenticado', async () => {
    const token = await loginAsAdmin();
    const unique = crypto.randomUUID();

    const response = await request(app)
      .post('/api/categories')
      .set(authHeader(token))
      .send({
        name: `Categoria Criar ${unique}`,
        description: `Categoria criada em teste ${unique}`
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toContain('Categoria Criar');
  });

  it('deve bloquear criação de categoria sem token', async () => {
    const unique = crypto.randomUUID();

    const response = await request(app)
      .post('/api/categories')
      .send({
        name: `Categoria Sem Token ${unique}`,
        description: `Sem token ${unique}`
      });

    expect(response.status).toBe(401);
  });

  it('deve listar categoria criada na listagem', async () => {
    const token = await loginAsAdmin();

    const category = await createCategory(token, {
      name: `Categoria Listagem ${crypto.randomUUID()}`
    });

    const response = await request(app)
      .get('/api/categories')
      .set(authHeader(token));

    expect(response.status).toBe(200);

    const foundCategory = response.body.find(
      (item) => item.id === category.id
    );

    expect(foundCategory).toBeTruthy();
    expect(foundCategory.name).toBe(category.name);
  });

  it('deve permitir múltiplas categorias válidas', async () => {
    const token = await loginAsAdmin();

    const firstCategory = await createCategory(token, {
      name: `Categoria A ${crypto.randomUUID()}`
    });

    const secondCategory = await createCategory(token, {
      name: `Categoria B ${crypto.randomUUID()}`
    });

    expect(firstCategory.id).toBeTruthy();
    expect(secondCategory.id).toBeTruthy();
    expect(firstCategory.id).not.toBe(secondCategory.id);
  });

  it('deve retornar 404 em rota de categoria inexistente por id quando endpoint não existe', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .get('/api/categories/category-inexistente')
      .set(authHeader(token));

    expect(response.status).toBe(404);
  });
});