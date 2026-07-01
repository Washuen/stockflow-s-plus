import 'dotenv/config';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { describe, it, expect } from 'vitest';
import { prisma } from '../../src/config/prisma';
import userService from '../../src/services/user.service';

async function getDemoCompany() {
  let company = await prisma.company.findFirst({
    where: {
      OR: [
        { name: 'StockFlow Demo Company' },
        { document: '00000000000100' },
        { document: '00.000.000/0001-00' }
      ]
    }
  });

  if (company) return company;

  company = await prisma.company.findFirst();

  if (company) return company;

  return prisma.company.create({
    data: {
      name: 'StockFlow Demo Company',
      document: '00000000000100'
    }
  });
}

async function createRawUser(overrides = {}) {
  const company = await getDemoCompany();
  const unique = crypto.randomUUID();

  return prisma.user.create({
    data: {
      name: `Usuário Service ${unique}`,
      email: `user-service-${unique}@stockflow.dev`,
      passwordHash: await bcrypt.hash('123456', 10),
      role: 'SALES',
      isActive: true,
      deletedAt: null,
      companyId: company.id,
      ...overrides
    }
  });
}

async function getActorUser(companyId) {
  let actor = await prisma.user.findFirst({
    where: {
      companyId,
      isActive: true,
      role: {
        in: ['OWNER', 'ADMIN']
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  if (actor) return actor;

  actor = await createRawUser({
    companyId,
    name: 'Owner Teste Unitário',
    email: `owner-unit-${crypto.randomUUID()}@stockflow.dev`,
    role: 'OWNER',
    isActive: true,
    deletedAt: null
  });

  return actor;
}

async function createOwnerUser(companyId, overrides = {}) {
  return createRawUser({
    companyId,
    name: 'Owner Protegido Teste',
    email: `owner-protected-${crypto.randomUUID()}@stockflow.dev`,
    role: 'OWNER',
    isActive: true,
    deletedAt: null,
    ...overrides
  });
}

async function createAdminUser(companyId, overrides = {}) {
  return createRawUser({
    companyId,
    name: 'Admin Teste Service',
    email: `admin-service-${crypto.randomUUID()}@stockflow.dev`,
    role: 'ADMIN',
    isActive: true,
    deletedAt: null,
    ...overrides
  });
}


describe('user.service', () => {
  it('deve listar usuários sem retornar passwordHash', async () => {
    const company = await getDemoCompany();

    await createRawUser({
      companyId: company.id,
      email: `list-${crypto.randomUUID()}@stockflow.dev`
    });

    const users = await userService.listUsers(company.id);

    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
    expect(users[0].passwordHash).toBeUndefined();
  });

  it('deve criar usuário e registrar auditoria', async () => {
    const company = await getDemoCompany();
    const actor = await getActorUser(company.id);
    const unique = crypto.randomUUID();

    const user = await userService.createUser(company.id, actor.id, {
      name: 'Usuário Criado Service',
      email: `created-service-${unique}@stockflow.dev`,
      password: '123456',
      role: 'STOCK'
    });

    expect(user.id).toBeTruthy();
    expect(user.name).toBe('Usuário Criado Service');
    expect(user.email).toBe(`created-service-${unique}@stockflow.dev`);
    expect(user.role).toBe('STOCK');
    expect(user.passwordHash).toBeUndefined();

    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: 'USER_CREATED',
        entity: 'User',
        entityId: user.id,
        companyId: company.id
      }
    });

    expect(auditLog).toBeTruthy();
  });

  it('deve bloquear criação de usuário com e-mail duplicado', async () => {
    const company = await getDemoCompany();
    const actor = await getActorUser(company.id);
    const email = `duplicado-service-${crypto.randomUUID()}@stockflow.dev`;

    await userService.createUser(company.id, actor.id, {
      name: 'Usuário Duplicado 1',
      email,
      password: '123456',
      role: 'SALES'
    });

    await expect(
      userService.createUser(company.id, actor.id, {
        name: 'Usuário Duplicado 2',
        email,
        password: '123456',
        role: 'SALES'
      })
    ).rejects.toMatchObject({
      message: 'E-mail já cadastrado',
      statusCode: 409
    });
  });

  it('deve atualizar cargo de usuário', async () => {
    const company = await getDemoCompany();
    const actor = await getActorUser(company.id);

    const target = await createRawUser({
      companyId: company.id,
      role: 'SALES',
      email: `role-update-${crypto.randomUUID()}@stockflow.dev`
    });

    const updated = await userService.updateUserRole(
      company.id,
      actor.id,
      target.id,
      'FINANCE'
    );

    expect(updated.id).toBe(target.id);
    expect(updated.role).toBe('FINANCE');
    expect(updated.passwordHash).toBeUndefined();

    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: 'USER_ROLE_UPDATED',
        entity: 'User',
        entityId: target.id,
        companyId: company.id
      }
    });

    expect(auditLog).toBeTruthy();
  });

  it('deve permitir Owner alterar cargo de usuário comum', async () => {
    const company = await getDemoCompany();

    const owner = await createOwnerUser(company.id);
    const target = await createRawUser({
      companyId: company.id,
      role: 'SALES',
      email: `owner-can-update-role-${crypto.randomUUID()}@stockflow.dev`
    });

    const updated = await userService.updateUserRole(
      company.id,
      owner.id,
      target.id,
      'STOCK'
    );

    expect(updated.id).toBe(target.id);
    expect(updated.role).toBe('STOCK');
    expect(updated.passwordHash).toBeUndefined();
  });

  it('deve bloquear Admin ao tentar alterar cargo do Owner', async () => {
    const company = await getDemoCompany();

    const admin = await createAdminUser(company.id);
    const owner = await createOwnerUser(company.id);

    await expect(
      userService.updateUserRole(company.id, admin.id, owner.id, 'ADMIN')
    ).rejects.toMatchObject({
      message: 'Administrador não pode alterar cargo do Owner',
      statusCode: 403
    });
  });

  it('deve bloquear alteração do próprio cargo', async () => {
    const company = await getDemoCompany();
    const actor = await getActorUser(company.id);

    await expect(
      userService.updateUserRole(company.id, actor.id, actor.id, 'SALES')
    ).rejects.toMatchObject({
      message: 'Você não pode alterar o próprio cargo logado',
      statusCode: 400
    });
  });

  it('deve retornar 404 ao atualizar cargo de usuário inexistente', async () => {
    const company = await getDemoCompany();
    const actor = await getActorUser(company.id);

    await expect(
      userService.updateUserRole(company.id, actor.id, 'user-inexistente', 'SALES')
    ).rejects.toMatchObject({
      message: 'Usuário não encontrado',
      statusCode: 404
    });
  });

  it('deve retornar erro quando executor da alteração de cargo não existir', async () => {
    const company = await getDemoCompany();

    const target = await createRawUser({
      companyId: company.id,
      role: 'SALES',
      email: `missing-actor-role-${crypto.randomUUID()}@stockflow.dev`
    });

    await expect(
      userService.updateUserRole(company.id, 'actor-inexistente', target.id, 'FINANCE')
    ).rejects.toMatchObject({
      message: 'Usuário executor não encontrado',
      statusCode: 404
    });
  });

  it('deve desativar usuário', async () => {
    const company = await getDemoCompany();
    const actor = await getActorUser(company.id);

    const target = await createRawUser({
      companyId: company.id,
      isActive: true,
      email: `deactivate-service-${crypto.randomUUID()}@stockflow.dev`
    });

    const result = await userService.deactivateUser(company.id, actor.id, target.id);

    expect(result.message).toBe('Usuário desativado com sucesso');
    expect(result.user.id).toBe(target.id);
    expect(result.user.isActive).toBe(false);
    expect(result.user.passwordHash).toBeUndefined();

    const updatedInDb = await prisma.user.findUnique({
      where: { id: target.id }
    });

    expect(updatedInDb.isActive).toBe(false);
    expect(updatedInDb.deletedAt).toBeTruthy();
  });

  it('deve permitir Owner desativar usuário comum', async () => {
    const company = await getDemoCompany();

    const owner = await createOwnerUser(company.id);
    const target = await createRawUser({
      companyId: company.id,
      isActive: true,
      email: `owner-deactivate-${crypto.randomUUID()}@stockflow.dev`
    });

    const result = await userService.deactivateUser(company.id, owner.id, target.id);

    expect(result.message).toBe('Usuário desativado com sucesso');
    expect(result.user.id).toBe(target.id);
    expect(result.user.isActive).toBe(false);
    expect(result.user.passwordHash).toBeUndefined();
  });

  it('deve bloquear Admin ao tentar desativar Owner', async () => {
    const company = await getDemoCompany();

    const admin = await createAdminUser(company.id);
    const owner = await createOwnerUser(company.id);

    await expect(
      userService.deactivateUser(company.id, admin.id, owner.id)
    ).rejects.toMatchObject({
      message: 'Administrador não pode alterar status do Owner',
      statusCode: 403
    });
  });

  it('deve bloquear Admin ao tentar reativar Owner', async () => {
    const company = await getDemoCompany();

    const admin = await createAdminUser(company.id);
    const owner = await createOwnerUser(company.id, {
      isActive: false,
      deletedAt: new Date()
    });

    await expect(
      userService.reactivateUser(company.id, admin.id, owner.id)
    ).rejects.toMatchObject({
      message: 'Administrador não pode alterar status do Owner',
      statusCode: 403
    });
  });

  it('deve reativar usuário', async () => {
    const company = await getDemoCompany();
    const actor = await getActorUser(company.id);

    const target = await createRawUser({
      companyId: company.id,
      isActive: false,
      deletedAt: new Date(),
      email: `reactivate-service-${crypto.randomUUID()}@stockflow.dev`
    });

    const result = await userService.reactivateUser(company.id, actor.id, target.id);

    expect(result.message).toBe('Usuário reativado com sucesso');
    expect(result.user.id).toBe(target.id);
    expect(result.user.isActive).toBe(true);
    expect(result.user.passwordHash).toBeUndefined();

    const updatedInDb = await prisma.user.findUnique({
      where: { id: target.id }
    });

    expect(updatedInDb.isActive).toBe(true);
    expect(updatedInDb.deletedAt).toBeNull();
  });

  it('deve usar deleteUser como desativação lógica', async () => {
    const company = await getDemoCompany();
    const actor = await getActorUser(company.id);

    const target = await createRawUser({
      companyId: company.id,
      isActive: true,
      email: `delete-service-${crypto.randomUUID()}@stockflow.dev`
    });

    const result = await userService.deleteUser(company.id, actor.id, target.id);

    expect(result.message).toBe('Usuário desativado com sucesso');
    expect(result.user.isActive).toBe(false);
    expect(result.user.passwordHash).toBeUndefined();
  });

  it('deve bloquear desativação da própria conta logada', async () => {
    const company = await getDemoCompany();
    const actor = await getActorUser(company.id);

    await expect(
      userService.deactivateUser(company.id, actor.id, actor.id)
    ).rejects.toMatchObject({
      message: 'Você não pode desativar sua própria conta logada',
      statusCode: 400
    });
  });

  it('deve retornar 404 ao alterar status de usuário inexistente', async () => {
    const company = await getDemoCompany();
    const actor = await getActorUser(company.id);

    await expect(
      userService.setUserActiveStatus(company.id, actor.id, 'user-inexistente', false)
    ).rejects.toMatchObject({
      message: 'Usuário não encontrado',
      statusCode: 404
    });
  });

  it('deve retornar erro quando executor da alteração de status não existir', async () => {
    const company = await getDemoCompany();

    const target = await createRawUser({
      companyId: company.id,
      isActive: true,
      email: `missing-actor-status-${crypto.randomUUID()}@stockflow.dev`
    });

    await expect(
      userService.setUserActiveStatus(company.id, 'actor-inexistente', target.id, false)
    ).rejects.toMatchObject({
      message: 'Usuário executor não encontrado',
      statusCode: 404
    });
  });

  it('deve bloquear desativar usuário já desativado', async () => {
    const company = await getDemoCompany();
    const actor = await getActorUser(company.id);

    const target = await createRawUser({
      companyId: company.id,
      isActive: false,
      deletedAt: new Date(),
      email: `already-inactive-${crypto.randomUUID()}@stockflow.dev`
    });

    await expect(
      userService.deactivateUser(company.id, actor.id, target.id)
    ).rejects.toMatchObject({
      message: 'Usuário já está desativado',
      statusCode: 400
    });
  });

  it('deve bloquear reativar usuário já ativo', async () => {
    const company = await getDemoCompany();
    const actor = await getActorUser(company.id);

    const target = await createRawUser({
      companyId: company.id,
      isActive: true,
      email: `already-active-${crypto.randomUUID()}@stockflow.dev`
    });

    await expect(
      userService.reactivateUser(company.id, actor.id, target.id)
    ).rejects.toMatchObject({
      message: 'Usuário já está ativo',
      statusCode: 400
    });
  });

  it('deve alterar status diretamente para false via setUserActiveStatus', async () => {
    const company = await getDemoCompany();
    const actor = await getActorUser(company.id);

    const target = await createRawUser({
      companyId: company.id,
      isActive: true,
      email: `direct-status-false-${crypto.randomUUID()}@stockflow.dev`
    });

    const result = await userService.setUserActiveStatus(
      company.id,
      actor.id,
      target.id,
      false
    );

    expect(result.message).toBe('Usuário desativado com sucesso');
    expect(result.user.id).toBe(target.id);
    expect(result.user.isActive).toBe(false);
    expect(result.user.deletedAt).toBeTruthy();
    expect(result.user.passwordHash).toBeUndefined();
  });

  it('deve alterar status diretamente para true via setUserActiveStatus', async () => {
    const company = await getDemoCompany();
    const actor = await getActorUser(company.id);

    const target = await createRawUser({
      companyId: company.id,
      isActive: false,
      deletedAt: new Date(),
      email: `direct-status-true-${crypto.randomUUID()}@stockflow.dev`
    });

    const result = await userService.setUserActiveStatus(
      company.id,
      actor.id,
      target.id,
      true
    );

    expect(result.message).toBe('Usuário reativado com sucesso');
    expect(result.user.id).toBe(target.id);
    expect(result.user.isActive).toBe(true);
    expect(result.user.deletedAt).toBeNull();
    expect(result.user.passwordHash).toBeUndefined();
  });

  it('deve criar auditoria ao alterar status de usuário', async () => {
    const company = await getDemoCompany();
    const actor = await getActorUser(company.id);

    const target = await createRawUser({
      companyId: company.id,
      isActive: true,
      email: `audit-status-${crypto.randomUUID()}@stockflow.dev`
    });

    await userService.setUserActiveStatus(
      company.id,
      actor.id,
      target.id,
      false
    );

    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: 'USER_DEACTIVATED',
        entity: 'User',
        entityId: target.id,
        companyId: company.id
      }
    });

    expect(auditLog).toBeTruthy();
    expect(auditLog.metadata).toBeTruthy();
  });
});