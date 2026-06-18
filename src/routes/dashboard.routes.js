const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { authorize } = require('../middlewares/authMiddleware');
const dashboardService = require('../services/dashboard.service');

const router = express.Router();

router.get('/summary', authorize('dashboard:read'), asyncHandler(async (req, res) => {
  const summary = await dashboardService.getDashboardSummary(req.companyId);
  res.json(summary);
}));

module.exports = router;
