const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { authorize } = require('../middlewares/authMiddleware');
const { createUserSchema, updateUserRoleSchema } = require('../validators/auth.schemas');
const userService = require('../services/user.service');
const { prisma } = require('../config/prisma');

const router = express.Router();

function adminOnly(req, res, next) {
  if (!['OWNER', 'ADMIN'].includes(req.user?.role)) {
    return res.status(403).json({
      message: 'Apenas administradores podem gerenciar usuários'
    });
  }

  return next();
}

router.get('/', authorize('users:read'), asyncHandler(async (req, res) => {
  const users = await userService.listUsers(req.companyId);
  res.json(users);
}));

router.post('/', authorize('users:create'), asyncHandler(async (req, res) => {
  const data = createUserSchema.parse(req.body);
  const user = await userService.createUser(req.companyId, req.user.id, data);
  res.status(201).json(user);
}));

router.patch('/:id/role', adminOnly, asyncHandler(async (req, res) => {
  const data = updateUserRoleSchema.parse(req.body);
  const user = await userService.updateUserRole(req.companyId, req.user.id, req.params.id, data.role);
  res.json(user);
}));

// Rota administrativa direta e definitiva para status de usuário.
// Ela não depende de DELETE e não deixa auditoria ou vínculos históricos bloquearem a ação.
router.patch('/:id/admin-status', adminOnly, asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const targetUserId = req.params.id;

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({
      message: 'Informe isActive como true ou false'
    });
  }

  if (targetUserId === req.user.id && isActive === false) {
    return res.status(400).json({
      message: 'Você não pode desativar sua própria conta logada'
    });
  }

  const target = await prisma.user.findFirst({
    where: {
      id: targetUserId,
      companyId: req.companyId
    }
  });

  if (!target) {
    return res.status(404).json({
      message: 'Usuário não encontrado nesta empresa'
    });
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      isActive,
      deletedAt: isActive ? null : new Date()
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      deletedAt: true,
      companyId: true,
      createdAt: true,
      updatedAt: true
    }
  });

  // Auditoria opcional. Se falhar, não bloqueia a ação principal.
  try {
    await prisma.auditLog.create({
      data: {
        action: isActive ? 'USER_REACTIVATED' : 'USER_DEACTIVATED',
        entity: 'User',
        entityId: targetUserId,
        userId: req.user.id,
        companyId: req.companyId,
        metadata: {
          targetEmail: target.email,
          targetName: target.name,
          targetRole: target.role,
          previousStatus: target.isActive,
          newStatus: isActive
        }
      }
    });
  } catch (error) {
    console.warn('[StockFlow Audit Warning]', error.message);
  }

  return res.json({
    message: isActive ? 'Usuário reativado com sucesso' : 'Usuário desativado com sucesso',
    user: updated
  });
}));

// Rotas compatíveis com versões anteriores.
router.patch('/:id/status', adminOnly, asyncHandler(async (req, res) => {
  req.url = `/${req.params.id}/admin-status`;
  return router.handle(req, res);
}));

router.patch('/:id/deactivate', adminOnly, asyncHandler(async (req, res) => {
  const targetUserId = req.params.id;

  if (targetUserId === req.user.id) {
    return res.status(400).json({
      message: 'Você não pode desativar sua própria conta logada'
    });
  }

  const target = await prisma.user.findFirst({
    where: { id: targetUserId, companyId: req.companyId }
  });

  if (!target) {
    return res.status(404).json({ message: 'Usuário não encontrado nesta empresa' });
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { isActive: false, deletedAt: new Date() },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      deletedAt: true,
      companyId: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return res.json({ message: 'Usuário desativado com sucesso', user: updated });
}));

router.patch('/:id/reactivate', adminOnly, asyncHandler(async (req, res) => {
  const targetUserId = req.params.id;

  const target = await prisma.user.findFirst({
    where: { id: targetUserId, companyId: req.companyId }
  });

  if (!target) {
    return res.status(404).json({ message: 'Usuário não encontrado nesta empresa' });
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { isActive: true, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      deletedAt: true,
      companyId: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return res.json({ message: 'Usuário reativado com sucesso', user: updated });
}));

router.delete('/:id', adminOnly, asyncHandler(async (req, res) => {
  const targetUserId = req.params.id;

  if (targetUserId === req.user.id) {
    return res.status(400).json({
      message: 'Você não pode desativar sua própria conta logada'
    });
  }

  const target = await prisma.user.findFirst({
    where: { id: targetUserId, companyId: req.companyId }
  });

  if (!target) {
    return res.status(404).json({ message: 'Usuário não encontrado nesta empresa' });
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { isActive: false, deletedAt: new Date() },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      deletedAt: true,
      companyId: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return res.json({ message: 'Usuário desativado com sucesso', user: updated });
}));

module.exports = router;
