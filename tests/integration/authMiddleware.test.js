import 'dotenv/config';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { describe, it, expect, vi } from 'vitest';
import { app, request, loginAsAdmin } from '../helpers.js';
import { authenticate, authorize } from '../../src/middlewares/authMiddleware';

function mockResponse() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function mockNext() {
  return vi.fn();
}

function signTestToken(payload) {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'stockflow-dev-secret',
    {
      expiresIn: '7d'
    }
  );
}

describe('authMiddleware', () => {
  it('deve autenticar usuário com token válido real', async () => {
    const token = await loginAsAdmin();

    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };

    const res = mockResponse();
    const next = mockNext();

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toBeTruthy();
    expect(req.user.email).toBe('owner@stockflow.dev');
    expect(req.user.role).toBe('OWNER');
    expect(req.companyId).toBeTruthy();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('deve bloquear requisição sem header authorization', async () => {
    const req = {
      headers: {}
    };

    const res = mockResponse();
    const next = mockNext();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('deve bloquear authorization sem Bearer token', async () => {
    const req = {
      headers: {
        authorization: 'Token invalido'
      }
    };

    const res = mockResponse();
    const next = mockNext();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('deve bloquear token inválido', async () => {
    const req = {
      headers: {
        authorization: 'Bearer token-invalido'
      }
    };

    const res = mockResponse();
    const next = mockNext();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('deve bloquear usuário inexistente', async () => {
    const token = signTestToken({
      sub: 'user-inexistente',
      companyId: 'company-1',
      role: 'ADMIN'
    });

    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };

    const res = mockResponse();
    const next = mockNext();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('deve bloquear usuário inativo', async () => {
    const adminToken = await loginAsAdmin();

    const createResponse = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Usuário Inativo Middleware',
        email: `inactive-${crypto.randomUUID()}@stockflow.dev`,
        password: '123456',
        role: 'SALES'
      });

    expect(createResponse.status).toBe(201);

    const deactivateResponse = await request(app)
      .patch(`/api/users/${createResponse.body.id}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deactivateResponse.status).toBe(200);

    const inactiveToken = signTestToken({
      sub: createResponse.body.id,
      companyId: createResponse.body.companyId,
      role: createResponse.body.role
    });

    const req = {
      headers: {
        authorization: `Bearer ${inactiveToken}`
      }
    };

    const res = mockResponse();
    const next = mockNext();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('deve autorizar OWNER para qualquer permissão', () => {
    const req = {
      user: {
        role: 'OWNER'
      }
    };

    const res = mockResponse();
    const next = mockNext();

    const middleware = authorize('qualquer:permissao');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('deve autorizar usuário com permissão adequada', () => {
    const req = {
      user: {
        role: 'ADMIN'
      }
    };

    const res = mockResponse();
    const next = mockNext();

    const middleware = authorize('products:read');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('deve bloquear usuário sem permissão adequada', () => {
    const req = {
      user: {
        role: 'SALES'
      }
    };

    const res = mockResponse();
    const next = mockNext();

    const middleware = authorize('products:create');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('deve bloquear autorização sem usuário autenticado', () => {
    const req = {};

    const res = mockResponse();
    const next = mockNext();

    const middleware = authorize('products:read');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});