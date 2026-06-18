const express = require('express');
const { prisma } = require('../config/prisma');
const { asyncHandler } = require('../utils/asyncHandler');
const { authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', authorize('categories:read'), asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { companyId: req.companyId },
    orderBy: { name: 'asc' }
  });
  res.json(categories);
}));

router.post('/', authorize('categories:create'), asyncHandler(async (req, res) => {
  const category = await prisma.category.create({
    data: {
      name: req.body.name,
      companyId: req.companyId
    }
  });
  res.status(201).json(category);
}));

module.exports = router;
