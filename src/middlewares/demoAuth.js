const { prisma } = require('../config/prisma');

/**
 * Fase 2 usa um usuário demo para permitir testar o backend antes da Fase 3.
 * Na Fase 3, este middleware será substituído por auth real com sessão/JWT.
 */
async function demoAuth(req, res, next) {
  const user = await prisma.user.findFirst({
    where: { email: 'owner@stockflow.dev' },
    include: { company: true }
  });

  if (!user) {
    return res.status(401).json({
      message: 'Usuário demo não encontrado. Rode npm run db:seed.'
    });
  }

  req.user = user;
  req.companyId = user.companyId;
  next();
}

module.exports = { demoAuth };
