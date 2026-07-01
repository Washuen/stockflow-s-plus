import crypto from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { app, request, loginAsAdmin, authHeader } from '../helpers.js';

async function createUser(token, overrides = {}) {
  const unique = crypto.randomUUID();

  const response = await request(app)
    .post('/api/users')
    .set(authHeader(token))
    .send({
      name: `Usuário Teste ${unique}`,
      email: `user-${unique}@stockflow.dev`,
      password: '123456',
      role: 'SALES',
      ...overrides
    });

  expect(response.status).toBe(201);
  expect(response.body.passwordHash).toBeUndefined();

  return response.body;
}

async function getOwner(token) {
  const response = await request(app)
    .get('/api/users')
    .set(authHeader(token));

  expect(response.status).toBe(200);

  const owner = response.body.find((user) => user.role === 'OWNER');

  expect(owner).toBeTruthy();

  return owner;
}

async function getCurrentUser(token) {
  const response = await request(app)
    .get('/api/auth/me')
    .set(authHeader(token));

  expect(response.status).toBe(200);

  const user = response.body.user || response.body;

  expect(user).toBeTruthy();
  expect(user.id).toBeTruthy();

  return user;
}

describe('Users API', () => {
  it('deve listar usuários autenticado', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .get('/api/users')
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('deve criar usuário com role SALES', async () => {
    const token = await loginAsAdmin();
    const email = `sales-${crypto.randomUUID()}@stockflow.dev`;

    const response = await request(app)
      .post('/api/users')
      .set(authHeader(token))
      .send({
        name: 'Usuário Sales Teste',
        email,
        password: '123456',
        role: 'SALES'
      });

    expect(response.status).toBe(201);
    expect(response.body.email).toBe(email);
    expect(response.body.role).toBe('SALES');
    expect(response.body.passwordHash).toBeUndefined();
  });

  it('deve criar usuário com role STOCK', async () => {
    const token = await loginAsAdmin();

    const user = await createUser(token, {
      name: 'Usuário Stock Teste',
      email: `stock-${crypto.randomUUID()}@stockflow.dev`,
      role: 'STOCK'
    });

    expect(user.role).toBe('STOCK');
  });

  it('deve criar usuário com role FINANCE', async () => {
    const token = await loginAsAdmin();

    const user = await createUser(token, {
      name: 'Usuário Finance Teste',
      email: `finance-${crypto.randomUUID()}@stockflow.dev`,
      role: 'FINANCE'
    });

    expect(user.role).toBe('FINANCE');
  });

  it('deve bloquear criação de usuário sem token', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        name: 'Usuário Sem Token',
        email: `sem-token-${crypto.randomUUID()}@stockflow.dev`,
        password: '123456',
        role: 'SALES'
      });

    expect(response.status).toBe(401);
  });

  it('deve bloquear usuário com e-mail duplicado', async () => {
    const token = await loginAsAdmin();
    const email = `duplicado-${crypto.randomUUID()}@stockflow.dev`;

    const firstResponse = await request(app)
      .post('/api/users')
      .set(authHeader(token))
      .send({
        name: 'Usuário Duplicado',
        email,
        password: '123456',
        role: 'SALES'
      });

    expect(firstResponse.status).toBe(201);

    const secondResponse = await request(app)
      .post('/api/users')
      .set(authHeader(token))
      .send({
        name: 'Usuário Duplicado 2',
        email,
        password: '123456',
        role: 'SALES'
      });

    expect([400, 409]).toContain(secondResponse.status);
  });

  it('deve bloquear criação de usuário com dados inválidos', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .post('/api/users')
      .set(authHeader(token))
      .send({
        name: '',
        email: 'email-invalido',
        password: '123',
        role: 'INVALID_ROLE'
      });

    expect(response.status).toBe(400);
  });

  it('deve atualizar cargo de usuário via rota /role', async () => {
    const token = await loginAsAdmin();

    const user = await createUser(token, {
      role: 'SALES',
      email: `role-route-${crypto.randomUUID()}@stockflow.dev`
    });

    const response = await request(app)
      .patch(`/api/users/${user.id}/role`)
      .set(authHeader(token))
      .send({
        role: 'FINANCE'
      });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(user.id);
    expect(response.body.role).toBe('FINANCE');
    expect(response.body.passwordHash).toBeUndefined();
  });

  it('deve bloquear atualização de cargo com role inválida', async () => {
    const token = await loginAsAdmin();

    const user = await createUser(token, {
      role: 'SALES',
      email: `invalid-role-${crypto.randomUUID()}@stockflow.dev`
    });

    const response = await request(app)
      .patch(`/api/users/${user.id}/role`)
      .set(authHeader(token))
      .send({
        role: 'INVALID_ROLE'
      });

    expect(response.status).toBe(400);
  });

  it('deve retornar 404 ao atualizar cargo de usuário inexistente', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .patch('/api/users/user-inexistente/role')
      .set(authHeader(token))
      .send({
        role: 'SALES'
      });

    expect(response.status).toBe(404);
  });

  it('deve alterar status via /admin-status para desativar usuário', async () => {
    const token = await loginAsAdmin();

    const user = await createUser(token, {
      email: `admin-status-off-${crypto.randomUUID()}@stockflow.dev`
    });

    const response = await request(app)
      .patch(`/api/users/${user.id}/admin-status`)
      .set(authHeader(token))
      .send({
        isActive: false
      });

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(user.id);
    expect(response.body.user.isActive).toBe(false);
    expect(response.body.message).toContain('desativado');
  });

  it('deve alterar status via /admin-status para reativar usuário', async () => {
    const token = await loginAsAdmin();

    const user = await createUser(token, {
      email: `admin-status-on-${crypto.randomUUID()}@stockflow.dev`
    });

    const deactivateResponse = await request(app)
      .patch(`/api/users/${user.id}/admin-status`)
      .set(authHeader(token))
      .send({
        isActive: false
      });

    expect(deactivateResponse.status).toBe(200);

    const reactivateResponse = await request(app)
      .patch(`/api/users/${user.id}/admin-status`)
      .set(authHeader(token))
      .send({
        isActive: true
      });

    expect(reactivateResponse.status).toBe(200);
    expect(reactivateResponse.body.user.id).toBe(user.id);
    expect(reactivateResponse.body.user.isActive).toBe(true);
    expect(reactivateResponse.body.message).toContain('reativado');
  });

  it('deve bloquear /admin-status sem isActive booleano', async () => {
    const token = await loginAsAdmin();

    const user = await createUser(token, {
      email: `admin-status-invalid-${crypto.randomUUID()}@stockflow.dev`
    });

    const response = await request(app)
      .patch(`/api/users/${user.id}/admin-status`)
      .set(authHeader(token))
      .send({
        isActive: 'false'
      });

    expect(response.status).toBe(400);
  });

 it('deve bloquear /admin-status ao tentar desativar a própria conta', async () => {
  const token = await loginAsAdmin();
  const currentUser = await getCurrentUser(token);

  const response = await request(app)
    .patch(`/api/users/${currentUser.id}/admin-status`)
    .send({ isActive: false })
    .set(authHeader(token));

  expect(response.status).toBe(400);
});

  it('deve retornar 404 no /admin-status para usuário inexistente', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .patch('/api/users/user-inexistente/admin-status')
      .set(authHeader(token))
      .send({
        isActive: false
      });

    expect(response.status).toBe(404);
  });

  it('deve funcionar pela rota compatível /status', async () => {
    const token = await loginAsAdmin();

    const user = await createUser(token, {
      email: `status-alias-${crypto.randomUUID()}@stockflow.dev`
    });

    const response = await request(app)
      .patch(`/api/users/${user.id}/status`)
      .set(authHeader(token))
      .send({
        isActive: false
      });

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(user.id);
    expect(response.body.user.isActive).toBe(false);
  });

  it('deve desativar usuário via /deactivate', async () => {
    const token = await loginAsAdmin();

    const user = await createUser(token, {
      email: `deactivate-route-${crypto.randomUUID()}@stockflow.dev`
    });

    const response = await request(app)
      .patch(`/api/users/${user.id}/deactivate`)
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(user.id);
    expect(response.body.user.isActive).toBe(false);
  });

