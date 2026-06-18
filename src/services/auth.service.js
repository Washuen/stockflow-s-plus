const bcrypt = require('bcryptjs');
const { prisma } = require('../config/prisma');

const OWNER_EMAIL = 'owner@stockflow.dev';
const LEGACY_OWNER_EMAIL = 'admin@stockflow.dev';
const { signToken } = require('../utils/jwt');

async function register(data) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (existingUser) {
    const error = new Error('E-mail já cadastrado');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: data.companyName || `${data.name} Company`,
        email: data.email
      }
    });

    const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: 'ADMIN',
        companyId: company.id
      },
      include: { company: true }
    });

    await tx.auditLog.create({
      data: {
        action: 'USER_REGISTERED',
        entity: 'User',
        entityId: user.id,
        userId: user.id,
        companyId: company.id,
        metadata: {
          email: user.email,
          role: user.role
        }
      }
    });

    return user;
  });

  const token = signToken(result);

  return {
    token,
    user: sanitizeUser(result)
  };
}

async function login(data) {
  const normalizedEmail = data.email === LEGACY_OWNER_EMAIL ? OWNER_EMAIL : data.email;
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { company: true }
  });

  if (!user) {
    const error = new Error('Credenciais inválidas');
    error.statusCode = 401;
    throw error;
  }

  if (user.isActive === false) {
    const error = new Error('Usuário desativado. Entre em contato com um administrador.');
    error.statusCode = 403;
    throw error;
  }

  const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);

  if (!isValidPassword) {
    const error = new Error('Credenciais inválidas');
    error.statusCode = 401;
    throw error;
  }

  await prisma.auditLog.create({
    data: {
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
      userId: user.id,
      companyId: user.companyId,
      metadata: {
        email: user.email,
        role: user.role
      }
    }
  });

  const token = signToken(user);

  return {
    token,
    user: sanitizeUser(user)
  };
}

function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

module.exports = {
  register,
  login,
  sanitizeUser
};
