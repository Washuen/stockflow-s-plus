const bcrypt = require('bcryptjs');
const { prisma } = require('../config/prisma');
const { sanitizeUser } = require('./auth.service');

async function listUsers(companyId) {
  const users = await prisma.user.findMany({
    where: { companyId },
    orderBy: [
      { isActive: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  return users.map(sanitizeUser);
}

async function createUser(companyId, creatorUserId, data) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (existingUser) {
    const error = new Error('E-mail já cadastrado');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      companyId
    }
  });

  await prisma.auditLog.create({
    data: {
      action: 'USER_CREATED',
      entity: 'User',
      entityId: user.id,
      userId: creatorUserId,
      companyId,
      metadata: {
        email: user.email,
        role: user.role
      }
    }
  });

  return sanitizeUser(user);
}

async function updateUserRole(companyId, actorUserId, targetUserId, role) {
  if (actorUserId === targetUserId) {
    const error = new Error('Você não pode alterar o próprio cargo logado');
    error.statusCode = 400;
    throw error;
  }

  const target = await prisma.user.findFirst({
    where: { id: targetUserId, companyId }
  });

  if (!target) {
    const error = new Error('Usuário não encontrado');
    error.statusCode = 404;
    throw error;
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { role }
  });

  await prisma.auditLog.create({
    data: {
      action: 'USER_ROLE_UPDATED',
      entity: 'User',
      entityId: targetUserId,
      userId: actorUserId,
      companyId,
      metadata: {
        previousRole: target.role,
        newRole: role
      }
    }
  });

  return sanitizeUser(updated);
}

async function writeUserAuditSafe({ action, companyId, actorUserId, targetUserId, metadata = {} }) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity: 'User',
        entityId: targetUserId,
        userId: actorUserId,
        companyId,
        metadata
      }
    });
  } catch (error) {
    // A auditoria não deve impedir uma ação administrativa principal.
    console.warn('[StockFlow Audit Warning]', error.message);
  }
}

async function setUserActiveStatus(companyId, actorUserId, targetUserId, isActive) {
  if (actorUserId === targetUserId && isActive === false) {
    const error = new Error('Você não pode desativar sua própria conta logada');
    error.statusCode = 400;
    throw error;
  }

  const target = await prisma.user.findFirst({
    where: { id: targetUserId, companyId }
  });

  if (!target) {
    const error = new Error('Usuário não encontrado');
    error.statusCode = 404;
    throw error;
  }

  if (target.isActive === isActive) {
    const error = new Error(isActive ? 'Usuário já está ativo' : 'Usuário já está desativado');
    error.statusCode = 400;
    throw error;
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      isActive,
      deletedAt: isActive ? null : new Date()
    }
  });

  await writeUserAuditSafe({
    action: isActive ? 'USER_REACTIVATED' : 'USER_DEACTIVATED',
    companyId,
    actorUserId,
    targetUserId,
    metadata: {
      email: target.email,
      name: target.name,
      role: target.role,
      previousStatus: target.isActive,
      newStatus: isActive
    }
  });

  return {
    message: isActive ? 'Usuário reativado com sucesso' : 'Usuário desativado com sucesso',
    user: sanitizeUser(updated)
  };
}

async function deactivateUser(companyId, actorUserId, targetUserId) {
  return setUserActiveStatus(companyId, actorUserId, targetUserId, false);
}

async function reactivateUser(companyId, actorUserId, targetUserId) {
  return setUserActiveStatus(companyId, actorUserId, targetUserId, true);
}

async function deleteUser(companyId, actorUserId, targetUserId) {
  return deactivateUser(companyId, actorUserId, targetUserId);
}

module.exports = {
  listUsers,
  createUser,
  updateUserRole,
  setUserActiveStatus,
  deactivateUser,
  reactivateUser,
  deleteUser
};
