const { prisma } = require('../config/prisma');
const { verifyToken } = require('../utils/jwt');
const { can } = require('../utils/permissions');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Token de autenticação não informado'
      });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { company: true }
    });

    if (!user) {
      return res.status(401).json({
        message: 'Usuário inválido ou não encontrado'
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        message: 'Usuário desativado. Entre em contato com um administrador.'
      });
    }

    req.user = user;
    req.companyId = user.companyId;

    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Token inválido ou expirado'
    });
  }
}

function authorize(permission) {
  return function permissionMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        message: 'Usuário não autenticado'
      });
    }

    if (!can(req.user.role, permission)) {
      return res.status(403).json({
        message: 'Você não possui permissão para executar esta ação',
        requiredPermission: permission,
        role: req.user.role
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  authorize
};