it('deve bloquear /deactivate ao tentar desativar a própria conta', async () => {
  const token = await loginAsAdmin();
  const currentUser = await getCurrentUser(token);

  const response = await request(app)
    .patch(`/api/users/${currentUser.id}/deactivate`)
    .set(authHeader(token));

  expect(response.status).toBe(400);
});

  it('deve retornar 404 ao desativar usuário inexistente via /deactivate', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .patch('/api/users/user-inexistente/deactivate')
      .set(authHeader(token));

    expect(response.status).toBe(404);
  });

  it('deve reativar usuário via /reactivate', async () => {
    const token = await loginAsAdmin();

    const user = await createUser(token, {
      email: `reactivate-route-${crypto.randomUUID()}@stockflow.dev`
    });

    const deactivateResponse = await request(app)
      .patch(`/api/users/${user.id}/deactivate`)
      .set(authHeader(token));

    expect(deactivateResponse.status).toBe(200);

    const response = await request(app)
      .patch(`/api/users/${user.id}/reactivate`)
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(user.id);
    expect(response.body.user.isActive).toBe(true);
  });

  it('deve retornar 404 ao reativar usuário inexistente via /reactivate', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .patch('/api/users/user-inexistente/reactivate')
      .set(authHeader(token));

    expect(response.status).toBe(404);
  });

  it('deve desativar usuário via DELETE /api/users/:id', async () => {
    const token = await loginAsAdmin();

    const user = await createUser(token, {
      email: `delete-route-${crypto.randomUUID()}@stockflow.dev`
    });

    const response = await request(app)
      .delete(`/api/users/${user.id}`)
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(user.id);
    expect(response.body.user.isActive).toBe(false);
  });

it('deve bloquear DELETE ao tentar desativar a própria conta', async () => {
  const token = await loginAsAdmin();
  const currentUser = await getCurrentUser(token);

  const response = await request(app)
    .delete(`/api/users/${currentUser.id}`)
    .set(authHeader(token));

  expect(response.status).toBe(400);
});

  it('deve retornar 404 ao deletar usuário inexistente', async () => {
    const token = await loginAsAdmin();

    const response = await request(app)
      .delete('/api/users/user-inexistente')
      .set(authHeader(token));

    expect(response.status).toBe(404);
  });
});