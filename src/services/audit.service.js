const { prisma } = require('../config/prisma');

function normalizeAuditLog(log) {
  const metadata = log.metadata || {};
  const moduleName = metadata.module || metadata.entity || log.entity || 'Sistema';
  const details = metadata.details || metadata.message || metadata.reason || JSON.stringify(metadata);

  return {
    id: log.id,
    date: log.createdAt,
    createdAt: log.createdAt,
    userName: log.user?.name || 'Sistema',
    userEmail: log.user?.email || '-',
    userRole: log.user?.role || '-',
    module: moduleName,
    entity: log.entity || moduleName,
    entityId: log.entityId,
    action: log.action || 'EVENT',
    details,
    metadata
  };
}

async function listAuditLogs(companyId, filters = {}) {
  const where = { companyId };

  if (filters.entity && filters.entity !== 'ALL') where.entity = filters.entity;
  if (filters.action && filters.action !== 'ALL') where.action = filters.action;

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, role: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 250
  });

  return logs.map(normalizeAuditLog);
}

async function auditSummary(companyId) {
  const logs = await listAuditLogs(companyId);

  const users = new Set(logs.map(log => log.userEmail).filter(Boolean));
  const criticalActions = logs.filter(log => {
    const action = String(log.action || '').toUpperCase();
    return action.includes('CANCEL') ||
      action.includes('DEACTIVATE') ||
      action.includes('REACTIVATE') ||
      action.includes('DELETE') ||
      action.includes('OWNER') ||
      action.includes('ROLE') ||
      action.includes('STATUS');
  });

  return {
    total: logs.length,
    users: users.size,
    critical: criticalActions.length,
    latest: logs.slice(0, 250)
  };
}

async function createAuditLog({ action, entity, entityId, userId, companyId, metadata = {} }) {
  return prisma.auditLog.create({
    data: { action, entity, entityId, userId, companyId, metadata }
  });
}

module.exports = {
  listAuditLogs,
  auditSummary,
  createAuditLog
};
