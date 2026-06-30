import 'dotenv/config';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { describe, it, expect } from 'vitest';
import { prisma } from '../../src/config/prisma';
import authService from '../../src/services/auth.service';

async function getDemoCompany() {
  const company = await prisma.company.findFirst();

  if (!company) {
    throw new Error('Nenhuma empresa encontrada. Rode migrations e seed antes dos testes.');
  }

  return company;
}

async function createInactiveUser() {
  const company = await getDemoCompany();
  const unique = crypto.randomUUID();

  const user = await prisma.user.create({
    data: {
      name: 'Usuário Inativo Auth Service',
      email: `inactive-auth-${unique}@stockflow.dev`,
      passwordHash: await bcrypt.hash('123456', 10),
      role: 'SALES',
      isActive: false,
      companyId: company.id
    }
  });

  return user;
}

describe('auth.service', () => {
  describe('sanitizeUser', () => {
    it('deve remover passwordHash do usuário', () => {
      const user = {
        id: 'user-1',
        name: 'Usuário Teste',
        email: 'user@stockflow.dev',
        passwordHash: 'hash-secreto',
        role: 'ADMIN'
      };

      const result = authService.sanitizeUser(user);

      expect(result.passwordHash).toBeUndefined();
      expect(result.id).toBe('user-1');
      expect(result.email).toBe('user@stockflow.dev');
      expect(result.role).toBe('ADMIN');
    });
  });

  describe('login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const result = await authService.login({
        email: 'owner@stockflow.dev',
        password: '123456'
      });

      expect(result.token).toBeTruthy();
      expect(result.user.email).toBe('owner@stockflow.dev');
      expect(result.user.role).toBe('OWNER');
      expect(result.user.passwordHash).toBeUndefined();
      expect(result.user.company).toBeTruthy();
    });

    it('deve normalizar admin@stockflow.dev para owner@stockflow.dev', async () => {
      const result = await authService.login({
        email: 'admin@stockflow.dev',
        password: '123456'
      });

      expect(result.token).toBeTruthy();
      expect(result.user.email).toBe('owner@stockflow.dev');
      expect(result.user.role).toBe('OWNER');
      expect(result.user.passwordHash).toBeUndefined();
    });

    it('deve bloquear login com usuário inexistente', async () => {
      await expect(
        authService.login({
          email: `missing-${crypto.randomUUID()}@stockflow.dev`,
          password: '123456'
        })
      ).rejects.toMatchObject({
        message: 'Credenciais inválidas',
        statusCode: 401
      });
    });

    it('deve bloquear login de usuário inativo', async () => {
      const inactiveUser = await createInactiveUser();

      await expect(
        authService.login({
          email: inactiveUser.email,
          password: '123456'
        })
      ).rejects.toMatchObject({
        message: 'Usuário desativado. Entre em contato com um administrador.',
        statusCode: 403
      });
    });

    it('deve bloquear login com senha incorreta', async () => {
      await expect(
        authService.login({
          email: 'owner@stockflow.dev',
          password: 'senha-errada'
        })
      ).rejects.toMatchObject({
        message: 'Credenciais inválidas',
        statusCode: 401
      });
    });
  });

  describe('register', () => {
    it('deve registrar usuário e empresa', async () => {
      const unique = crypto.randomUUID();

      const result = await authService.register({
        name: 'Novo Usuário Auth Service',
        email: `novo-auth-${unique}@stockflow.dev`,
        password: '123456',
        companyName: `Empresa Auth ${unique}`
      });

      expect(result.token).toBeTruthy();
      expect(result.user.email).toBe(`novo-auth-${unique}@stockflow.dev`);
      expect(result.user.role).toBe('ADMIN');
      expect(result.user.passwordHash).toBeUndefined();
      expect(result.user.company).toBeTruthy();
      expect(result.user.company.name).toBe(`Empresa Auth ${unique}`);
    });

    it('deve usar nome padrão de empresa quando companyName não for informado', async () => {
      const unique = crypto.randomUUID();

      const result = await authService.register({
        name: 'Usuário Empresa Padrão',
        email: `default-company-${unique}@stockflow.dev`,
        password: '123456'
      });

      expect(result.token).toBeTruthy();
      expect(result.user.email).toBe(`default-company-${unique}@stockflow.dev`);
      expect(result.user.company).toBeTruthy();
      expect(result.user.company.name).toBe('Usuário Empresa Padrão Company');
    });

    it('deve bloquear registro com e-mail já cadastrado', async () => {
      const unique = crypto.randomUUID();
      const email = `duplicado-auth-${unique}@stockflow.dev`;

      await authService.register({
        name: 'Usuário Duplicado Auth',
        email,
        password: '123456',
        companyName: 'Empresa Duplicada Auth'
      });

      await expect(
        authService.register({
          name: 'Usuário Duplicado Auth 2',
          email,
          password: '123456',
          companyName: 'Empresa Duplicada Auth 2'
        })
      ).rejects.toMatchObject({
        message: 'E-mail já cadastrado',
        statusCode: 409
      });
    });
  });
});