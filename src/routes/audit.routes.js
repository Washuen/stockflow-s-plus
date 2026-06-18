const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const auditService = require('../services/audit.service');

const router = express.Router();

function ownerOrAdminOnly(req, res, next) {
  if (!['OWNER', 'ADMIN'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Apenas Owner ou Admin podem acessar auditoria' });
  }

  return next();
}

router.get('/', ownerOrAdminOnly, asyncHandler(async (req, res) => {
  const logs = await auditService.listAuditLogs(req.companyId, {
    entity: req.query.entity,
    action: req.query.action
  });

  res.json({
    total: logs.length,
    data: logs,
    logs
  });
}));

router.get('/summary', ownerOrAdminOnly, asyncHandler(async (req, res) => {
  const summary = await auditService.auditSummary(req.companyId);
  res.json(summary);
}));

module.exports = router;
