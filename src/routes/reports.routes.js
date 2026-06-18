const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { authorize } = require('../middlewares/authMiddleware');
const dashboardService = require('../services/dashboard.service');

const router = express.Router();

router.get('/', authorize('reports:read'), asyncHandler(async (req, res) => {
  const reports = await dashboardService.getReports(req.companyId);
  res.json(reports);
}));

module.exports = router;
